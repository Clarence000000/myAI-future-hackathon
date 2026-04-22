"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { auth } from "@/lib/firebase/clientApp";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard/identity-guard');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    try {
      setSubmitting(true);
      setError("");
      setNotice("");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/dashboard/identity-guard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
    }
  };

  const handleEmailSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setNotice("");

      const credential = await signInWithEmailAndPassword(auth, email, password);

      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user, {
          url: `${window.location.origin}/login`,
          handleCodeInApp: false,
        });
        await signOut(auth);
        setPendingVerificationEmail(email);
        setNotice(
          "Your email is not verified yet. We sent a fresh verification link to your inbox."
        );
        setPassword("");
        return;
      }
      router.push("/dashboard/identity-guard");
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <AuthShowcase />

        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-xl">
            <div className="mb-10 lg:hidden">
              <p className="text-[11px] font-black uppercase tracking-[0.36em] text-blue-300/70">
                Trusted Identity Intelligence
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
                <span className="text-blue-400">FinTrust</span> AI
              </h1>
            </div>

            <div className="rounded-[32px] border border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.96))] p-8 shadow-[0_24px_80px_rgba(2,6,23,0.55)] sm:p-10">
              <p className="text-[11px] font-black uppercase tracking-[0.34em] text-slate-500">
                Access Portal
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
                Welcome Back.
              </h2>
              <p className="mt-3 max-w-lg text-lg leading-8 text-slate-400">
                Log in to access your FinTrust AI dashboard and identity protection tools.
              </p>

              {error && (
                <div className="mt-8 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm leading-6 text-rose-200">
                  {error}
                </div>
              )}

              {notice && (
                <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm leading-6 text-emerald-100">
                  {notice}
                </div>
              )}

              <button
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-4 text-base font-bold text-white transition hover:border-slate-600 hover:bg-slate-800/70 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GoogleIcon />
                Sign in with Google
              </button>

              <div className="relative my-8 flex items-center">
                <div className="h-px flex-1 bg-slate-800" />
                <span className="px-4 text-xs font-black uppercase tracking-[0.32em] text-slate-500">
                  Or
                </span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>

              <form onSubmit={handleEmailSignIn} className="space-y-5">
                <AuthField
                  label="Email Address"
                  icon={<Mail size={18} />}
                  type="email"
                  value={email}
                  onChange={(value) => {
                    setEmail(value);
                    setPendingVerificationEmail(value);
                  }}
                  placeholder="admin@fintrust.ai"
                />

                <AuthField
                  label="Master Password"
                  icon={<Lock size={18} />}
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••••"
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#2563eb,#2563eb_35%,#3b82f6_100%)] px-5 py-4 text-lg font-black text-white shadow-[0_18px_45px_rgba(37,99,235,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Processing..." : "Secure Login"}
                  <ArrowRight size={18} />
                </button>
              </form>

              <div className="mt-8 flex flex-col gap-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:max-w-[260px]">
                  <p>
                    Need a FinTrust account?
                  </p>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 font-bold text-cyan-200 transition hover:bg-cyan-400/20 hover:text-white"
                  >
                    Sign Up
                    <ArrowRight size={16} />
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending || !pendingVerificationEmail}
                  className="text-left font-bold text-cyan-300 transition hover:text-cyan-200 disabled:cursor-not-allowed disabled:text-slate-600"
                >
                  {resending ? "Sending verification..." : "Resend verification link"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
