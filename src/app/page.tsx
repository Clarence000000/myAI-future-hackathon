import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 justify-center items-center p-8">
      <div className="flex flex-col items-center max-w-2xl text-center space-y-8">
        <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl text-white transform hover:scale-105 transition-transform cursor-pointer">
          🛡️
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Securing the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Digital Future.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-xl">
          FinTrust ScamShield AI is your personal bodyguard against phishing, mule requests, and financial fraud. Powered by Gemini 2.0.
        </p>
        
        <div className="flex gap-4 pt-8">
          <Link href="/login" className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-xl shadow-blue-500/20 transform hover:-translate-y-1 transition-all">
            Access Dashboard
          </Link>
          <a href="#" className="px-8 py-4 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all border border-slate-200 dark:border-slate-700">
            Install Extension
          </a>
        </div>
      </div>
    </div>
  );
}
