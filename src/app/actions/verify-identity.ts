"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";

type GeminiForensicResult = {
  faceDetected: boolean;
  subjectCount: number;
  isSynthetic: boolean;
  isDigitalArtifact: boolean;
  deepfakeProbability: number;
  faceConfidence: number;
  evidence: string[];
  reasoning: string;
};

type IdentityVerdict = "REAL" | "DEEPFAKE" | "INVALID_ENTITY" | "REVIEW";

type IdentityResult = {
  success: true;
  verdict: IdentityVerdict;
  trustScore: number;
  deepfakeRisk: number;
  riskScore: number;
  risk: number;
  category: string;
  captureSource: string;
  reasoning: string;
  imageUrl: string;
  fileName: string;
  subjectCount: number;
  isSynthetic: boolean;
  isDigitalArtifact: boolean;
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableGeminiError(error: unknown) {
  const err = error as { status?: number; message?: string };
  const message = err.message?.toLowerCase() ?? "";

  return (
    err.status === 429 ||
    err.status === 500 ||
    err.status === 503 ||
    message.includes("429") ||
    message.includes("resource_exhausted") ||
    message.includes("rate limit") ||
    message.includes("overloaded") ||
    message.includes("unavailable")
  );
}

async function callGeminiWithRetry(
  prompt: string,
  filePart: { inlineData: { data: string; mimeType: string } },
  maxRetries = 4,
) {
  let waitTime = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent([prompt, filePart]);
      return result.response.text();
    } catch (error) {
      if (!isRetryableGeminiError(error) || attempt === maxRetries) {
        throw error;
      }

      console.warn(
        `[Gemini] Temporary failure. Retrying in ${waitTime / 1000}s (${attempt}/${maxRetries})`,
      );
      await delay(waitTime);
      waitTime *= 2;
    }
  }

  throw new Error("Gemini did not return a response.");
}

function clampScore(value: unknown) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function parseGeminiJson(responseText: string): GeminiForensicResult {
  const cleaned = responseText
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  const parsed = JSON.parse(cleaned) as Partial<GeminiForensicResult>;

  return {
    faceDetected: parsed.faceDetected === true,
    subjectCount: Math.max(0, Math.round(Number(parsed.subjectCount) || 0)),
    isSynthetic: parsed.isSynthetic === true,
    isDigitalArtifact: parsed.isDigitalArtifact === true,
    deepfakeProbability: clampScore(parsed.deepfakeProbability),
    faceConfidence: clampScore(parsed.faceConfidence),
    evidence: Array.isArray(parsed.evidence)
      ? parsed.evidence.map(String).slice(0, 5)
      : [],
    reasoning: String(parsed.reasoning || "No forensic reasoning returned."),
  };
}

function buildDecision(geminiData: GeminiForensicResult) {
  if (!geminiData.faceDetected || geminiData.subjectCount === 0) {
    return {
      verdict: "INVALID_ENTITY" as const,
      trustScore: 0,
      deepfakeRisk: 0,
      category: "No Human Face Detected",
      captureSource: "NO_FACE",
      reasoning:
        "No verifiable human face was detected in the uploaded artifact. Submit a clear image or document containing one visible face.",
    };
  }

  if (geminiData.subjectCount !== 1) {
    return {
      verdict: "INVALID_ENTITY" as const,
      trustScore: 0,
      deepfakeRisk: 0,
      category: `Invalid Subject Count (${geminiData.subjectCount} faces)`,
      captureSource: "MULTIPLE_SUBJECTS",
      reasoning:
        "Identity verification requires exactly one visible human face. Multiple faces or ambiguous subjects cannot be scored as a single biometric entity.",
    };
  }

  const deepfakeRisk = Math.max(
    geminiData.deepfakeProbability,
    geminiData.isSynthetic ? 85 : 0,
  );

  if (geminiData.isSynthetic || deepfakeRisk >= 70) {
    return {
      verdict: "DEEPFAKE" as const,
      trustScore: Math.min(39, 100 - deepfakeRisk),
      deepfakeRisk,
      category: "AI Generated / Deepfake Face",
      captureSource: "SYNTHETIC",
      reasoning: geminiData.reasoning,
    };
  }

  if (geminiData.faceConfidence >= 70 && deepfakeRisk <= 30) {
    return {
      verdict: "REAL" as const,
      trustScore: Math.max(70, geminiData.faceConfidence),
      deepfakeRisk,
      category: geminiData.isDigitalArtifact
        ? "Human Face In Digital Artifact"
        : "Verified Human Face",
      captureSource: geminiData.isDigitalArtifact ? "DIGITAL_ARTIFACT" : "LIVE_CAPTURE",
      reasoning: geminiData.reasoning,
    };
  }

  return {
    verdict: "REVIEW" as const,
    trustScore: Math.max(40, Math.min(69, geminiData.faceConfidence)),
    deepfakeRisk,
    category: geminiData.isDigitalArtifact
      ? "Low Quality / Screen Capture"
      : "Uncertain Biometric Evidence",
    captureSource: geminiData.isDigitalArtifact ? "DIGITAL_ARTIFACT" : "UNCERTAIN",
    reasoning: geminiData.reasoning,
  };
}

