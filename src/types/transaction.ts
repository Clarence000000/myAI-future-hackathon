import type { Timestamp } from 'firebase/firestore';

export type TransactionStatus = 'analyzing' | 'pending' | 'verified' | 'flagged' | 'blocked';
export type TransactionType = 'trusted' | 'suspicious' | 'unknown';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  merchant: string;
  date: Timestamp;
  status: TransactionStatus;
  type: TransactionType;
  trustScore?: number;
  aiAnalysis?: string;
}
