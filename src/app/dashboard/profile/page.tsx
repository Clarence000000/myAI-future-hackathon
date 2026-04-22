"use client";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { User, Shield, Key, Smartphone, Mail, Activity, LogOut, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  if (!user) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-slate-500 font-mono text-sm">
        <Activity className="animate-spin mr-2" size={16} /> Verifying Admin Credentials...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 custom-scrollbar">
      
      {/* HEADER */}
      <div className="mb-8">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Control Center</p>
        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ========================================= */}
        {/* LEFT COLUMN: ID CARD & QUICK ACTIONS      */}
        {/* ========================================= */}
        <div className="space-y-8">
          
          {/* Identity Card */}
          <div className="bg-[#1e293b]/30 border border-slate-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-slate-800" />
            
            <div className="relative z-10 flex flex-col items-center mt-6">
              <div className="w-24 h-24 bg-slate-900 border-4 border-slate-800 rounded-full flex items-center justify-center shadow-2xl relative">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User size={40} className="text-slate-500" />
                )}
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-slate-900" />
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-white mt-4">{user.displayName || "Admin Unit 04"}</h2>
              <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                <Mail size={14} /> {user.email}
              </div>

              <div className="w-full mt-8 bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                <div className="flex justify-between items-center mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <span>Clearance Level</span>
                  <span className="text-blue-400">Level 5 (Max)</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <span>UID Hash</span>
                  <span className="font-mono text-slate-300 truncate max-w-[120px]">{user.uid}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <button 
            onClick={signOut}
            className="w-full py-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 font-bold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <LogOut size={16} /> Terminate Secure Session
          </button>
        </div>

        {/* ========================================= */}
        {/* RIGHT COLUMN: SECURITY SETTINGS           */}
        {/* ========================================= */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Authentication Protocols */}
          <div className="bg-[#1e293b]/30 border border-slate-800 rounded-3xl p-8 backdrop-blur-md">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Shield size={20} className="text-emerald-500" /> Authentication Protocols
            </h3>

            <div className="space-y-6">
              {/* 2FA Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${twoFactorEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Biometric Multi-Factor (2FA)</h4>
                    <p className="text-xs text-slate-500 mt-1">Require mobile approval for new logins.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${twoFactorEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                    <Key size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">Master Password</h4>
                    <p className="text-xs text-slate-500 mt-1">Last changed 14 days ago.</p>
                  </div>
                </div>
                <button className="text-xs font-bold px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                  Update
                </button>
              </div>
            </div>
          </div>

          {/* Developer / API Integrations */}
          <div className="bg-[#1e293b]/30 border border-slate-800 rounded-3xl p-8 backdrop-blur-md">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Activity size={20} className="text-purple-500" /> Developer Integrations
            </h3>

            <div className="space-y-4">
              <p className="text-xs text-slate-400 mb-4">
                Use these API keys to connect external endpoints to the FinTrust Neural Engine. Do not share these publicly.
              </p>

              <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Production API Key</p>
                  <p className="font-mono text-sm text-slate-300 blur-sm hover:blur-none transition-all cursor-crosshair">
                    ft_live_9x8a7b6c5d4e3f2g1h0
                  </p>
                </div>
                <button className="text-xs font-bold text-purple-400 hover:text-purple-300">Copy</button>
              </div>

              <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Test Webhook Endpoint</p>
                  <p className="font-mono text-sm text-slate-300 truncate max-w-[200px]">
                    https://api.fintrust.ai/v1/webhook
                  </p>
                </div>
                <button className="text-xs font-bold text-purple-400 hover:text-purple-300">Copy</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}