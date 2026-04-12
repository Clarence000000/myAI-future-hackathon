// ============================================================
// ScamShield AI — Extension API Client
// Typed fetch wrapper for /api/analyze-scam
// ============================================================

declare const __API_BASE_URL__: string;

// Inline types (mirrored from src/types/scamshield.ts to avoid cross-boundary import issues with esbuild)
interface AnalyzeRequest {
  text: string;
  url?: string;
  sourceType: 'extension' | 'dashboard' | 'manual';
  userId: string;
}

interface AnalyzeResponse {
  success: boolean;
  result?: {
    riskLevel: 'SAFE' | 'LOW' | 'HIGH';
    category: 'Phishing' | 'Mule Request' | 'Fake Promo' | 'None';
    reasoning: string;
    recommendedAction: string;
  };
  docId?: string;
  error?: string;
}
/** Base URL — replaced at build time by esbuild define */
const API_BASE_URL: string = __API_BASE_URL__;

/**
 * Get the stored Firebase auth token from chrome.storage.local
 */
async function getAuthToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['firebaseToken'], (result) => {
      resolve(result.firebaseToken ?? null);
    });
  });
}

/**
 * Call the ScamShield analyze API.
 */
export async function analyzeScam(
  request: Omit<AnalyzeRequest, 'userId'>,
): Promise<AnalyzeResponse> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: 'Not authenticated. Please sign in via the popup.' };
  }

  // Decode userId from the JWT payload (no verification needed, server does that)
  const payloadB64 = token.split('.')[1];
  const payload = JSON.parse(atob(payloadB64));
  const userId: string = payload.user_id || payload.sub || '';

  const body: AnalyzeRequest = {
    ...request,
    userId,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/analyze-scam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: (errorData as { error?: string }).error ?? `HTTP ${res.status}`,
      };
    }

    return (await res.json()) as AnalyzeResponse;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}
