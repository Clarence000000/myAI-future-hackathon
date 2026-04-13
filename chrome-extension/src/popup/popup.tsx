import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';

// ============================================================
// Types
// ============================================================

interface UserStats {
  totalScans: number;
  safeCount: number;
  lowCount: number;
  highCount: number;
  safetyScore: number;
}

interface AnalysisResult {
  riskLevel: 'SAFE' | 'LOW' | 'HIGH';
  category: string;
  reasoning: string;
  recommendedAction: string;
}

// ============================================================
// Safety Score Gauge Component
// ============================================================

function SafetyGauge({ score }: { score: number }) {
  const color =
    score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

  const data = [{ value: score, fill: color }];

  return (
    <div className="flex flex-col items-center">
      <RadialBarChart
        width={160}
        height={100}
        cx={80}
        cy={90}
        innerRadius={55}
        outerRadius={75}
        barSize={12}
        data={data}
        startAngle={180}
        endAngle={0}
      >
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          angleAxisId={0}
          tick={false}
        />
        <RadialBar
          dataKey="value"
          cornerRadius={6}
          background={{ fill: '#1e293b' }}
        />
      </RadialBarChart>
      <span
        className="text-2xl font-bold -mt-8"
        style={{ color }}
      >
        {score}
      </span>
      <span className="text-xs text-slate-400 mt-1">Safety Score</span>
    </div>
  );
}

// ============================================================
// Stats Cards
// ============================================================

function StatsRow({ stats }: { stats: UserStats }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="bg-slate-800/60 rounded-lg p-2">
        <div className="text-lg font-semibold text-green-400">
          {stats.safeCount}
        </div>
        <div className="text-[10px] text-slate-400">Safe</div>
      </div>
      <div className="bg-slate-800/60 rounded-lg p-2">
        <div className="text-lg font-semibold text-yellow-400">
          {stats.lowCount}
        </div>
        <div className="text-[10px] text-slate-400">Low Risk</div>
      </div>
      <div className="bg-slate-800/60 rounded-lg p-2">
        <div className="text-lg font-semibold text-red-400">
          {stats.highCount}
        </div>
        <div className="text-[10px] text-slate-400">High Risk</div>
      </div>
    </div>
  );
}

// ============================================================
// Main Popup App
// ============================================================

function PopupApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<AnalysisResult | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalScans: 0,
    safeCount: 0,
    lowCount: 0,
    highCount: 0,
    safetyScore: 100,
  });

  // Check auth status on mount
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' }, (response) => {
      setAuthenticated(response?.authenticated ?? false);
      setLoading(false);
    });

    // Load cached stats
    chrome.storage.local.get(['userStats', 'lastResult'], (result) => {
      if (result.userStats) setStats(result.userStats);
      if (result.lastResult) setLastResult(result.lastResult);
    });
  }, []);

  const handleSignIn = useCallback(async () => {
    chrome.tabs.create({ url: 'http://localhost:3000/login' });
    try { window.close(); } catch {}
  }, []);

  const handleSignOut = useCallback(async () => {
    chrome.storage.local.remove(['firebaseToken', 'userStats', 'lastResult']);
    setAuthenticated(false);
    setStats({ totalScans: 0, safeCount: 0, lowCount: 0, highCount: 0, safetyScore: 100 });
    setLastResult(null);
  }, []);

  const handleScanPage = useCallback(async () => {
    setScanning(true);
    setLastResult(null);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setScanning(false);
        return;
      }

      chrome.runtime.sendMessage(
        { type: 'SCAN_PAGE', payload: { tabId: tab.id } },
        (response) => {
          setScanning(false);
          if (response?.success && response.result) {
            setLastResult(response.result);
            chrome.storage.local.set({ lastResult: response.result });

            // Update local stats
            setStats((prev) => {
              const newStats = { ...prev, totalScans: prev.totalScans + 1 };
              if (response.result.riskLevel === 'SAFE') newStats.safeCount++;
              else if (response.result.riskLevel === 'LOW') newStats.lowCount++;
              else newStats.highCount++;
              newStats.safetyScore = Math.round(
                (newStats.safeCount / newStats.totalScans) * 100,
              );
              chrome.storage.local.set({ userStats: newStats });
              return newStats;
            });
          }
        },
      );
    } catch {
      setScanning(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="w-[360px] min-h-[300px] bg-slate-900 text-white flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-[360px] min-h-[300px] bg-slate-900 text-white font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-sm">
              🛡️
            </div>
            <h1 className="text-sm font-bold tracking-wide">ScamShield AI</h1>
          </div>
          {authenticated && (
            <button
              onClick={handleSignOut}
              className="text-[10px] text-white/60 hover:text-white/90 transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>
        <p className="text-[10px] text-white/60 mt-1">
          Powered by Gemini 2.0 • FinTrust AI
        </p>
      </div>

      <div className="p-4 space-y-4">
        {!authenticated ? (
          /* --- Auth Screen --- */
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="text-4xl">🔐</div>
            <p className="text-sm text-slate-300 text-center">
              Sign in to start detecting scams in real-time
            </p>
            <button
              onClick={handleSignIn}
              className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          </div>
        ) : (
          /* --- Main Dashboard --- */
          <>
            {/* Safety Gauge */}
            <SafetyGauge score={stats.safetyScore} />

            {/* Stats */}
            <StatsRow stats={stats} />

            {/* Scan Button */}
            <button
              onClick={handleScanPage}
              disabled={scanning}
              className="w-full py-2.5 rounded-lg font-medium text-sm transition-all
                bg-gradient-to-r from-blue-500 to-purple-500 
                hover:from-blue-400 hover:to-purple-400 
                disabled:opacity-50 disabled:cursor-not-allowed
                active:scale-[0.98]"
            >
              {scanning ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Scanning...
                </span>
              ) : (
                '🔍 Scan Current Page'
              )}
            </button>

            {/* Last Result */}
            {lastResult && (
              <div
                className={`rounded-lg p-3 text-xs space-y-1 border ${lastResult.riskLevel === 'SAFE'
                  ? 'bg-green-500/10 border-green-500/30 text-green-300'
                  : lastResult.riskLevel === 'LOW'
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {lastResult.riskLevel === 'SAFE'
                      ? '✅ Safe'
                      : lastResult.riskLevel === 'LOW'
                        ? '⚠️ Low Risk'
                        : '🚨 High Risk'}
                  </span>
                  <span className="text-[10px] opacity-70">
                    {lastResult.category}
                  </span>
                </div>
                <p className="opacity-80">{lastResult.reasoning}</p>
                <p className="font-medium">{lastResult.recommendedAction}</p>
              </div>
            )}

            {/* Footer tip */}
            <p className="text-[10px] text-slate-500 text-center">
              💡 Right-click any text → &quot;Analyze with ScamShield AI&quot;
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Mount
// ============================================================

const rootEl = document.getElementById('popup-root');
if (rootEl) {
  createRoot(rootEl).render(<PopupApp />);
}
