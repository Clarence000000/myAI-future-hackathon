"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Shield, Lock, Share2, User, CreditCard, LogOut } from 'lucide-react';
import { useAuth } from "@/components/AuthProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617]">
        <div className="animate-pulse text-blue-500 font-bold tracking-widest uppercase text-sm">
          Verifying Credentials...
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'ScamShield', href: '/dashboard/scam-shield', icon: <Shield size={18} /> },
    { name: 'IdentityGuard', href: '/dashboard/identity-guard', icon: <Lock size={18} /> },
    { name: 'Transaction Fraud', href: '/dashboard/transaction-fraud', icon: <CreditCard size={18} /> },
    // { name: 'FraudGraph', href: '/dashboard/fraud-graph', icon: <Share2 size={18}/> },
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${isActive
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

        {/* PROFILE SECTION (Matching your reference image) */}
        <div className="p-6 border-t border-slate-800/50">
          <div className="flex flex-col gap-3 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                <User size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate" title={user?.email || "Admin Unit 04"}>
                  {user?.email || "Admin Unit 04"}
                </p>
                <p className="text-[10px] text-slate-500">Verified Access</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white bg-slate-800/50 hover:bg-red-500/20 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/30"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {children}
      </main>
    </div>
  );
}