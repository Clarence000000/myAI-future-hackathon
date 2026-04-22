"use client";

import { ShieldCheck } from "lucide-react";

export default function AuthShowcase() {
  return (
    <section className="relative hidden overflow-hidden border-r border-slate-800/80 bg-[radial-gradient(circle_at_top,#16243f_0%,#111c33_45%,#0b1224_100%)] lg:flex lg:flex-col lg:justify-center lg:px-16">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:80px_80px]" />
      <div className="absolute left-20 top-20 h-56 w-56 rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute bottom-16 right-10 h-64 w-64 rounded-full bg-cyan-400/10 blur-[140px]" />

      <div className="relative z-10 mx-auto w-full max-w-[520px]">
        <div className="mb-12 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-300/70">
            Trusted Identity Intelligence
          </p>
          <h1 className="mt-4 text-5xl font-black tracking-tight text-white">
            <span className="text-blue-400">FinTrust</span> AI
          </h1>
          <p className="mx-auto mt-4 max-w-md text-lg leading-8 text-slate-400">
            Secure access for biometric review, scam defense, and realtime identity verification.
          </p>
        </div>

        <div className="relative mx-auto flex h-[520px] w-[420px] items-center justify-center">
          <div className="absolute top-[70px] h-[280px] w-[310px] rounded-[70px] border-[5px] border-slate-600/40 bg-slate-900/10" />
          <div className="absolute left-[110px] top-[154px] h-[78px] w-[78px] rounded-full bg-gradient-to-b from-white to-slate-200">
            <div className="absolute left-[24px] top-[22px] h-[40px] w-[40px] rounded-full bg-slate-950">
              <div className="absolute left-[6px] top-[6px] h-[10px] w-[10px] rounded-full bg-white" />
            </div>
          </div>
          <div className="absolute right-[110px] top-[154px] h-[78px] w-[78px] rounded-full bg-gradient-to-b from-white to-slate-200">
            <div className="absolute left-[24px] top-[22px] h-[40px] w-[40px] rounded-full bg-slate-950">
              <div className="absolute left-[6px] top-[6px] h-[10px] w-[10px] rounded-full bg-white" />
            </div>
          </div>

          <div className="absolute bottom-[52px] w-full rounded-[30px] border border-slate-500/40 bg-slate-800/90 px-8 py-12 shadow-[0_24px_80px_rgba(15,23,42,0.55)] backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <ShieldCheck size={34} strokeWidth={2.2} />
            </div>
            <h2 className="mt-6 text-center text-3xl font-black tracking-tight text-white">
              FINTRUST SECURE
            </h2>
            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
              Node: awaiting auth
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
