// ============================================================
// ScamShield AI — Edge Route: /api/analyze-scam
// Handles Gemini analysis + delegates Firestore persist to Node route
// ============================================================

import type { NextRequest } from 'next/server';
import { analyzeWithGemini } from '@/lib/gemini/analyze';
import type { AnalyzeRequest, AnalyzeResponse, PersistThreatPayload } from '@/types/scamshield';

export const runtime = 'edge';

/** CORS headers for Chrome extension origin */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Preflight handler for CORS
 */
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/**
 * POST /api/analyze-scam
 *
 * Accepts: { text, url?, sourceType, userId }
 * Returns: GeminiAnalysisResult + optional docId
 */
export async function POST(request: NextRequest) {
  try {
    // --- 1. Parse request body ---
    const body = (await request.json()) as AnalyzeRequest;

    if (!body.text || !body.userId || !body.sourceType) {
      return Response.json(
        { success: false, error: 'Missing required fields: text, userId, sourceType' } satisfies AnalyzeResponse,
        { status: 400, headers: corsHeaders },
      );
    }

    // --- 2. Verify Firebase Auth token (Edge-compatible) ---
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json(
        { success: false, error: 'Missing or invalid Authorization header' } satisfies AnalyzeResponse,
        { status: 401, headers: corsHeaders },
      );
    }

    const idToken = authHeader.slice(7);

    // Verify token via Firebase Auth REST API (Edge-safe, no firebase-admin)
    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
    const tokenVerifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    );

    if (!tokenVerifyRes.ok) {
      return Response.json(
        { success: false, error: 'Invalid Firebase ID token' } satisfies AnalyzeResponse,
        { status: 401, headers: corsHeaders },
      );
    }

    // --- 3. Call Gemini ---
    const result = await analyzeWithGemini(body.text, body.url);

    // --- 4. Persist to Firestore (if non-SAFE) via internal Node route ---
    let docId: string | undefined;

    if (result.riskLevel !== 'SAFE') {
      try {
        const baseUrl = new URL(request.url).origin;
        const persistPayload: PersistThreatPayload = {
          analysisResult: result,
          originalRequest: body,
        };

        const persistRes = await fetch(`${baseUrl}/api/persist-threat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Key': process.env.INTERNAL_API_KEY ?? '',
          },
          body: JSON.stringify(persistPayload),
        });

        if (persistRes.ok) {
          const persistData = (await persistRes.json()) as { docId: string };
          docId = persistData.docId;
        }
      } catch (persistError) {
        // Non-blocking — analysis result still returns even if persist fails
        console.error('[analyze-scam] Failed to persist threat:', persistError);
      }
    }

    // --- 5. Return result ---
    const response: AnalyzeResponse = {
      success: true,
      result,
      docId,
    };

    return Response.json(response, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('[analyze-scam] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';

    return Response.json(
      { success: false, error: message } satisfies AnalyzeResponse,
      { status: 500, headers: corsHeaders },
    );
  }
}
