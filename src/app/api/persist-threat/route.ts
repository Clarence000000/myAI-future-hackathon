// ============================================================
// ScamShield AI — Node.js Route: /api/persist-threat
// Internal-only route for writing threat data to Firestore
// NOT Edge — uses firebase-admin which requires Node.js runtime
// ============================================================

import type { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/adminApp';
import { FieldValue } from 'firebase-admin/firestore';
import type { PersistThreatPayload } from '@/types/scamshield';

/**
 * POST /api/persist-threat
 *
 * Internal route — called only by the Edge analyze-scam route.
 * Secured via X-Internal-Key header.
 */
export async function POST(request: NextRequest) {
  try {
    // --- 1. Verify internal API key ---
    const internalKey = request.headers.get('X-Internal-Key');
    const expectedKey = process.env.INTERNAL_API_KEY;

    if (!expectedKey || internalKey !== expectedKey) {
      return Response.json(
        { error: 'Unauthorized — internal route only' },
        { status: 403 },
      );
    }

    // --- 2. Parse payload ---
    const { analysisResult, originalRequest } =
      (await request.json()) as PersistThreatPayload;

    // --- 3. Write to Firestore threats collection ---
    const threatDoc = {
      userId: originalRequest.userId,
      textContent: originalRequest.text,
      sourceUrl: originalRequest.url ?? '',
      sourceType: originalRequest.sourceType,
      riskLevel: analysisResult.riskLevel,
      category: analysisResult.category,
      reasoning: analysisResult.reasoning,
      recommendedAction: analysisResult.recommendedAction,
      timestamp: FieldValue.serverTimestamp(),
      // Flag for Module 3: React Flow FraudGraph visualization
      networkNode:
        analysisResult.riskLevel === 'HIGH' &&
        !!originalRequest.url,
    };

    const docRef = await adminDb.collection('threats').add(threatDoc);

    // --- 4. If HIGH risk + URL present, write to flaggedUrls for Module 3 ---
    if (threatDoc.networkNode && originalRequest.url) {
      await adminDb.collection('flaggedUrls').add({
        url: originalRequest.url,
        threatId: docRef.id,
        category: analysisResult.category,
        flaggedAt: FieldValue.serverTimestamp(),
        processed: false,
      });
    }

    // --- 5. Update user stats ---
    const userStatsRef = adminDb.collection('userStats').doc(originalRequest.userId);
    const riskField =
      analysisResult.riskLevel === 'SAFE'
        ? 'safeCount'
        : analysisResult.riskLevel === 'LOW'
          ? 'lowCount'
          : 'highCount';

    await userStatsRef.set(
      {
        userId: originalRequest.userId,
        totalScans: FieldValue.increment(1),
        [riskField]: FieldValue.increment(1),
        lastScanAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return Response.json({ success: true, docId: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('[persist-threat] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to persist threat';

    return Response.json({ error: message }, { status: 500 });
  }
}
