// ============================================================
// ScamShield AI — Core Type Definitions
// ============================================================

import type { Timestamp } from 'firebase/firestore';

// --- Gemini AI Response ---

/** Strict JSON shape returned by the Gemini 2.0 analysis prompt. */
export interface GeminiAnalysisResult {
  riskLevel: 'SAFE' | 'LOW' | 'HIGH';
  category: 'Phishing' | 'Mule Request' | 'Fake Promo' | 'None';
  reasoning: string;
  recommendedAction: string;
}

/** Valid risk levels. */
export type RiskLevel = GeminiAnalysisResult['riskLevel'];

/** Valid scam categories. */
export type ScamCategory = GeminiAnalysisResult['category'];

// --- API Layer ---

/** POST body sent to /api/analyze-scam */
export interface AnalyzeRequest {
  text: string;
  url?: string;
  sourceType: 'extension' | 'dashboard' | 'manual';
  userId: string;
}

/** Response from /api/analyze-scam */
export interface AnalyzeResponse {
  success: boolean;
  result?: GeminiAnalysisResult;
  docId?: string;
  error?: string;
}

/** Internal payload sent from Edge route → Node persist route */
export interface PersistThreatPayload {
  analysisResult: GeminiAnalysisResult;
  originalRequest: AnalyzeRequest;
}

// --- Firestore: threats collection ---

/** Shape of a document in the `threats` collection. */
export interface ThreatLog {
  id: string;
  userId: string;
  textContent: string;
  sourceUrl: string;
  sourceType: 'extension' | 'dashboard' | 'manual';
  riskLevel: RiskLevel;
  category: ScamCategory;
  reasoning: string;
  recommendedAction: string;
  timestamp: Timestamp;
  /** If true, this threat will be picked up by Module 3 (FraudGraph / React Flow). */
  networkNode: boolean;
}

// --- Firestore: stats collection ---

/** Shape of a document in the `stats` collection (keyed by date YYYY-MM-DD). */
export interface DailyThreatStats {
  date: string;
  phishing: number;
  muleRequest: number;
  fakePromo: number;
  total: number;
}

/** Shape of a document in the `userStats/{userId}` collection. */
export interface UserSafetyStats {
  userId: string;
  totalScans: number;
  safeCount: number;
  lowCount: number;
  highCount: number;
  /** Calculated: (safeCount / totalScans) * 100 — clamped 0-100 */
  safetyScore: number;
  lastScanAt: Timestamp;
}

// --- Firestore: flaggedUrls collection (for Module 3) ---

export interface FlaggedUrl {
  url: string;
  threatId: string;
  category: ScamCategory;
  flaggedAt: Timestamp;
  /** Processed by Module 3 FraudGraph */
  processed: boolean;
}

// --- Chrome Extension Messaging ---

export type ExtensionMessageType =
  | 'ANALYZE_RESULT'
  | 'ANALYZE_REQUEST'
  | 'SCAN_PAGE'
  | 'AUTH_TOKEN';

export interface ExtensionMessage<T = unknown> {
  type: ExtensionMessageType;
  payload: T;
}

/** Message from background → content script with analysis result */
export interface AnalyzeResultMessage
  extends ExtensionMessage<GeminiAnalysisResult> {
  type: 'ANALYZE_RESULT';
}

/** Message from popup → background requesting page scan */
export interface ScanPageMessage extends ExtensionMessage<{ tabId: number }> {
  type: 'SCAN_PAGE';
}

/** Message carrying Firebase auth token */
export interface AuthTokenMessage extends ExtensionMessage<{ token: string }> {
  type: 'AUTH_TOKEN';
}
