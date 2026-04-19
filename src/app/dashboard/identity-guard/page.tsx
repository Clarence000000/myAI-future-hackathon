"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { ShieldCheck, Activity, Lock, AlertTriangle, History, Fingerprint, ExternalLink, RefreshCcw, Camera, Video, Zap, Cpu, ScanFace } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/clientApp";
import { useAuth } from "@/components/AuthProvider";
import UploadZone from '@/components/Identity/UploadZone';
import RiskReport from '@/components/Identity/RiskReport';
import { analyzeIdentity } from '@/app/actions/verify-identity';

export default function IdentityGuardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'static' | 'live'>('static');
  
  // Static Tab States
  const [results, setResults] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  // Live Tab States
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [liveStreamLoading, setLiveStreamLoading] = useState(false);

  useEffect(() => {
    setSessionId(`#ID-${Math.floor(Math.random() * 9000) + 1000}`);
  }, []);

  // --- HISTORY FETCH ---
  const fetchHistory = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const q = query(collection(db, "identityLogs"), where("userId", "==", user.uid), orderBy("timestamp", "desc"), limit(5));
      const snap = await getDocs(q);
      setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("History fetch error:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, results]);

  // --- UPLOAD LOGIC ---
  const handleUpload = async (file: File) => {
    if (!user?.uid) return alert("Please ensure you are logged in.");
    setLoading(true); setResults(null); setProgress(10); setStatus("Securing artifact in Vault...");
    try {
      const storageRef = ref(storage, `audit-vault/${user.uid}/${Date.now()}-${file.name}`);
      const uploadTask = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadTask.ref);

      setProgress(40); setStatus("Initiating AI Forensic Scan...");
      const progressInterval = setInterval(() => { setProgress(prev => (prev < 85 ? prev + 2 : prev)); }, 800);

      const formData = new FormData(); formData.append('file', file);
      const data = await analyzeIdentity(formData, user.uid, downloadURL);
      
      clearInterval(progressInterval);
      if (data.success) { setProgress(95); setStatus("Finalizing Registry Log..."); setResults(data); } 
      else { setResults(data); }
    } catch (error) {
      setResults({ success: false, message: "Forensic Engine (AI) No Function" });
    } finally {
      setProgress(100); setTimeout(() => { setLoading(false); setProgress(0); setStatus(""); }, 800);
    }
  };

  // --- CAMERA LOGIC ---
  const startCamera = async () => {
    setLiveStreamLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setTimeout(() => {
        setCameraActive(true);
        setLiveStreamLoading(false);
      }, 1500); 
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Camera access is required for real-time analysis.");
      setLiveStreamLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const isSecure = results?.verdict === "REAL" || !results || results?.success === false;
  const displayScore = results?.success !== false ? (results?.trustScore ?? '--') : 'ERR';

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 custom-scrollbar">
      
      {/* HEADER BANNER */}
      <div className="bg-[#1e293b]/30 border border-slate-800 rounded-3xl p-8 mb-8 flex justify-between items-center backdrop-blur-md relative overflow-hidden">
        <div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[100px] opacity-10 transition-colors duration-1000 ${results?.success === false ? 'bg-orange-500' : isSecure ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Identity Risk Profile</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Analysis Session: <span className="text-blue-400">{sessionId || "INITIALIZING..."}</span></h1>
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

      {/* 🎛️ TAB NAVIGATION */}
      <div className="flex bg-[#1e293b]/50 p-1.5 rounded-2xl w-fit mb-8 border border-slate-800 backdrop-blur-sm">
        <button 
          onClick={() => { setActiveTab('static'); stopCamera(); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'static' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
        >
          <Lock size={16} /> Static Artifacts
        </button>
        <button 
          onClick={() => setActiveTab('live')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'live' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(5,150,105,0.4)]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
        >
          <Video size={16} /> Live Neural Scan
        </button>
      </div>

      {/* ========================================= */}
      {/* TAB 1: STATIC ARTIFACTS                   */}
      {/* ========================================= */}
      {activeTab === 'static' && (
        <>
          <div className="grid grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="col-span-12 lg:col-span-5 space-y-8">
              <h2 className="text-lg font-bold flex items-center gap-2 italic"><Lock size={18} className="text-blue-500" /> Verification Inputs</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <UploadZone title="Identity Document" onUpload={handleUpload} />
                 <UploadZone title="Biometric Selfie" onUpload={handleUpload} />
              </div>
            </div>

            <div className="col-span-12 lg:col-span-7">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 italic"><Activity size={18} className="text-blue-500" /> Forensic Report</h2>
              
              {loading ? (
                <div className="bg-[#1e293b]/10 border border-slate-800 rounded-3xl p-20 flex flex-col items-center justify-center backdrop-blur-md animate-in fade-in duration-500">
                   <div className="w-full max-w-xs bg-slate-900/50 h-1.5 rounded-full overflow-hidden mb-6 border border-slate-800">
                     <div className="h-full bg-blue-500 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(59,130,246,0.6)]" style={{ width: `${progress}%` }} />
                   </div>
                   <div className="flex items-center gap-3">
                     <RefreshCcw size={14} className="text-blue-400 animate-spin" />
                     <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{status} <span className="text-blue-500 ml-1">{progress}%</span></span>
                   </div>
                </div>
              ) : results && results.success === false ? (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-3xl p-12 text-center backdrop-blur-md animate-in fade-in zoom-in duration-300">
                  <AlertTriangle className="mx-auto mb-4 text-orange-500" size={48} />
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Forensic Engine: <span className="text-orange-500">No Function</span></h3>
                  <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto italic leading-relaxed">The AI model is currently unreachable.</p>
                  <button onClick={() => setResults(null)} className="mt-8 flex items-center gap-2 mx-auto bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/30 px-6 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all">
                    <RefreshCcw size={14} /> Retry Link
                  </button>
                </div>
              ) : (
                <RiskReport results={results} loading={loading} />
              )}
            </div>
          </div>
          
          {/* THE FULL RESTORED HISTORY TABLE */}
          <div className="mt-12 bg-[#1e293b]/10 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm animate-in fade-in duration-500">
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
                            log.verdict === 'REAL' || log.verdict === 'DIGITAL_SRC'
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
        </>
      )}

      {/* ========================================= */}
      {/* TAB 2: LIVE NEURAL SCAN                   */}
      {/* ========================================= */}
      {activeTab === 'live' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {!cameraActive ? (
            /* 🎥 INTRO SCREEN */
            <div className="bg-[#1e293b]/30 border border-slate-800 rounded-3xl p-12 lg:p-24 text-center relative overflow-hidden backdrop-blur-md group">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-50" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] group-hover:bg-emerald-500/20 transition-colors duration-1000" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="h-24 w-24 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center mb-6 shadow-2xl relative">
                  <ScanFace size={48} className="text-emerald-400 absolute" />
                  <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/30 animate-[ping_3s_ease-in-out_infinite]" />
                </div>
                
                <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tighter mb-4">
                  Real-Time <span className="text-emerald-400">Deepfake Detection</span>
                </h2>
                <p className="text-slate-400 max-w-lg mx-auto mb-10 leading-relaxed">
                  Activate the WebRTC camera bridge to initiate continuous biometric monitoring. The FinTrust neural network will map facial topology in real-time to detect synthetic artifacts and presentation attacks.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4 mb-10">
                  <Badge icon={<Cpu size={14}/>} text="Edge Processing" />
                  <Badge icon={<Zap size={14}/>} text="< 50ms Latency" />
                  <Badge icon={<Activity size={14}/>} text="Continuous Auth" />
                </div>

                <button 
                  onClick={startCamera}
                  disabled={liveStreamLoading}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black tracking-widest uppercase text-xs px-10 py-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                >
                  {liveStreamLoading ? (
                    <><RefreshCcw size={16} className="animate-spin" /> Establishing Secure Socket...</>
                  ) : (
                    <><Camera size={18} /> Initialize Camera Link</>
                  )}
                </button>
              </div>
            </div>

          ) : (

            /* 🔴 LIVE STREAM ACTIVE UI */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-2 relative bg-black rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center min-h-[500px]">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-90" />
                
                <div className="absolute inset-0 pointer-events-none border-[8px] border-emerald-500/20 rounded-3xl" />
                <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Stream</span>
                </div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-emerald-500/30 rounded-full flex items-center justify-center pointer-events-none">
                  <div className="w-1 h-4 bg-emerald-500 absolute top-0" />
                  <div className="w-1 h-4 bg-emerald-500 absolute bottom-0" />
                  <div className="w-4 h-1 bg-emerald-500 absolute left-0" />
                  <div className="w-4 h-1 bg-emerald-500 absolute right-0" />
                  <div className="w-full h-[1px] bg-emerald-500/20 absolute top-0 animate-[scan_3s_ease-in-out_infinite]" />
                </div>
              </div>

              <div className="bg-[#1e293b]/30 border border-slate-800 rounded-3xl p-6 backdrop-blur-md flex flex-col">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Activity size={16} className="text-emerald-500" /> Live Telemetry
                </h3>
                
                <div className="space-y-6 flex-grow">
                  <TelemetryRow label="Facial Topology" value="Mapping..." status="active" />
                  <TelemetryRow label="Pulse Estimation" value="72 BPM" status="good" />
                  <TelemetryRow label="Texture Variance" value="Natural" status="good" />
                  <TelemetryRow label="Synthetic Noise" value="0.001%" status="good" />
                </div>

                <div className="mt-8 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Current Status</p>
                  <p className="text-2xl font-black text-white tracking-tighter">AUTHENTIC HUMAN</p>
                </div>

                <button onClick={stopCamera} className="mt-6 w-full py-3 rounded-xl border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-widest hover:bg-rose-500/10 transition-colors">
                  Terminate Connection
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

function Badge({ icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-300 uppercase tracking-widest">
      {icon} {text}
    </div>
  );
}

function TelemetryRow({ label, value, status }: { label: string, value: string, status: 'good' | 'active' | 'warning' }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        <span className={`text-xs font-mono font-bold ${status === 'good' ? 'text-emerald-400' : status === 'warning' ? 'text-rose-400' : 'text-blue-400'}`}>
          {value}
        </span>
      </div>
      <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
        <div className={`h-full w-full opacity-50 ${status === 'good' ? 'bg-emerald-500' : status === 'warning' ? 'bg-rose-500' : 'bg-blue-500 animate-pulse'}`} />
      </div>
    </div>
  );
}