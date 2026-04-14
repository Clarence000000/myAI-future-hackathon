"use client";
import { ShieldCheck, AlertCircle, Users, FileText, Fingerprint, Activity, Image, Search, AlertTriangle } from 'lucide-react';

export default function RiskReport({ results, loading }: any) {
  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-slate-500 font-bold tracking-widest text-[10px] animate-pulse uppercase tracking-[0.3em]">Establishing Forensic Link...</p>
    </div>
  );

  // 🚨 Handle "AI No Function" State
  if (results && results.success === false) {
    return (
      <div className="bg-orange-500/5 border border-orange-500/20 rounded-3xl p-12 text-center backdrop-blur-md">
        <AlertTriangle className="mx-auto mb-4 text-orange-500" size={48} />
        <h3 className="text-xl font-black text-white uppercase tracking-tighter">
          Forensic Engine: <span className="text-orange-500">No Function</span>
        </h3>
        <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto italic">
          Biometric analysis failed. This is a system timeout, not a fraud detection.
        </p>
      </div>
    );
  }

  if (!results) return (
    <div className="p-20 text-center border-2 border-dashed border-slate-800/50 rounded-3xl text-slate-600 bg-slate-900/10">
      <Fingerprint className="mx-auto mb-4 opacity-20" size={48} />
      <p className="text-sm font-medium italic">Awaiting security artifacts for analysis...</p>
    </div>
  );

  // 🧮 Logic Mapping for your Identity-First UI
  const verdict = results.verdict; // REAL | DEEPFAKE | DIGITAL_SRC | INVALID
  const trust = results.trustScore ?? 0;
  const risk = results.riskPercentage ?? 0;
  const category = results.category || "UNKNOWN";

  // Visual Styles based on Verdict
  // 1. Define the style dictionary with a unique name
  const VERDICT_REGISTRY = {
    REAL: { color: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/20", label: "✓ AUTHENTIC" },
    DIGITAL_SRC: { color: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/20", label: "✧ IDENTITY VERIFIED" },
    DEEPFAKE: { color: "text-rose-400", bg: "bg-rose-500/5", border: "border-rose-500/20", label: "⚠ DEEPFAKE DETECTED" },
    INVALID: { color: "text-slate-400", bg: "bg-slate-800/10", border: "border-slate-800/50", label: "✕ INVALID ENTITY" }
  };

  // 2. Perform the lookup (this fixes the "used before declaration" error)
  const styles = VERDICT_REGISTRY[verdict as keyof typeof VERDICT_REGISTRY] || VERDICT_REGISTRY.INVALID;
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* 1. IMPACT VERDICT HEADER */}
      <div className={`relative overflow-hidden p-6 rounded-2xl border transition-colors duration-500 ${styles.bg} ${styles.border}`}>
        <div className="flex justify-between items-center relative z-10">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Source Verdict</p>
            <h3 className={`text-3xl font-black italic tracking-tighter ${styles.color}`}>
              {styles.label}
            </h3>
          </div>
          <div className={`h-14 w-14 rounded-2xl flex flex-col items-center justify-center border transition-all ${styles.border} ${styles.color} bg-white/5`}>
             <p className="text-[8px] font-bold mb-1 uppercase">Trust</p>
             <span className="text-lg font-black leading-none">{trust}%</span>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC SCORE & INFO */}
      <div className="grid grid-cols-2 gap-4">
        {/* Risk Probability Bar */}
        <div className="bg-[#1e293b]/20 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deepfake Risk</h4>
            <span className={`text-xs font-bold ${risk < 40 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {risk}% Risk
            </span>
          </div>
          <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div 
              className={`h-full transition-all duration-1000 ${risk < 40 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} 
              style={{ width: `${risk}%` }}
            />
          </div>
        </div>

        {/* Category Details */}
        <div className="bg-[#1e293b]/20 border border-slate-800 rounded-2xl p-5 flex items-center justify-between backdrop-blur-sm">
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Capture Source</h4>
            <p className="text-sm font-black text-white mt-1 tracking-tight">
              {verdict === 'DIGITAL_SRC' ? 'SCREENSHOT' : verdict === 'REAL' ? 'DIRECT SENSOR' : 'SYNTHETIC'}
            </p>
          </div>
          <div className="text-slate-600 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            {verdict === 'DIGITAL_SRC' ? <Search size={18} className="text-blue-400"/> : verdict === 'DEEPFAKE' ? <Activity size={18} className="text-rose-400"/> : <ShieldCheck size={18} className="text-emerald-400"/>}
          </div>
        </div>
      </div>

      {/* 4. FORENSIC CHECKLIST */}
      <div className="bg-[#1e293b]/20 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest">Forensic Integrity Checklist</h4>
          <span className="text-[9px] bg-slate-950 text-slate-500 px-2 py-0.5 rounded italic font-mono uppercase tracking-tighter">Scan ID: #GAIA-{Math.floor(Math.random() * 99)}</span>
        </div>
        <ul className="space-y-4">
            <CheckItem 
              label="Human Identity Verification" 
              status={results.subjectCount > 0} 
              refId={results.subjectCount > 0 ? "BIOLOGICAL" : "NONE"} 
            />
            <CheckItem 
              label="Neural Artifact Mapping" 
              status={!results.isSynthetic} 
              refId={results.isSynthetic ? "GAN_DETECTED" : "CLEAN"} 
            />
            <CheckItem 
              label="Source Integrity Check" 
              status={verdict !== 'DEEPFAKE'} 
              refId={verdict === 'DIGITAL_SRC' ? "SCREEN_CAP" : "LIVE_CAP"} 
            />
        </ul>
      </div>

      {/* 5. THE FORENSIC REASONING TERMINAL */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl shadow-inner group relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">AI Forensic Analysis Log</h4>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-mono italic">
          "{results.riskReasoning || "Establishing neural fingerprint for subject analysis..."}"
        </p>
        <div className="absolute right-4 bottom-4 text-[8px] font-bold text-slate-800 uppercase tracking-widest">
          FinTrust AI Forensic v2.6
        </div>
      </div>
    </div>
  );
}

function CheckItem({ label, status, refId }: any) {
  return (
    <li className="flex justify-between items-center group">
      <div className="flex items-center gap-3">
        <div className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all duration-300 ${status ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          <ShieldCheck size={14} className={status ? 'animate-in zoom-in' : ''} />
        </div>
        <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{label}</span>
      </div>
      <span className={`text-[10px] font-mono px-2 py-1 rounded border ${status ? 'text-emerald-500/60 bg-emerald-500/5 border-emerald-500/10' : 'text-rose-500/60 bg-rose-500/5 border-rose-500/10'}`}>
        {refId}
      </span>
    </li>
  );
}