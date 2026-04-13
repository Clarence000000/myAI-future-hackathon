// ============================================================
// ScamShield AI — Gemini 2.0 Analysis Module
// Edge-compatible (no Node.js APIs)
// ============================================================

import { GoogleGenAI } from '@google/genai';
import type { GeminiAnalysisResult } from '@/types/scamshield';

const SYSTEM_PROMPT = `You are ScamShield AI, a highly accurate scam and fraud detection engine built for the Malaysian and Southeast Asian financial ecosystem. Your job is to analyze text content (SMS, emails, social media messages, URLs) and determine if it is a scam.

ANALYSIS CRITERIA:
- Phishing: Messages impersonating banks, government agencies, or trusted services to steal credentials or personal information.
- Mule Request: Messages attempting to recruit money mules, asking users to receive/transfer funds for a "commission."
- Fake Promo: Messages advertising fake prizes, giveaways, investment schemes, or too-good-to-be-true offers.

RISK LEVELS:
- "SAFE": Content appears legitimate with no scam indicators.
- "LOW": Content has minor suspicious elements but may be legitimate. Warrants caution.
- "HIGH": Content has strong scam indicators. User should not engage.

You MUST respond with ONLY valid JSON. No markdown, no explanation, no code fences. Just the raw JSON object.

REQUIRED OUTPUT FORMAT:
{"riskLevel":"SAFE|LOW|HIGH","category":"Phishing|Mule Request|Fake Promo|None","reasoning":"Brief 1-2 sentence explanation","recommendedAction":"Brief actionable advice"}`;

/**
 * Analyze text/URL for scam indicators using Gemini 2.0.
 * This function is Edge-compatible — no Node.js APIs used.
 */
export async function analyzeWithGemini(
  text: string,
  url?: string,
): Promise<GeminiAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const ai = new GoogleGenAI({ apiKey });

  const userPrompt = url
    ? `Analyze the following content for scam indicators.\n\nURL: ${url}\n\nText content:\n${text}`
    : `Analyze the following content for scam indicators.\n\nText content:\n${text}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.1, // Low temperature for consistent, deterministic output
      maxOutputTokens: 2048,
    },
  });

  const rawText = response.text?.trim();
  if (!rawText) {
    throw new Error('Gemini returned empty response');
  }

  // Strip markdown code fences if Gemini wraps them anyway
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // Gemini 2.5 may include thinking text before JSON — extract the JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Could not extract JSON from Gemini response: ${cleaned.slice(0, 200)}`);
  }

  const parsed = JSON.parse(jsonMatch[0]) as GeminiAnalysisResult;

  // Validate required fields
  if (!parsed.riskLevel || !parsed.category || !parsed.reasoning || !parsed.recommendedAction) {
    throw new Error(`Gemini response missing required fields: ${cleaned}`);
  }

  // Validate enum values
  const validRiskLevels = ['SAFE', 'LOW', 'HIGH'] as const;
  const validCategories = ['Phishing', 'Mule Request', 'Fake Promo', 'None'] as const;

  if (!validRiskLevels.includes(parsed.riskLevel)) {
    throw new Error(`Invalid riskLevel: ${parsed.riskLevel}`);
  }
  if (!validCategories.includes(parsed.category)) {
    throw new Error(`Invalid category: ${parsed.category}`);
  }

  return parsed;
}
