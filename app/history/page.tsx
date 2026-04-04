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
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTx, setSelectedTx] = useState<HorizonOperation | null>(null);
  const router = useRouter();

  useEffect(() => {
    const key = localStorage.getItem('stellarpay_pubkey');
    if (!key) {
      router.push('/');
      return;
    }
    setPublicKey(key);
    fetchHistory(key);
  }, [router]);

  async function fetchHistory(key: string) {
    const txs = await getTransactionHistory(key);
    setTransactions(txs);
    setLoading(false);
  }

  async function handleRefresh() {
    if (!publicKey) return;
    setRefreshing(true);
    await fetchHistory(publicKey);
    setRefreshing(false);
  }

  function exportToCSV() {
    if (transactions.length === 0) return;

    // CSV headers
    const headers = ['Date', 'Type', 'Amount', 'Asset', 'From', 'To', 'Transaction Hash'];
    
    // CSV rows
    const rows = transactions.map(tx => [
      new Date(tx.created_at).toISOString(),
      tx.type,
      tx.amount || '',
      tx.asset_code || 'XLM',
      tx.from || '',
      tx.to || '',
      tx.transaction_hash
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `stellarpay-transactions-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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
        <div className="flex gap-2">
          {transactions.length > 0 && (
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-sm text-emerald-400 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <svg 
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
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
            <div key={tx.id} onClick={() => setSelectedTx(tx)} className="cursor-pointer">
              <TransactionCard
                operation={tx}
                userPublicKey={publicKey!}
              />
            </div>
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

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTx(null)}
        >
          <div 
            className="glass-card rounded-2xl p-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Transaction Details</h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Type</p>
                <p className="text-white font-medium capitalize">{selectedTx.type}</p>
              </div>

              {selectedTx.amount && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Amount</p>
                  <p className="text-white font-medium">
                    {selectedTx.amount} {selectedTx.asset_code || 'XLM'}
                  </p>
                </div>
              )}

              {selectedTx.from && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">From</p>
                  <p className="text-white font-mono text-xs break-all">{selectedTx.from}</p>
                </div>
              )}

              {selectedTx.to && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">To</p>
                  <p className="text-white font-mono text-xs break-all">{selectedTx.to}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                <p className="text-white font-mono text-xs break-all">{selectedTx.transaction_hash}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Date</p>
                <p className="text-white text-sm">
                  {new Date(selectedTx.created_at).toLocaleString()}
                </p>
              </div>

              <a
                href={`https://stellar.expert/explorer/testnet/tx/${selectedTx.transaction_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-center transition-all"
              >
                View on Stellar Expert →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
