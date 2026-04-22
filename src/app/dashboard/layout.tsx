"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Lock, Share2, User } from 'lucide-react';
import { useAuth } from "@/components/AuthProvider";



export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const navItems = [
    { name: 'ScamShield', href: '/dashboard/scam-shield', icon: <Shield size={18}/> },
    { name: 'IdentityGuard', href: '/dashboard/identity-guard', icon: <Lock size={18}/> },
    { name: 'FraudGraph', href: '/dashboard/transaction-fraud', icon: <Share2 size={18}/> },
  ];

  return (
    // Main Container - The deepest dark color
    <div className="flex h-screen bg-[#020617] text-slate-300 font-sans selection:bg-blue-500/30">
      
      {/* SIDEBAR - Dark Navy */}
      <aside className="w-64 bg-[#020617] border-r border-slate-800/50 flex flex-col">
        <div className="p-8">
          <h1 className="text-xl font-black text-white tracking-tighter flex items-center gap-2">
            <span className="text-blue-500">Fin</span>Trust AI
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Enterprise Security</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                    : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <span className={`${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* PROFILE SECTION (Clickable Link to Profile Page) */}
<div className="p-6 border-t border-slate-800/50">
  
  {/* 👈 We changed this from a <div> to a <Link> */}
  <Link 
    href="/dashboard/profile" 
    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/50 hover:bg-slate-800 transition-all cursor-pointer group"
  >
    
    {/* DYNAMIC AVATAR */}
    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-900/20 group-hover:shadow-blue-500/40 transition-all">
      {user?.photoURL ? (
        <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
      ) : (
        <User size={20} />
      )}
    </div>
    
    {/* DYNAMIC TEXT */}
    <div className="flex flex-col min-w-0"> 
      <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
        {user?.displayName || "User123"}
      </p>
      <p className="text-[10px] text-emerald-500 font-mono truncate">
        {user?.email || "Verified Access"}
      </p>
    </div>
    
  </Link>
</div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {children}
      </main>
    </div>
  );
}