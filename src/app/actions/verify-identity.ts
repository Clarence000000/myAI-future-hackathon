"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase/clientApp";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeIdentity(formData: FormData, userId: string, imageUrl: string) {
  if (!userId) return { success: false, message: "Auth Failed" };

  try {
    const file = formData.get('file') as File;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    const prompt = `
      ACT AS A BIOMETRIC FACE ANALYST.
      Focus 100% on the HUMAN FACE.
      1. isSynthetic: TRUE only if the face is AI-generated/Deepfake.
      2. isDigitalArtifact: TRUE if it's a screenshot/social media grab.
      3. faceIntegrityScore: 0-100 (How likely is this a real biological human face?).

      Return ONLY a JSON object:
      {
        "isSynthetic": boolean,
        "isDigitalArtifact": boolean,
        "faceIntegrityScore": number,
        "subjectCount": number,
        "riskReasoning": "string"
      }
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: buffer.toString("base64"), mimeType: file.type } }
    ]);

    const ai = JSON.parse(result.response.text().replace(/```json|```/g, "").trim());

    // 🧮 SOURCE-BASED TRUST LOGIC
    let finalTrustScore: number;
    let verdict: "REAL" | "DEEPFAKE" | "INVALID";
    let deepfakeRiskBar: number; // This is what the UI progress bar will show

    if (ai.subjectCount === 0) {
      finalTrustScore = 0;
      verdict = "INVALID";
      deepfakeRiskBar = 0;
    } 
    else if (ai.isSynthetic) {
      // 🤖 AI GENERATED (Target: 0-40%)
      finalTrustScore = Math.min(40, ai.faceIntegrityScore);
      verdict = "DEEPFAKE";
      deepfakeRiskBar = 95; // Show high risk for AI
    } 
    else if (ai.isDigitalArtifact) {
      // 🌐 SCREENSHOT/SOCIAL MEDIA (Target: 60-80%)
      finalTrustScore = Math.max(60, Math.min(80, ai.faceIntegrityScore));
      verdict = "REAL"; // Still REAL because it's a real person
      deepfakeRiskBar = 15; // Low risk because it's a real person
    } 
    else {
      // 📸 DIRECT CAMERA CAPTURE (Target: 80-100%)
      finalTrustScore = Math.max(80, Math.min(100, ai.faceIntegrityScore));
      verdict = "REAL";
      deepfakeRiskBar = 5; // Minimal risk
    }

    // 💾 Save to Registry
    await addDoc(collection(db, "identityLogs"), {
      userId,
      imageUrl,
      fileName: file.name,
      verdict: verdict,
      trustScore: finalTrustScore,
      riskPercentage: deepfakeRiskBar, // We save the customized risk bar value
      reasoning: ai.riskReasoning,
      timestamp: serverTimestamp(),
    });

    return { 
      ...ai, 
      verdict, 
      trustScore: finalTrustScore, 
      riskPercentage: deepfakeRiskBar, 
      success: true 
    };

  } catch (error: any) {
    console.error("ANALYSIS ERROR:", error);
    return { success: false, message: "Forensic Engine (AI) No Function" };
  }
}