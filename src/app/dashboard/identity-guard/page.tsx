"use client";
import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, UserCheck, Activity, Globe, Lock, AlertTriangle, History, Fingerprint, ExternalLink, RefreshCcw } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/clientApp";
import { useAuth } from "@/components/AuthProvider";
import UploadZone from '@/components/Identity/UploadZone';
import RiskReport from '@/components/Identity/RiskReport';
import { analyzeIdentity } from '@/app/actions/verify-identity';

export default function IdentityGuardPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  
  // 🚀 NEW: Progress and Status States
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setSessionId(`#ID-${Math.floor(Math.random() * 9000) + 1000}`);
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const q = query(
        collection(db, "identityLogs"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(5)
      );
      const snap = await getDocs(q);
      setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("History fetch error:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, results]);

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

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 custom-scrollbar">
      
      {/* 1. Header Banner */}
      <div className="bg-[#1e293b]/30 border border-slate-800 rounded-3xl p-8 mb-8 flex justify-between items-center backdrop-blur-md relative overflow-hidden">
        <div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[100px] opacity-10 transition-colors duration-1000 ${results?.success === false ? 'bg-orange-500' : isSecure ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Identity Risk Profile</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Analysis Session: <span className="text-blue-400">{sessionId || "INITIALIZING..."}</span>
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

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-5 space-y-8">
          <h2 className="text-lg font-bold flex items-center gap-2 italic">
            <Lock size={18} className="text-blue-500" /> Verification Inputs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <UploadZone title="Identity Document" onUpload={handleUpload} />
             <UploadZone title="Biometric Selfie" onUpload={handleUpload} />
          </div>
        </div>

        {/* 🧪 UPDATED FORENSIC REPORT COLUMN WITH PROGRESS BAR */}
        <div className="col-span-12 lg:col-span-7">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 italic">
            <Activity size={18} className="text-blue-500" /> Forensic Report
          </h2>
          
          {loading ? (
            <div className="bg-[#1e293b]/10 border border-slate-800 rounded-3xl p-20 flex flex-col items-center justify-center backdrop-blur-md animate-in fade-in duration-500">
               {/* 🚀 Sleek Futuristic Progress Bar */}
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
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-3xl p-12 text-center backdrop-blur-md animate-in fade-in zoom-in duration-300">
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
            <RiskReport results={results} loading={loading} />
          )}
        </div>
      </div>

      {/* 📜 ENHANCED AUDIT LOG REGISTRY */}
      <div className="mt-12 bg-[#1e293b]/10 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <History size={16} className="text-blue-500" /> Forensic Audit Registry
          </h2>
          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Linked Artifacts Enabled</span>
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
              {history.length > 0 ? (
                history.map((log) => (
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
                        "{log.reasoning || "Forensic metadata logged successfully."}"
                      </p>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest border transition-all ${
                        log.verdict === 'REAL' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : log.verdict === 'DEEPFAKE' || log.verdict === 'SYNTHETIC'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {log.verdict}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-black italic tracking-tighter ${
                        log.trustScore > 70 ? 'text-blue-400' : 'text-rose-400'
                      }`}>
                        {log.trustScore}%
                      </span>
                    </td>
                  </tr>
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
      </div>
    </div>
  );
}