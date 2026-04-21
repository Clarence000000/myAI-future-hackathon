"use client";
import { useState } from 'react';
import { ShieldAlert, Activity, RefreshCcw, CreditCard } from 'lucide-react';

export default function TransactionFraudPage() {
  const [sessionId] = useState(`#TXN-${Math.floor(Math.random() * 9000) + 1000}`);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 custom-scrollbar">
      {/* Header Banner */}
      <div className="bg-[#1e293b]/30 border border-slate-800 rounded-3xl p-8 mb-8 flex justify-between items-center backdrop-blur-md relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[100px] opacity-10 bg-blue-500 transition-colors duration-1000" />
        
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Transaction Fraud Prevention</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Analysis Session: <span className="text-blue-400">{sessionId}</span>
          </h1>
        </div>

        <div className="flex items-center gap-6 text-right">
          <div className="h-14 w-14 rounded-full border-4 flex items-center justify-center transition-all duration-500 border-blue-500/20">
            <div className="h-10 w-10 rounded-full flex items-center justify-center font-black text-[10px] border bg-blue-500/10 text-blue-500 border-blue-500/50">
              READY
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-12 space-y-8">
          <h2 className="text-lg font-bold flex items-center gap-2 italic">
            <CreditCard size={18} className="text-blue-500" /> Transaction Monitoring (Coming Soon)
          </h2>
          
          <div className="bg-[#1e293b]/10 border border-slate-800 rounded-3xl p-20 flex flex-col items-center justify-center backdrop-blur-md">
            <ShieldAlert size={48} className="text-blue-500 mb-4 opacity-50" />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">
              Transaction Engine: <span className="text-blue-500">Initializing...</span>
            </h3>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto italic leading-relaxed text-center">
              The real-time transaction fraud prevention module is currently under development. This will allow you to monitor and block suspicious transactions instantly.
            </p>
            <button className="mt-8 flex items-center gap-2 mx-auto bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/30 px-6 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all active:scale-95">
              <RefreshCcw size={14} /> Refresh Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
