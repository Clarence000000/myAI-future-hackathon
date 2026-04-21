"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { analyzeManualInput } from "@/app/dashboard/actions";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { RadialBarChart, RadialBar, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Shield, History, Activity, AlertTriangle } from "lucide-react";
import type { ThreatLog, GeminiAnalysisResult } from "@/types/scamshield";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  
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
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617]">
        <div className="animate-spin text-blue-500"><Activity size={32} /></div>
      </div>
    );
  }

  if (!user) return null; // Wait for AuthProvider to redirect

  // Chart Data
  const safeScore = Number.isFinite(stats.safetyScore) ? stats.safetyScore : 100;
  const isSecure = safeScore >= 80;
  
  const categoryData = [
    { name: "Safe", count: stats.safeCount, fill: "#10b981" },
    { name: "Low", count: stats.lowCount, fill: "#f59e0b" },
    { name: "High", count: stats.highCount, fill: "#f43f5e" }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 custom-scrollbar">
      
      {/* 1. Header Banner */}
      <div className="bg-[#1e293b]/30 border border-slate-800 rounded-3xl p-8 mb-8 flex justify-between items-center backdrop-blur-md relative overflow-hidden">
        <div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[100px] opacity-10 transition-colors duration-1000 ${safeScore < 50 ? 'bg-rose-500' : isSecure ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
        
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">ScamShield Module</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            System Status: <span className="text-blue-400">ACTIVE SCANNING</span>
          </h1>
        </div>

        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Overall Safety</p>
            <p className={`text-3xl font-black italic ${safeScore < 50 ? 'text-rose-400' : isSecure ? 'text-emerald-400' : 'text-yellow-400'}`}>
              {safeScore}% <span className="text-sm font-medium opacity-50">Score</span>
            </p>
          </div>
          <div className={`h-14 w-14 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${safeScore < 50 ? 'border-rose-500/20' : isSecure ? 'border-emerald-500/20' : 'border-yellow-500/20'}`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-[10px] border ${safeScore < 50 ? 'bg-rose-500/10 text-rose-500 border-rose-500/50' : isSecure ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50'}`}>
              {safeScore < 50 ? 'RISK' : isSecure ? 'SAFE' : 'WARN'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Column - Form & Result */}
        <div className="col-span-12 lg:col-span-5 flex flex-col">
          <h2 className="text-lg font-bold flex items-center gap-2 italic mb-8">
            <Shield size={18} className="text-blue-500" /> Manual Analysis
          </h2>
          
          <div className="bg-[#1e293b]/10 border border-slate-800 rounded-3xl p-6 backdrop-blur-md flex-1">
            <form onSubmit={handleScan} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Message or Content</label>
                <textarea 
                  rows={4}
                  required
                  value={textToScan}
                  onChange={(e) => setTextToScan(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-200 placeholder:text-slate-600"
                  placeholder="Paste suspicious SMS or email text here..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Source URL (Optional)</label>
                <input 
                  type="text"
                  value={urlToScan}
                  onChange={(e) => setUrlToScan(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-200 placeholder:text-slate-600"
                  placeholder="https://suspicious-link.com"
                />
              </div>
              <button 
                type="submit" 
                disabled={isScanning || !textToScan}
                className="w-full py-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 font-bold tracking-widest uppercase text-[10px] border border-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isScanning ? "Analyzing..." : "Analyze Threat"}
              </button>
            </form>

            {manualResult && (
              <div className={`mt-6 p-4 rounded-xl border ${manualResult.riskLevel === 'SAFE' ? 'bg-emerald-500/10 border-emerald-500/20' : manualResult.riskLevel === 'LOW' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">
                    {manualResult.riskLevel === 'SAFE' ? '✅' : manualResult.riskLevel === 'LOW' ? '⚠️' : '🚨'}
                  </span>
                  <h3 className={`font-black text-sm uppercase tracking-wider ${manualResult.riskLevel === 'SAFE' ? 'text-emerald-400' : manualResult.riskLevel === 'LOW' ? 'text-yellow-400' : 'text-rose-400'}`}>
                    {manualResult.riskLevel} - {manualResult.category}
                  </h3>
                </div>
                <p className="text-sm text-slate-400 mb-3 italic">{manualResult.reasoning}</p>
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Recommendation:</div>
                <p className="text-sm font-medium text-slate-200">{manualResult.recommendedAction}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Stats & Breakdown */}
        <div className="col-span-12 lg:col-span-7 flex flex-col">
          <h2 className="text-lg font-bold flex items-center gap-2 italic mb-8">
            <Activity size={18} className="text-blue-500" /> Threat Analytics
          </h2>
          
          <div className="bg-[#1e293b]/10 p-6 rounded-3xl border border-slate-800 backdrop-blur-md flex-1 flex flex-col items-center justify-center">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Threat Breakdown</h2>
            <div className="flex items-center justify-center">
              <BarChart width={400} height={200} data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'rgba(30, 41, 59, 0.5)'}} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', color: '#f1f5f9' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="mt-12 bg-[#1e293b]/10 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <History size={16} className="text-blue-500" /> Recent Threats Identified
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-medium border-separate border-spacing-0">
            <thead className="bg-slate-900/50 text-slate-500 uppercase tracking-widest text-[9px]">
              <tr>
                <th className="px-6 py-4 border-b border-slate-800">Risk</th>
                <th className="px-6 py-4 border-b border-slate-800">Category</th>
                <th className="px-6 py-4 border-b border-slate-800">Content Snippet</th>
                <th className="px-6 py-4 border-b border-slate-800">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-400">
              {recentThreats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-600 italic">
                    <Shield className="mx-auto mb-2 opacity-10" size={48} />
                    <p className="text-sm font-medium">No threats analyzed yet. Use the manual scan!</p>
                  </td>
                </tr>
              ) : (
                recentThreats.map((threat) => (
                  <tr key={threat.id} className="hover:bg-blue-500/5 transition-colors group">
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest border transition-all ${
                        threat.riskLevel === 'SAFE' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : threat.riskLevel === 'LOW'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                      }`}>
                        {threat.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-200 font-bold uppercase tracking-tight">{threat.category}</td>
                    <td className="px-6 py-4 max-w-xs truncate italic text-slate-500 group-hover:text-slate-400 transition-colors" title={threat.textContent}>
                      "{threat.textContent}"
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-[9px] font-mono tracking-widest text-slate-500 bg-slate-800 border border-slate-700 px-2 py-1 rounded">
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
  );
}
