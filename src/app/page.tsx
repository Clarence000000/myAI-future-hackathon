"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, EyeOff, Activity } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase/clientApp'; // Adjust path if needed
import { AuthProvider } from '@/components/AuthProvider';

export default function HomePage() {
  const router = useRouter(); 
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  
  const leftPupilRef = useRef<HTMLDivElement>(null);
  const rightPupilRef = useRef<HTMLDivElement>(null);

  // 🖱️ Cursor Tracking Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isPasswordFocused) return;

      const movePupil = (pupil: HTMLDivElement | null) => {
        if (!pupil) return;
        
        const rect = pupil.parentElement?.getBoundingClientRect();
        if (!rect) return;
        
        const eyeCenterX = rect.left + rect.width / 2;
        const eyeCenterY = rect.top + rect.height / 2;

        const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
        const maxRadius = 12; 
        const distance = Math.min(maxRadius, Math.hypot(e.clientX - eyeCenterX, e.clientY - eyeCenterY) / 20);

        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        pupil.style.transform = `translate(${tx}px, ${ty}px)`;
      };

      movePupil(leftPupilRef.current);
      movePupil(rightPupilRef.current);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPasswordFocused]);

  // 🛡️ Privacy Visor Reset
  useEffect(() => {
    if (isPasswordFocused) {
      if (leftPupilRef.current) leftPupilRef.current.style.transform = 'translate(0px, 0px)';
      if (rightPupilRef.current) rightPupilRef.current.style.transform = 'translate(0px, 0px)';
    }
  }, [isPasswordFocused]);

  // 🚀 Standard Email Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault(); 
    // Here is where you would normally call Firebase signInWithEmailAndPassword
    router.push('/dashboard/identity-guard');
  };

  // 🚀 Google Auth Login
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Optional: Force account selection if they have multiple Google accounts
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      
      // If successful, result.user contains their info!
      console.log("Logged in as:", result.user.displayName);
      
      // Route them to the dashboard
      router.push('/dashboard/identity-guard');
      
    } catch (error: any) {
      console.error("Google Sign-In Error:", error.message);
      // You could add a state here to show a red error message on the UI if you want
      alert("Failed to sign in with Google. Please try again.");
    }
  };
  return (
    <div className="flex w-full min-h-screen bg-[#020617] text-slate-200 font-sans overflow-hidden">
      
      {/* ========================================================= */}
      {/* LEFT SIDE: THE FINTECH GUARDIAN */}
      {/* ========================================================= */}
      <div className="hidden lg:flex relative w-1/2 bg-[#0f172a] border-r border-slate-800 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
        <div className={`absolute w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-700 ${isPasswordFocused ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`} />

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-64 h-64 bg-slate-900 border-4 border-slate-700 rounded-t-[100px] rounded-b-3xl shadow-2xl flex flex-col items-center pt-16 overflow-hidden transition-all duration-500">
            
            <div className="flex gap-6 z-10">
              <div className="relative w-16 h-20 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden">
                <div ref={leftPupilRef} className="w-8 h-8 bg-slate-950 rounded-full transition-transform duration-75 ease-out">
                  <div className="w-2 h-2 bg-white rounded-full absolute top-1.5 left-1.5" />
                </div>
              </div>
              <div className="relative w-16 h-20 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden">
                <div ref={rightPupilRef} className="w-8 h-8 bg-slate-950 rounded-full transition-transform duration-75 ease-out">
                  <div className="w-2 h-2 bg-white rounded-full absolute top-1.5 left-1.5" />
                </div>
              </div>
            </div>

            <div className={`absolute top-0 left-0 w-full h-36 bg-slate-950/95 backdrop-blur-md border-b-4 border-emerald-500 flex flex-col items-center justify-center transition-transform duration-500 ease-in-out z-20 ${isPasswordFocused ? 'translate-y-0' : '-translate-y-full'}`}>
              <EyeOff size={32} className="text-emerald-400 mb-2" />
              <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Privacy Mode</span>
            </div>

            <div className={`mt-10 w-24 h-2 rounded-full transition-all duration-500 ${isPasswordFocused ? 'bg-emerald-500/50 scale-x-125' : 'bg-blue-500/50'}`} />
          </div>

          <div className="absolute -bottom-16 w-80 h-48 bg-slate-800/80 backdrop-blur-xl border border-slate-600 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center z-30">
            <Shield size={48} className={`mb-3 transition-colors duration-500 ${isPasswordFocused ? 'text-emerald-400' : 'text-blue-500'}`} />
            <h2 className="text-sm font-black tracking-widest text-white uppercase">FinTrust Secure</h2>
            <p className="text-[10px] text-slate-400 font-mono mt-2 flex items-center gap-2">
              <Activity size={12} className={isPasswordFocused ? 'text-emerald-500 animate-pulse' : 'text-blue-500'} />
              Node: {isPasswordFocused ? 'ENCRYPTED' : 'AWAITING AUTH'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT SIDE: LOGIN FORM */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="mb-10">
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">Welcome Back.</h1>
            <p className="text-slate-500 text-sm">Log in to access your FinTrust AI Dashboard.</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            
            {/* EMAIL INPUT */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={16} className="text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input 
                  type="email" 
                  placeholder="admin@fintrust.ai"
                  className="w-full bg-[#1e293b]/50 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-3 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600"
                  onFocus={() => setIsPasswordFocused(false)}
                />
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Master Password</label>
                <a href="#" className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors">Forgot?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={16} className={`transition-colors ${isPasswordFocused ? 'text-emerald-500' : 'text-slate-500 group-focus-within:text-blue-500'}`} />
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••••••"
                  className={`w-full bg-[#1e293b]/50 border rounded-xl py-3 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-600 ${
                    isPasswordFocused ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                />
              </div>
            </div>

            {/* SECURE LOGIN BUTTON */}
            <button 
              type="submit" 
              className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                isPasswordFocused 
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
              }`}
            >
              Secure Login <ArrowRight size={16} />
            </button>

            {/* 🪄 NEW: GOOGLE LOGIN SECTION */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink-0 mx-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Or</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button 
              type="button" 
              onClick={handleGoogleLogin}
              className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-3 bg-[#1e293b]/30 hover:bg-[#1e293b]/80 border border-slate-700 hover:border-slate-500 text-slate-200 transition-all active:scale-[0.98]"
            >
              {/* Official Google 'G' Logo SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}