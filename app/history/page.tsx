'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTransactionHistory } from '@/lib/stellar';
import type { HorizonOperation } from '@/types';
import TransactionCard from '@/components/TransactionCard';

export default function HistoryPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<HorizonOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const key = localStorage.getItem('stellarpay_pubkey');
    if (!key) {
      router.push('/');
      return;
    }
    setPublicKey(key);

    async function fetchHistory() {
      const txs = await getTransactionHistory(key!);
      setTransactions(txs);
      setLoading(false);
    }
    fetchHistory();
  }, [router]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/dashboard" className="hover:text-gray-300 transition-colors">
          Dashboard
        </Link>
        <span>→</span>
        <span className="text-white">Transaction History</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Transaction History
          </h1>
          <p className="text-gray-500 text-sm">
            All operations from the Stellar network
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 transition-all"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white/[0.03] rounded-xl shimmer" />
          ))}
        </div>
      ) : transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              operation={tx}
              userPublicKey={publicKey!}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center">
          <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg">No transactions found</p>
          <p className="text-gray-600 text-sm mt-1">
            Send or receive funds to see your history here
          </p>
        </div>
      )}
    </div>
  );
}
