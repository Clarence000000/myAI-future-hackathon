"use client";
import { useState, useEffect, useCallback } from 'react';
import { Activity, Lock, AlertTriangle, History, Fingerprint, ExternalLink, RefreshCcw, Camera, FileBadge2, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/clientApp";
import { useAuth } from "@/components/AuthProvider";
import UploadZone from '@/components/Identity/UploadZone';
import RiskReport from '@/components/Identity/RiskReport';
import LiveDetectionPanel from '@/components/Identity/LiveDetectionPanel';
import { analyzeIdentity } from '@/app/actions/verify-identity';

type IdentityResult = {
  success?: boolean;
  verdict?: string;
  trustScore?: number;
  message?: string;
  [key: string]: unknown;
};

type HistoryItem = {
  id: string;
  imageUrl?: string;
  fileName?: string;
  verdict?: string;
  trustScore?: number;
  reasoning?: string;
  category?: string;
  timestamp?: {
    toDate: () => Date;
  };
};

export default function IdentityGuardPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<IdentityResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState<"artifacts" | "realtime">("artifacts");
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 8;

  const fetchHistory = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const q = query(
        collection(db, "identityLogs"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc")
      );
      const snap = await getDocs(q);
      setHistory(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<HistoryItem, "id">) })));
    } catch (err) {
      console.error("History fetch error:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, results]);

  useEffect(() => {
    setHistoryPage(1);
  }, [history.length]);

  const handleUpload = async (file: File) => {
    if (!user?.uid) return alert("Please ensure you are logged in.");

    setLoading(true);
    setResults(null);
    setProgress(10);
    setStatus("Securing artifact in Vault...");

    try {
      // 1. 📂 VAULTING STAGE (Firebase Storage)
      const storageRef = ref(storage, `audit-vault/${user.uid}/${Date.now()}-${file.name}`);
      const uploadTask = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadTask.ref);

      setProgress(40);
      setStatus("Initiating AI Forensic Scan...");

      // 2. 🧠 AI PROCESSING STAGE (Simulate tick while waiting for Gemini)
      const progressInterval = setInterval(() => {
        setProgress(prev => (prev < 85 ? prev + 2 : prev));
      }, 800);

      const formData = new FormData();
      formData.append('file', file);

      const data = await analyzeIdentity(formData, user.uid, downloadURL);

      clearInterval(progressInterval); // Stop the "fake" ticking

      if (data.success) {
        setProgress(95);
        setStatus("Finalizing Registry Log...");
        setResults(data);
      } else {
        setResults(data);
      }

    } catch (error) {
      console.error("Forensic upload failed:", error);
      setResults({ success: false, message: "Forensic Engine (AI) No Function" });
    } finally {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
        setStatus("");
      }, 800);
    }
  };

  const isSecure = results?.verdict === "REAL" || !results || results?.success === false;
  const displayScore = results?.success !== false ? (results?.trustScore ?? '--') : 'ERR';
  const totalHistoryPages = Math.max(1, Math.ceil(history.length / historyPageSize));
  const paginatedHistory = history.slice(
    (historyPage - 1) * historyPageSize,
    historyPage * historyPageSize
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 custom-scrollbar">

      {/* 1. Header Banner */}
      <div className="bg-[#1e293b]/30 border border-slate-800 rounded-3xl p-8 mb-8 flex justify-between items-center backdrop-blur-md relative overflow-hidden">
        <div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[100px] opacity-10 transition-colors duration-1000 ${results?.success === false ? 'bg-orange-500' : isSecure ? 'bg-emerald-500' : 'bg-rose-500'}`} />

        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Identity Guard Module</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            System Status: <span className="text-blue-400">ACTIVE MONITORING</span>
          </h1>
        </div>

        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trust Assessment</p>
            <p className={`text-3xl font-black italic ${results?.success === false ? 'text-orange-400' : isSecure ? 'text-emerald-400' : 'text-rose-400'}`}>
              {displayScore}{results?.success !== false && '%'} <span className="text-sm font-medium opacity-50">Score</span>
            </p>
          </div>
          <div className={`h-14 w-14 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${results?.success === false ? 'border-orange-500/20' : isSecure ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-[10px] border ${results?.success === false ? 'bg-orange-500/10 text-orange-500 border-orange-500/50' : isSecure ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50' : 'bg-rose-500/10 text-rose-500 border-rose-500/50'}`}>
              {results?.success === false ? 'OFFLINE' : isSecure ? 'SAFE' : 'RISK'}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-[30px] border border-slate-800 bg-[#071120]/80 p-3 backdrop-blur-xl shadow-[0_24px_70px_rgba(2,6,23,0.4)]">
        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTab("artifacts")}
            className={`rounded-[24px] border px-5 py-5 text-left transition-all ${
              activeTab === "artifacts"
                ? "border-blue-400/30 bg-[linear-gradient(135deg,rgba(59,130,246,0.22),rgba(15,23,42,0.92))] shadow-[0_18px_40px_rgba(59,130,246,0.18)]"
                : "border-slate-800 bg-slate-950/30 hover:border-slate-700 hover:bg-slate-900/40"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
                  Tab 01
                </p>
                <h2 className="mt-2 flex items-center gap-2 text-lg font-black text-white">
                  <FileBadge2 size={18} className="text-blue-400" />
                  Document + selfie verify
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">
                  Keep your existing upload flow for certificate documents and biometric
                  photos with the forensic report on the right.
                </p>
              </div>
              <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-blue-300">
                Static Verify
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("realtime")}
            className={`rounded-[24px] border px-5 py-5 text-left transition-all ${
              activeTab === "realtime"
                ? "border-cyan-400/30 bg-[linear-gradient(135deg,rgba(34,211,238,0.18),rgba(15,23,42,0.92))] shadow-[0_18px_40px_rgba(34,211,238,0.14)]"
                : "border-slate-800 bg-slate-950/30 hover:border-slate-700 hover:bg-slate-900/40"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
                  Tab 02
                </p>
                <h2 className="mt-2 flex items-center gap-2 text-lg font-black text-white">
                  <Camera size={18} className="text-cyan-300" />
                  Realtime deepfake detect
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">
                  Turn on the webcam for a live identity radar, then capture a frame and
                  send it to the same AI scan pipeline.
                </p>
              </div>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200">
                Real time
              </span>
            </div>
          </button>
        </div>
      </div>

      {activeTab === "artifacts" ? (
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-5 flex flex-col">
            <h2 className="text-lg font-bold flex items-center gap-2 italic mb-8">
              <Lock size={18} className="text-blue-500" /> Verification Inputs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <UploadZone title="Identity Document" onUpload={handleUpload} />
              <UploadZone title="Biometric Selfie" onUpload={handleUpload} />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7 flex flex-col">
            <h2 className="text-lg font-bold mb-8 flex items-center gap-2 italic">
              <Activity size={18} className="text-blue-500" /> Forensic Report
            </h2>

            {loading ? (
              <div className="bg-[#1e293b]/10 border border-slate-800 rounded-3xl p-20 flex flex-col items-center justify-center backdrop-blur-md animate-in fade-in duration-500 flex-1">
                <div className="w-full max-w-xs bg-slate-900/50 h-1.5 rounded-full overflow-hidden mb-6 border border-slate-800">
                  <div
                    className="h-full bg-blue-500 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <RefreshCcw size={14} className="text-blue-400 animate-spin" />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                    {status} <span className="text-blue-500 ml-1">{progress}%</span>
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 mt-8 font-mono uppercase tracking-tighter">
                  Establishing Secure WebSocket... Gemini-3 Node Ready
                </p>
              </div>
            ) : results && results.success === false ? (
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-3xl p-12 flex flex-col items-center justify-center text-center backdrop-blur-md animate-in fade-in zoom-in duration-300 flex-1">
                <AlertTriangle className="mx-auto mb-4 text-orange-500" size={48} />
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                  Forensic Engine: <span className="text-orange-500">No Function</span>
                </h3>
                <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto italic leading-relaxed">
                  {results.message || "The AI model is currently unreachable. Check your daily quota."}
                </p>
                <button
                  onClick={() => setResults(null)}
                  className="mt-8 flex items-center gap-2 mx-auto bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/30 px-6 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all active:scale-95"
                >
                  <RefreshCcw size={14} /> Retry Forensic Link
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full">
                <RiskReport results={results} loading={loading} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <LiveDetectionPanel onCapture={handleUpload} loading={loading} />

          <div className="rounded-[30px] border border-slate-800 bg-[#071120]/70 p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                  Captured Frame Analysis
                </p>
                <h2 className="mt-2 flex items-center gap-2 text-lg font-black text-white">
                  <Activity size={18} className="text-cyan-300" /> AI forensic report
                </h2>
              </div>
            </div>

            {loading ? (
              <div className="bg-[#1e293b]/10 border border-slate-800 rounded-3xl p-20 flex flex-col items-center justify-center backdrop-blur-md animate-in fade-in duration-500">
                <div className="w-full max-w-xs bg-slate-900/50 h-1.5 rounded-full overflow-hidden mb-6 border border-slate-800">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(34,211,238,0.55)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <RefreshCcw size={14} className="text-cyan-300 animate-spin" />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                    {status} <span className="text-cyan-300 ml-1">{progress}%</span>
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 mt-8 font-mono uppercase tracking-tighter">
                  Streaming captured frame into forensic engine...
                </p>
              </div>
            ) : results && results.success === false ? (
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-3xl p-12 flex flex-col items-center justify-center text-center backdrop-blur-md animate-in fade-in zoom-in duration-300">
                <AlertTriangle className="mx-auto mb-4 text-orange-500" size={48} />
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                  Realtime Scanner: <span className="text-orange-500">Analysis Unavailable</span>
                </h3>
                <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto italic leading-relaxed">
                  {results.message || "The AI model is currently unreachable. Check your daily quota."}
                </p>
                <button
                  onClick={() => setResults(null)}
                  className="mt-8 flex items-center gap-2 mx-auto bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/30 px-6 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all active:scale-95"
                >
                  <RefreshCcw size={14} /> Reset scanner
                </button>
              </div>
            ) : (
              <RiskReport results={results} loading={loading} />
            )}
          </div>
        </div>
      )}

      {/* 📜 ENHANCED AUDIT LOG REGISTRY */}
      <div className="mt-12 bg-[#1e293b]/10 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <History size={16} className="text-blue-500" /> Forensic Audit Registry
          </h2>
          <div className="text-right">
            <span className="block text-[9px] text-slate-500 font-mono uppercase tracking-widest">Linked Artifacts Enabled</span>
            <span className="block mt-1 text-[10px] text-slate-400 font-semibold">
              {history.length} total records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] font-medium border-separate border-spacing-0">
            <thead className="bg-slate-900/50 text-slate-500 uppercase tracking-widest text-[9px]">
              <tr>
                <th className="px-6 py-4 border-b border-slate-800">Artifact (Click to View)</th>
                <th className="px-6 py-4 border-b border-slate-800">AI Forensic Commentary</th>
                <th className="px-6 py-4 border-b border-slate-800 text-center">Verdict</th>
                <th className="px-6 py-4 border-b border-slate-800 text-right">Trust Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-400">
              {paginatedHistory.length > 0 ? (
                paginatedHistory.map((log) => (
                  (() => {
                    const trustScore = log.trustScore ?? 0;

                    return (
                      <tr key={log.id} className="hover:bg-blue-500/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <a
                          href={log.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 hover:border-blue-500/50 overflow-hidden transition-all group/img relative"
                        >
                        {log.imageUrl ? (
                          <>
                            <img src={log.imageUrl} alt="Scan" className="h-full w-full object-cover opacity-60 group-hover/img:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 bg-black/40 transition-opacity">
                                <ExternalLink size={12} className="text-white" />
                              </div>
                            </>
                          ) : (
                            <Fingerprint size={16} className="text-slate-500" />
                          )}
                        </a>

                        <div className="flex flex-col min-w-0">
                          <a
                            href={log.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-200 font-bold uppercase truncate max-w-[120px] tracking-tight hover:text-blue-400 transition-colors"
                          >
                            {log.fileName || "Artifact"}
                          </a>
                          <span className="text-[9px] text-slate-600 font-mono">
                            {log.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 max-w-xs lg:max-w-md">
                      <p className="italic leading-relaxed text-slate-500 group-hover:text-slate-400 transition-colors line-clamp-2">
                        &ldquo;{log.reasoning || "Forensic metadata logged successfully."}&rdquo;
                      </p>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest border transition-all ${log.verdict === 'REAL'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : log.verdict === 'DEEPFAKE' || log.verdict === 'SYNTHETIC'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                        {log.verdict}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-black italic tracking-tighter ${trustScore > 70 ? 'text-blue-400' : 'text-rose-400'
                        }`}>
                        {trustScore}%
                      </span>
                    </td>
                      </tr>
                    );
                  })()
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-600 italic">
                    <Fingerprint className="mx-auto mb-2 opacity-10" size={48} />
                    <p className="text-sm font-medium">Registry empty. Artifact vault locked.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {history.length > historyPageSize && (
          <div className="flex flex-col gap-3 border-t border-slate-800 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
              Showing {(historyPage - 1) * historyPageSize + 1}-
              {Math.min(historyPage * historyPageSize, history.length)} of {history.length}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                disabled={historyPage === 1}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-300 transition hover:border-slate-600 hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Prev
              </button>

              <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Page {historyPage} / {totalHistoryPages}
              </span>

              <button
                type="button"
                onClick={() => setHistoryPage((page) => Math.min(totalHistoryPages, page + 1))}
                disabled={historyPage === totalHistoryPages}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-300 transition hover:border-slate-600 hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
