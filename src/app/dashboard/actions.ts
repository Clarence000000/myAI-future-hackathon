"use server";

import { analyzeWithGemini } from "@/lib/gemini/analyze";
import { adminDb } from "@/lib/firebase/adminApp";
import { FieldValue } from "firebase-admin/firestore";
import type { GeminiAnalysisResult } from "@/types/scamshield";

export async function analyzeManualInput(
  text: string,
  url: string,
  userId: string
): Promise<{ success: boolean; result?: GeminiAnalysisResult; docId?: string; error?: string }> {
  try {
    if (!text || !userId) {
      return { success: false, error: "Missing text or user ID" };
    }

    // 1. Analyze with Gemini
    const result = await analyzeWithGemini(text, url || undefined);

    // 2. Persist to Firestore
    const threatDoc = {
      userId,
      textContent: text,
      sourceUrl: url || "",
      sourceType: "manual" as const,
      riskLevel: result.riskLevel,
      category: result.category,
      reasoning: result.reasoning,
      recommendedAction: result.recommendedAction,
      timestamp: FieldValue.serverTimestamp(),
      networkNode: result.riskLevel === "HIGH" && !!url,
    };

    const docRef = await adminDb.collection("threats").add(threatDoc);

    // 3. Update flaggedUrls for React Flow (Module 3) if HIGH risk
    if (threatDoc.networkNode) {
      await adminDb.collection("flaggedUrls").add({
        url,
        threatId: docRef.id,
        category: result.category,
        flaggedAt: FieldValue.serverTimestamp(),
        processed: false,
      });
    }

    // 4. Update user stats
    const userStatsRef = adminDb.collection("userStats").doc(userId);
    const riskField =
      result.riskLevel === "SAFE"
        ? "safeCount"
        : result.riskLevel === "LOW"
        ? "lowCount"
        : "highCount";

    await userStatsRef.set(
      {
        userId,
        totalScans: FieldValue.increment(1),
        [riskField]: FieldValue.increment(1),
        lastScanAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true, result, docId: docRef.id };
  } catch (error: any) {
    console.error("[analyzeManualInput] Error:", error);
    return { success: false, error: error.message || "Failed to analyze" };
  }
}
