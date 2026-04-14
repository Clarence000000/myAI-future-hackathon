"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { analyzeManualInput } from "@/app/dashboard/actions";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { RadialBarChart, RadialBar, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import type { ThreatLog, GeminiAnalysisResult } from "@/types/scamshield";

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  
  // Dashboard state
  const [stats, setStats] = useState({ safeCount: 0, lowCount: 0, highCount: 0, totalScans: 0, safetyScore: 100 });
  const [recentThreats, setRecentThreats] = useState<ThreatLog[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Manual Scan state
  const [textToScan, setTextToScan] = useState("");
  const [urlToScan, setUrlToScan] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [manualResult, setManualResult] = useState<GeminiAnalysisResult | null>(null);

  useEffect(() => {
    if (!user) return;
    
    async function fetchData() {
      try {
        // Fetch User Stats
        const statsQuery = query(collection(db, "userStats"), where("userId", "==", user!.uid));
        const statsSnap = await getDocs(statsQuery);
        
        if (!statsSnap.empty) {
          const s = statsSnap.docs[0].data();
          const score = s.totalScans > 0 ? Math.round((s.safeCount / s.totalScans) * 100) : 100;
          setStats({ ...s, safetyScore: score } as typeof stats);
        }

        // Fetch Recent Threats
        const threatsQuery = query(
          collection(db, "threats"),
          where("userId", "==", user!.uid),
          orderBy("timestamp", "desc"),
          limit(10)
        );
        const threatsSnap = await getDocs(threatsQuery);
        setRecentThreats(threatsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ThreatLog)));

      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoadingData(false);
      }
    }

    fetchData();
  }, [user]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !textToScan) return;

    setIsScanning(true);
    setManualResult(null);

    const res = await analyzeManualInput(textToScan, urlToScan, user.uid);
    
    if (res.success && res.result) {
      setManualResult(res.result);
      
      // Optimistically add to recent threats list
      const newThreat: Partial<ThreatLog> = {
        id: res.docId || "temp",
        userId: user.uid,
        textContent: textToScan,
        sourceUrl: urlToScan,
        sourceType: "manual",
        riskLevel: res.result.riskLevel,
        category: res.result.category,
        reasoning: res.result.reasoning,
        recommendedAction: res.result.recommendedAction,
      };
      setRecentThreats([newThreat as ThreatLog, ...recentThreats].slice(0, 10));
    }
    
    setIsScanning(false);
  };

  if (loading || loadingData) {
    return <div className="flex h-screen items-center justify-center dark:bg-slate-900 dark:text-white">Loading...</div>;
  }

  if (!user) return null; // Wait for AuthProvider to redirect

  // Chart Data
  const safeScore = Number.isFinite(stats.safetyScore) ? stats.safetyScore : 100;
  const gaugeData = [{ name: "Safety", value: safeScore, fill: safeScore >= 80 ? "#22c55e" : safeScore >= 50 ? "#eab308" : "#ef4444" }];
  const categoryData = [
    { name: "Safe", count: stats.safeCount, fill: "#22c55e" },
    { name: "Low", count: stats.lowCount, fill: "#eab308" },
    { name: "High", count: stats.highCount, fill: "#ef4444" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-xl text-white shadow-lg">🛡️</div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">ScamShield Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{user.email}</span>
          <button onClick={signOut} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white transition">Sign Out</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Form & Result */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Manual Analysis</h2>
            <form onSubmit={handleScan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Message or Content</label>
                <textarea 
                  rows={4}
                  required
                  value={textToScan}
                  onChange={(e) => setTextToScan(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none dark:text-white"
                  placeholder="Paste suspicious SMS or email text here..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Source URL (Optional)</label>
                <input 
                  type="text"
                  value={urlToScan}
                  onChange={(e) => setUrlToScan(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  placeholder="https://suspicious-link.com"
                />
              </div>
              <button 
                type="submit" 
                disabled={isScanning || !textToScan}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-md shadow-blue-500/20 disabled:opacity-50 transition active:scale-95"
              >
                {isScanning ? "Analyzing..." : "Analyze Threat"}
              </button>
            </form>

            {manualResult && (
              <div className={`mt-6 p-4 rounded-xl border ${manualResult.riskLevel === 'SAFE' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : manualResult.riskLevel === 'LOW' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">
                    {manualResult.riskLevel === 'SAFE' ? '✅' : manualResult.riskLevel === 'LOW' ? '⚠️' : '🚨'}
                  </span>
                  <h3 className={`font-bold ${manualResult.riskLevel === 'SAFE' ? 'text-green-700 dark:text-green-400' : manualResult.riskLevel === 'LOW' ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'}`}>
                    {manualResult.riskLevel} - {manualResult.category}
                  </h3>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{manualResult.reasoning}</p>
                <div className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">Recommendation:</div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{manualResult.recommendedAction}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Stats & History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Safety Score */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Overall Safety Score</h2>
              <div className="flex items-center justify-center relative">
                <RadialBarChart width={240} height={140} cx={120} cy={130} innerRadius={80} outerRadius={110} barSize={20} data={gaugeData} startAngle={180} endAngle={0}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background dataKey="value" cornerRadius={10} />
                </RadialBarChart>
                <div className="absolute bottom-2 flex flex-col items-center">
                  <span className="text-4xl font-bold dark:text-white" style={{ color: gaugeData[0].fill }}>{stats.safetyScore}</span>
                </div>
              </div>
            </div>

            {/* Breakdown Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Threat Breakdown</h2>
              <div className="flex items-center justify-center">
                <BarChart width={320} height={160} data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent Threats Identified</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Risk</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Category</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Content Snippet</th>
                    <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {recentThreats.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No threats analyzed yet. Use the sensor or manual scan!</td>
                    </tr>
                  ) : (
                    recentThreats.map((threat) => (
                      <tr key={threat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${threat.riskLevel === 'SAFE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : threat.riskLevel === 'LOW' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {threat.riskLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium dark:text-slate-200">{threat.category}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={threat.textContent}>
                          {threat.textContent}
                        </td>
                        <td className="px-6 py-4">
                          <span className="capitalize text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-2 py-1 rounded text-xs">
                            {threat.sourceType}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
