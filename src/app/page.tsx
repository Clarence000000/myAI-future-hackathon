"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowRight,
  EyeOff,
  Lock,
  Mail,
  Shield,
  User2,
} from "lucide-react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/clientApp";

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");

  const leftPupilRef = useRef<HTMLDivElement>(null);
  const rightPupilRef = useRef<HTMLDivElement>(null);
  const isSignup = mode === "signup";

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isPasswordFocused) return;

      const movePupil = (pupil: HTMLDivElement | null) => {
        if (!pupil) return;

        const rect = pupil.parentElement?.getBoundingClientRect();
        if (!rect) return;

        const eyeCenterX = rect.left + rect.width / 2;
        const eyeCenterY = rect.top + rect.height / 2;
        const angle = Math.atan2(event.clientY - eyeCenterY, event.clientX - eyeCenterX);
        const maxRadius = 12;
        const distance = Math.min(
          maxRadius,
          Math.hypot(event.clientX - eyeCenterX, event.clientY - eyeCenterY) / 20
        );

        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        pupil.style.transform = `translate(${tx}px, ${ty}px)`;
      };

      movePupil(leftPupilRef.current);
      movePupil(rightPupilRef.current);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isPasswordFocused]);

  useEffect(() => {
    if (isPasswordFocused) {
      if (leftPupilRef.current) leftPupilRef.current.style.transform = "translate(0px, 0px)";
      if (rightPupilRef.current) rightPupilRef.current.style.transform = "translate(0px, 0px)";
    }
  }, [isPasswordFocused]);

  const resetMessages = () => {
    setError("");
    setNotice("");
  };

  const switchMode = (nextMode: "login" | "signup") => {
    setMode(nextMode);
    setIsPasswordFocused(false);
    resetMessages();
  };

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      resetMessages();

      if (mode === "signup") {
        if (!username.trim()) {
          setError("Please enter a user name to create your account.");
          return;
        }

        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: username.trim() });
        await sendEmailVerification(credential.user, {
          url: `${window.location.origin}/`,
          handleCodeInApp: false,
        });
        await signOut(auth);

        setPendingVerificationEmail(email);
        setNotice(
          "Your account has been created. We sent a verification link to your email before your first login."
        );
        setPassword("");
        setMode("login");
        return;
      }

      const credential = await signInWithEmailAndPassword(auth, email, password);

      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user, {
          url: `${window.location.origin}/`,
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setSubmitting(true);
      resetMessages();

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      router.push("/dashboard/identity-guard");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : mode === "signup"
            ? "Failed to sign up with Google."
            : "Failed to sign in with Google.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail || !password) {
      setError("Enter your email and password first so we can resend the verification link.");
      return;
    }

    try {
      setSubmitting(true);
      resetMessages();
      const credential = await signInWithEmailAndPassword(
        auth,
        pendingVerificationEmail,
        password
      );
      await sendEmailVerification(credential.user, {
        url: `${window.location.origin}/`,
        handleCodeInApp: false,
      });
      await signOut(auth);
      setNotice("A new verification link has been sent. Please check your inbox.");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not resend the verification email.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#020617] font-sans text-slate-200">
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden border-r border-slate-800 bg-[#0f172a] lg:flex">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
        <div
          className={`absolute h-[500px] w-[500px] rounded-full blur-[120px] transition-colors duration-700 ${
            isPasswordFocused ? "bg-emerald-500/10" : "bg-blue-500/10"
          }`}
        />

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative flex h-64 w-64 flex-col items-center overflow-hidden rounded-t-[100px] rounded-b-3xl border-4 border-slate-700 bg-slate-900 pt-16 shadow-2xl transition-all duration-500">
            <div className="z-10 flex gap-6">
              <div className="relative flex h-20 w-16 items-center justify-center overflow-hidden rounded-full bg-white shadow-inner">
                <div
                  ref={leftPupilRef}
                  className="h-8 w-8 rounded-full bg-slate-950 transition-transform duration-75 ease-out"
                >
                  <div className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full bg-white" />
                </div>
              </div>
              <div className="relative flex h-20 w-16 items-center justify-center overflow-hidden rounded-full bg-white shadow-inner">
                <div
                  ref={rightPupilRef}
                  className="h-8 w-8 rounded-full bg-slate-950 transition-transform duration-75 ease-out"
                >
                  <div className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full bg-white" />
                </div>
              </div>
            </div>

            <div
              className={`absolute left-0 top-0 z-20 flex h-36 w-full flex-col items-center justify-center border-b-4 border-emerald-500 bg-slate-950/95 backdrop-blur-md transition-transform duration-500 ease-in-out ${
                isPasswordFocused ? "translate-y-0" : "-translate-y-full"
              }`}
            >
              <EyeOff size={32} className="mb-2 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                Privacy Mode
              </span>
            </div>

            <div
              className={`mt-10 h-2 w-24 rounded-full transition-all duration-500 ${
                isPasswordFocused ? "scale-x-125 bg-emerald-500/50" : "bg-blue-500/50"
              }`}
            />
          </div>

          <div className="absolute -bottom-16 z-30 flex h-48 w-80 flex-col items-center justify-center rounded-3xl border border-slate-600 bg-slate-800/80 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <Shield
              size={48}
              className={`mb-3 transition-colors duration-500 ${
                isPasswordFocused ? "text-emerald-400" : "text-blue-500"
              }`}
            />
            <h2 className="text-sm font-black uppercase tracking-widest text-white">
              FinTrust Secure
            </h2>
            <p className="mt-2 flex items-center gap-2 font-mono text-[10px] text-slate-400">
              <Activity
                size={12}
                className={isPasswordFocused ? "animate-pulse text-emerald-500" : "text-blue-500"}
              />
              Node: {isPasswordFocused ? "ENCRYPTED" : "AWAITING AUTH"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex h-screen w-full items-center justify-center overflow-hidden px-8 py-6 sm:px-10 sm:py-8 lg:w-1/2">
        <div className="w-full max-w-md animate-in slide-in-from-bottom-8 fade-in duration-700">
          <div className={`${isSignup ? "mb-6" : "mb-10"}`}>
            <h1 className="mb-2 text-3xl font-black tracking-tight text-white">
              {isSignup ? "Create Account." : "Welcome Back."}
            </h1>
            <p className={`${isSignup ? "text-xs leading-5" : "text-sm"} text-slate-500`}>
              {isSignup
                ? "Create your account with Google or manual sign up."
                : "Log in to access your FinTrust AI Dashboard."}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          {notice && (
            <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {notice}
            </div>
          )}

          <form className={isSignup ? "space-y-4" : "space-y-6"} onSubmit={handleEmailAuth}>
            {isSignup && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  User Name
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <User2
                      size={16}
                      className="text-slate-500 transition-colors group-focus-within:text-blue-500"
                    />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Your display name"
                    className={`w-full rounded-xl border border-slate-700 bg-[#1e293b]/50 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                      isSignup ? "py-2.5" : "py-3"
                    }`}
                    onFocus={() => setIsPasswordFocused(false)}
                  />
                </div>
              </div>
            )}

            <div className={isSignup ? "space-y-1.5" : "space-y-2"}>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Email Address
              </label>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Mail size={16} className="text-slate-500 transition-colors group-focus-within:text-blue-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setPendingVerificationEmail(event.target.value);
                  }}
                  placeholder={isSignup ? "you@example.com" : "admin@fintrust.ai"}
                  className={`w-full rounded-xl border border-slate-700 bg-[#1e293b]/50 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                    isSignup ? "py-2.5" : "py-3"
                  }`}
                  onFocus={() => setIsPasswordFocused(false)}
                />
              </div>
            </div>

            <div className={isSignup ? "space-y-1.5" : "space-y-2"}>
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Master Password
                </label>
                {!isSignup && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="text-[10px] font-bold text-blue-500 transition-colors hover:text-blue-400"
                  >
                    Verify Link
                  </button>
                )}
              </div>
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock
                    size={16}
                    className={`transition-colors ${
                      isPasswordFocused
                        ? "text-emerald-500"
                        : "text-slate-500 group-focus-within:text-blue-500"
                    }`}
                  />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full rounded-xl border bg-[#1e293b]/50 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 ${
                    isPasswordFocused
                      ? "border-emerald-500 ring-1 ring-emerald-500"
                      : "border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  } ${
                    isSignup ? "py-2.5" : "py-3"
                  }`}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`flex w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
                isPasswordFocused
                  ? "bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400"
                  : "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500"
              } ${isSignup ? "py-3" : "py-3.5"} ${submitting ? "cursor-not-allowed opacity-60" : ""}`}
            >
              {submitting
                ? !isSignup
                  ? "Logging In..."
                  : "Creating Account..."
                : !isSignup
                  ? "Secure Login"
                  : "Create Account"}
              <ArrowRight size={16} />
            </button>

            <div className={`relative flex items-center ${isSignup ? "py-1" : "py-2"}`}>
              <div className="flex-grow border-t border-slate-800" />
              <span className="mx-4 flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Or
              </span>
              <div className="flex-grow border-t border-slate-800" />
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={submitting}
              className={`flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-[#1e293b]/30 text-sm font-bold text-slate-200 transition-all hover:border-slate-500 hover:bg-[#1e293b]/80 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                isSignup ? "py-3" : "py-3.5"
              }`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {isSignup ? "Sign up with Google" : "Sign in with Google"}
            </button>

            <div className={isSignup ? "pt-1" : "pt-3"}>
              <p className={`text-center text-xs text-slate-500 ${isSignup ? "mb-2" : "mb-3"}`}>
                {!isSignup
                  ? "New user? Create an account first."
                  : "Already have an account?"}
              </p>
              <button
                type="button"
                onClick={() => switchMode(!isSignup ? "signup" : "login")}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-bold text-cyan-200 transition-all hover:border-cyan-300/40 hover:bg-cyan-400/20 active:scale-[0.98] ${
                  isSignup ? "py-3" : "py-3.5"
                }`}
              >
                {!isSignup ? "Sign Up" : "Back to Login"}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
