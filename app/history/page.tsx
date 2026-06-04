'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink, FileText, RefreshCw, X } from 'lucide-react';
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

  const downloadCSV = () => {
    if (!transactions.length) return;

    const headers = ['Date', 'Type', 'Asset', 'Amount', 'Counterparty', 'Transaction Hash'];

    const rows = transactions.map((tx) => {
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
    <div className="page-shell">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Dashboard
      </Link>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="section-label">Ledger Archive</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 font-display">
            Transaction history
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Review recent Horizon operations and export records for reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold"
            title="Refresh History"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </button>
          <button
            onClick={downloadCSV}
            disabled={loading || transactions.length === 0}
            className="btn-primary inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-slate-200 shimmer" />
          ))}
        </div>
      ) : transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <button
              key={tx.id}
              onClick={() => setSelectedTx(tx)}
              className="block w-full text-left"
            >
              <TransactionCard operation={tx} userPublicKey={publicKey} />
            </button>
          ))}
        </div>
      ) : (
        <div className="structured-card p-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-slate-400" aria-hidden="true" />
          <p className="text-lg font-semibold text-slate-950">No history found</p>
          <p className="mt-2 text-sm text-slate-500">
            Transactions will appear here once you send or receive on the network.
          </p>
        </div>
      )}

      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setSelectedTx(null)}
          />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="section-label">Operation Detail</p>
                <h3 className="mt-1 text-lg font-bold text-slate-950">Transaction details</h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950"
                aria-label="Close transaction details"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <p className="text-sm font-semibold text-slate-500">Transaction hash</p>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${selectedTx.transaction_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all font-mono text-sm font-semibold text-accent hover:text-accent-dark"
                >
                  {selectedTx.transaction_hash}
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Date</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {new Date(selectedTx.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Type</p>
                  <p className="mt-2 text-sm font-semibold capitalize text-slate-950">
                    {selectedTx.type.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {selectedTx.type === 'payment' && (
                <div className="space-y-4 border-t border-slate-200 pt-5">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Amount</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {selectedTx.amount} {selectedTx.asset_type === 'native' ? 'XLM' : selectedTx.asset_code}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">From</p>
                    <p className="mt-1 break-all rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700">
                      {selectedTx.from}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">To</p>
                    <p className="mt-1 break-all rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700">
                      {selectedTx.to}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-5">
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${selectedTx.transaction_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold"
              >
                View on Stellar Expert
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
