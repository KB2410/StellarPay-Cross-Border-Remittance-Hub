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
  const [error, setError] = useState('');
  const [selectedTx, setSelectedTx] = useState<HorizonOperation | null>(null);
  const router = useRouter();

  useEffect(() => {
    const key = localStorage.getItem('stellarpay_pubkey');
    if (!key) {
      router.push('/');
      return;
    }
    setPublicKey(key);

    async function fetchHistory() {
      try {
        const txs = await getTransactionHistory(key!);
        setTransactions(txs);
      } catch {
        setError('Failed to load transaction history.');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [router]);

  // Handle CSV Export
  const downloadCSV = () => {
    if (!transactions.length) return;

    const headers = ['Date', 'Type', 'Asset', 'Amount', 'Counterparty', 'Transaction Hash'];
    
    const rows = transactions.map(tx => {
      const date = new Date(tx.created_at).toISOString();
      const type = tx.type;
      
      let asset = 'XLM';
      let amount = '0';
      let counterparty = '';

      if (tx.type === 'payment') {
        asset = tx.asset_type === 'native' ? 'XLM' : tx.asset_code || 'Token';
        amount = tx.amount || '0';
        counterparty = tx.from === publicKey ? (tx.to || '') : (tx.from || '');
      } else if (tx.type === 'create_account') {
        amount = tx.starting_balance || '0';
        counterparty = tx.account || '';
      }

      return [date, type, asset, amount, counterparty, tx.transaction_hash].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stellarpay_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!publicKey) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-8 font-medium">
        <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
          Dashboard
        </Link>
        <span>→</span>
        <span className="text-zinc-50">Transaction History</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-50 mb-1">
            Transaction History
          </h1>
          <p className="text-zinc-500 text-sm">
            Complete record of your network activity
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 transition-colors"
            title="Refresh History"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={downloadCSV}
            disabled={loading || transactions.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors disabled:opacity-50 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6 font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-800 rounded-xl shimmer" />
          ))}
        </div>
      ) : transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} onClick={() => setSelectedTx(tx)} className="cursor-pointer">
               <TransactionCard operation={tx} userPublicKey={publicKey} />
            </div>
          ))}
        </div>
      ) : (
        <div className="structured-card rounded-xl p-12 text-center">
          <svg className="w-12 h-12 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-zinc-400 font-medium text-lg">No history found</p>
          <p className="text-zinc-500 text-sm mt-1">
            Your transactions will appear here once you start sending or receiving on the network.
          </p>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedTx(null)}
          />
          <div className="structured-card rounded-2xl w-full max-w-lg relative z-10 shadow-2xl modal-content transform transition-all">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-zinc-50">Transaction Details</h3>
              <button 
                onClick={() => setSelectedTx(null)}
                className="text-zinc-400 hover:text-zinc-50 transition-colors p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-zinc-500 font-medium mb-1">Transaction ID</p>
                <a 
                  href={`https://stellar.expert/explorer/testnet/tx/${selectedTx.transaction_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-400 font-mono text-sm break-all transition-colors"
                >
                  {selectedTx.transaction_hash}
                </a>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-500 font-medium mb-1">Date</p>
                  <p className="text-zinc-50 text-sm font-medium">
                    {new Date(selectedTx.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 font-medium mb-1">Type</p>
                  <p className="text-zinc-50 text-sm font-medium capitalize">
                    {selectedTx.type.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {selectedTx.type === 'payment' && (
                <>
                  <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
                     <div>
                      <p className="text-sm text-zinc-500 font-medium mb-1">Amount</p>
                      <p className="text-zinc-50 font-bold">
                        {selectedTx.amount} {selectedTx.asset_type === 'native' ? 'XLM' : selectedTx.asset_code}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-zinc-800 pt-4">
                    <p className="text-sm text-zinc-500 font-medium mb-1">From</p>
                    <p className="text-zinc-400 font-mono text-xs break-all bg-zinc-900/50 p-2 rounded-lg border border-zinc-800 mb-3">
                      {selectedTx.from}
                    </p>
                    <p className="text-sm text-zinc-500 font-medium mb-1">To</p>
                    <p className="text-zinc-400 font-mono text-xs break-all bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
                      {selectedTx.to}
                    </p>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-6 border-t border-zinc-800 bg-zinc-900/30 rounded-b-2xl">
              <a 
                href={`https://stellar.expert/explorer/testnet/tx/${selectedTx.transaction_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-50 rounded-lg text-sm font-medium transition-colors"
              >
                View on Stellar Expert
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
