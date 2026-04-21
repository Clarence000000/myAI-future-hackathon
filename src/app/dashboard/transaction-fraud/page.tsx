"use client";
import { useState, useEffect } from 'react';
import { ShieldAlert, Activity, RefreshCcw, CreditCard, Plus, CheckCircle2, AlertCircle, AlertTriangle, BrainCircuit } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase/clientApp';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { Transaction } from '@/types/transaction';
import { faker } from '@faker-js/faker';

const SUBSCRIPTIONS = [
  'Netflix', 'Spotify Premium', 'Hulu', 'Disney+', 
  'Adobe Creative Cloud', 'Gym Membership', 'Amazon Prime'
];

const FRAUD_MERCHANTS = [
  'Offshore Crypto Exchange', 'Unknown ATM (Overseas)', 'Wire Transfer', 
  'Untraceable P2P', 'Luxury Goods Online', 'Foreign Shell Corp'
];

export default function TransactionFraudPage() {
  const { user } = useAuth();
  const userId = user?.uid || "mock-user-id";
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users', userId, 'transactions'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTransactions: Transaction[] = [];
      snapshot.forEach((doc) => {
        fetchedTransactions.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(fetchedTransactions);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const generateTransaction = async (simulationType: 'legitimate' | 'fraudulent') => {
    setIsGenerating(true);
    
    try {
      const isFraud = simulationType === 'fraudulent';
      let amount = 0;
      let merchant = '';

      if (isFraud) {
        amount = parseFloat(faker.finance.amount({ min: 1500, max: 9500, dec: 2 }));
        merchant = faker.helpers.arrayElement(FRAUD_MERCHANTS);
      } else {
        const recentMerchants = transactions.slice(0, 15).map(t => t.merchant);
        
        // 20% chance for subscription, 80% for general realistic store
        const isSubscription = Math.random() < 0.2;
        
        let attempts = 0;
        do {
          if (isSubscription) {
            merchant = faker.helpers.arrayElement(SUBSCRIPTIONS);
            amount = parseFloat(faker.finance.amount({ min: 9.99, max: 49.99, dec: 2 }));
          } else {
            // Realistic store names using Faker
            merchant = `${faker.company.name()} ${faker.helpers.arrayElement(['Store', 'Market', 'Cafe', 'Boutique', 'Online', ''])}`.trim();
            amount = parseFloat(faker.finance.amount({ min: 5, max: 350, dec: 2 }));
          }
          attempts++;
        } while (recentMerchants.includes(merchant) && attempts < 10);
      }
      
      const docRef = await addDoc(collection(db, 'users', userId, 'transactions'), {
        userId: userId,
        amount,
        merchant,
        date: serverTimestamp(),
        status: 'analyzing', // Start in analyzing state
        type: isFraud ? 'suspicious' : 'trusted'
      });

      // Simulate AI processing delay
      setTimeout(async () => {
        const trustScore = isFraud 
          ? Math.floor(Math.random() * 30) + 5 // 5% - 34%
          : Math.floor(Math.random() * 15) + 85; // 85% - 99%
        
        const status = isFraud ? 'flagged' : 'verified';
        
        const aiAnalysis = isFraud 
          ? `High risk anomaly detected. Unusual merchant (${merchant}) combined with high velocity.`
          : `Transaction matches established user behavior profile and typical spending patterns.`;

        await updateDoc(doc(db, 'users', userId, 'transactions', docRef.id), {
          status,
          trustScore,
          aiAnalysis
        });
      }, 2500);

    } catch (error) {
      console.error("Error generating transaction:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'Just now';
    return timestamp.toDate().toLocaleString();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-8 custom-scrollbar">
      {/* Header Banner */}
      <div className="bg-[#1e293b]/30 border border-slate-800 rounded-3xl p-8 mb-8 flex justify-between items-center backdrop-blur-md relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[100px] opacity-10 bg-blue-500 transition-colors duration-1000" />
        
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Transaction Fraud Prevention</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            System Status: <span className="text-blue-400">ACTIVE MONITORING</span>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2 italic">
              <CreditCard size={18} className="text-blue-500" /> Transaction Ledger
            </h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => generateTransaction('fraudulent')}
                disabled={isGenerating}
                className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? <RefreshCcw size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                Simulate Fraud
              </button>
              <button 
                onClick={() => generateTransaction('legitimate')}
                disabled={isGenerating}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              >
                {isGenerating ? <RefreshCcw size={14} className="animate-spin" /> : <Plus size={14} />}
                Generate Transaction
              </button>
            </div>
          </div>
          
          <div className="bg-[#1e293b]/30 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
            {isLoading ? (
              <div className="p-20 flex flex-col items-center justify-center text-center">
                <Activity size={48} className="text-blue-500 mb-4 opacity-50 animate-spin" />
                <h3 className="text-xl font-black text-blue-400 uppercase tracking-tighter animate-pulse">
                  Loading Ledger...
                </h3>
                <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto italic leading-relaxed">
                  Fetching recent transactions from the secure vault.
                </p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center text-center">
                <ShieldAlert size={48} className="text-slate-600 mb-4 opacity-50" />
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">
                  No Transactions Found
                </h3>
                <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto italic leading-relaxed">
                  Generate a verified transaction to start monitoring the ledger.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0f172a]/50 text-slate-400 border-b border-slate-800 text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4 font-bold">Transaction ID</th>
                      <th className="px-6 py-4 font-bold">Date & Time</th>
                      <th className="px-6 py-4 font-bold">Merchant</th>
                      <th className="px-6 py-4 font-bold text-right">Amount</th>
                      <th className="px-6 py-4 font-bold w-1/4">Trust Score & Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {transactions.map((tx) => {
                      const isAnalyzing = tx.status === 'analyzing';
                      const isVerified = tx.status === 'verified';
                      const isFlagged = tx.status === 'flagged';
                      
                      return (
                        <tr key={tx.id} className="hover:bg-slate-800/20 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="font-mono text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors block truncate w-32">{tx.id}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            {formatDate(tx.date)}
                          </td>
                          <td className="px-6 py-4 font-medium text-white flex flex-col justify-center">
                            <span>{tx.merchant}</span>
                            <span className="text-[9px] text-slate-500 font-mono capitalize">{tx.type}</span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-medium text-slate-200">
                            ${tx.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            {isAnalyzing ? (
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-400 animate-pulse">
                                  <BrainCircuit size={12} className="animate-spin" />
                                  AI Analyzing...
                                </span>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 w-1/2 animate-[bounce_1s_infinite]" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">Trust Score</span>
                                      <span className={`text-xs font-black ${isVerified ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {tx.trustScore}%
                                      </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${isVerified ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                                        style={{ width: `${tx.trustScore || 0}%` }} 
                                      />
                                    </div>
                                  </div>
                                  <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${isVerified ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                    {isVerified ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                                    {tx.status}
                                  </span>
                                </div>
                                {tx.aiAnalysis && (
                                  <p className="text-[10px] text-slate-500 italic leading-snug mt-1">
                                    "{tx.aiAnalysis}"
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