export async function analyzeIdentity(
  formData: FormData,
  userId: string,
  fileUrl: string,
): Promise<IdentityResult | { success: false; message: string }> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY.");
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new Error("No uploaded file found.");
    }

    if (!SUPPORTED_MIME_TYPES.has(file.type)) {
      throw new Error("Unsupported file type. Upload a PNG, JPG, WEBP, HEIC, or PDF.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const filePart = {
      inlineData: {
        data: base64String,
        mimeType: file.type,
      },
    };

    const prompt = `
You are a biometric presentation-attack and deepfake screening engine.

Analyze the uploaded artifact. It may be a selfie image, a portrait image, or an identity document containing a portrait.

Decision policy:
- First detect whether at least one human face is visible.
- If no human face is visible, set faceDetected=false, subjectCount=0, and do not invent a score.
- If the artifact is an identity document, evaluate the portrait face in the document.
- Count only visible human faces. Ignore printed logos, icons, animals, cartoons, and background objects.
- Detect signs of AI generation, face swap, deepfake synthesis, heavy beautification, screenshots, screen glare, moire, compression, and document/photo recapture.
- deepfakeProbability means probability that the visible face is AI generated, swapped, or synthetically manipulated.
- faceConfidence means confidence that the visible face is a real biological human capture.
- Be conservative. If evidence is unclear, use middle scores instead of extreme scores.

Scoring rules:
- AI generated or deepfake face: deepfakeProbability 70-100 and faceConfidence 0-39.
- Real human face: faceConfidence 70-100 and deepfakeProbability 0-30.
- No face: faceConfidence 0 and deepfakeProbability 0.
- Unclear or low quality: use 40-69 faceConfidence.

Return only this JSON shape. No markdown. No extra text.
{
  "faceDetected": boolean,
  "subjectCount": number,
  "isSynthetic": boolean,
  "isDigitalArtifact": boolean,
  "deepfakeProbability": number,
  "faceConfidence": number,
  "evidence": ["short forensic signal", "short forensic signal"],
  "reasoning": "1-2 technical sentences explaining the visual evidence."
}
`;

    const responseText = await callGeminiWithRetry(prompt, filePart);
    const geminiData = parseGeminiJson(responseText);
    const decision = buildDecision(geminiData);

    const resultData: IdentityResult = {
      success: true,
      verdict: decision.verdict,
      trustScore: decision.trustScore,
      deepfakeRisk: decision.deepfakeRisk,
      riskScore: decision.deepfakeRisk,
      risk: decision.deepfakeRisk,
      category: decision.category,
      captureSource: decision.captureSource,
      reasoning: decision.reasoning,
      imageUrl: fileUrl,
      fileName: file.name,
      subjectCount: geminiData.subjectCount,
      isSynthetic: geminiData.isSynthetic,
      isDigitalArtifact: geminiData.isDigitalArtifact,
    };

    await addDoc(collection(db, "identityLogs"), {
      userId,
      fileUrl,
      fileName: file.name,
      fileType: file.type,
      verdict: resultData.verdict,
      trustScore: resultData.trustScore,
      deepfakeRisk: resultData.deepfakeRisk,
      riskScore: resultData.deepfakeRisk,
      risk: resultData.deepfakeRisk,
      category: resultData.category,
      captureSource: resultData.captureSource,
      reasoning: resultData.reasoning,
      subjectCount: resultData.subjectCount,
      isSynthetic: geminiData.isSynthetic,
      isDigitalArtifact: geminiData.isDigitalArtifact,
      faceDetected: geminiData.faceDetected,
      faceConfidence: geminiData.faceConfidence,
      evidence: geminiData.evidence,
      createdAt: serverTimestamp(),
    });

    return resultData;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Identity analysis failed.";

    console.error("[analyzeIdentity]", error);
    return { success: false, message };
  }
}
