'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBalances, getTransactionHistory } from '@/lib/stellar';
import type { Balance, HorizonOperation } from '@/types';
import TransactionCard from '@/components/TransactionCard';

export default function DashboardPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [recentTxs, setRecentTxs] = useState<HorizonOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const key = localStorage.getItem('stellarpay_pubkey');
    if (!key) {
      router.push('/');
      return;
    }
    setPublicKey(key);

    async function fetchData() {
      const [bal, txs] = await Promise.all([
        getBalances(key!),
        getTransactionHistory(key!),
      ]);
      setBalances(bal);
      setRecentTxs(txs.slice(0, 3));
      setLoading(false);
    }
    fetchData();
  }, [router]);

  const xlmBalance = balances.find((b) => b.asset === 'XLM')?.balance || '0';
  const usdcBalance =
    balances.find((b) => b.asset === 'USDC')?.balance || '0';

  const quickActions = [
    {
      href: '/send',
      label: 'Send',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      color: 'bg-blue-600 hover:bg-blue-500',
    },
    {
      href: '/receive',
      label: 'Receive',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
      color: 'bg-zinc-800 hover:bg-zinc-700',
    },
    {
      href: '/vault',
      label: 'Vault',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      color: 'bg-zinc-800 hover:bg-zinc-700',
    },
    {
      href: '/approvals',
      label: 'Approvals',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-zinc-800 hover:bg-zinc-700',
    },
    {
      href: '/history',
      label: 'History',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-zinc-800 hover:bg-zinc-700',
    },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-zinc-800 rounded-lg w-48" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-40 bg-zinc-800 rounded-xl" />
            <div className="h-40 bg-zinc-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-50 mb-1">
          Dashboard
        </h1>
        <p className="text-zinc-500 text-sm font-mono">
          {publicKey?.slice(0, 8)}...{publicKey?.slice(-6)}
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {/* XLM Balance */}
        <div className="structured-card rounded-xl p-6 relative overflow-hidden">
          <p className="text-sm text-zinc-400 font-medium mb-2">XLM Balance</p>
          <p className="text-3xl font-bold text-zinc-50">
            {parseFloat(xlmBalance).toFixed(2)}
          </p>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">Stellar Lumens</p>
        </div>

        {/* USDC Balance */}
        <div className="structured-card rounded-xl p-6 relative overflow-hidden border-blue-500/20">
          <p className="text-sm text-zinc-400 font-medium mb-2">USDC Balance</p>
          <p className="text-3xl font-bold text-zinc-50">
            ${parseFloat(usdcBalance).toFixed(2)}
          </p>
          <p className="text-xs text-blue-500 mt-1 uppercase tracking-wider">USD Coin</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-zinc-50 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl ${action.color} transition-colors border border-zinc-700/50 hover:border-zinc-600`}
          >
            <div className="text-zinc-100">
              {action.icon}
            </div>
            <span className="text-sm font-medium text-zinc-100">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-50">
          Recent Transactions
        </h2>
        <Link
          href="/history"
          className="text-sm text-blue-500 hover:text-blue-400 font-medium transition-colors"
        >
          View All →
        </Link>
      </div>

      {recentTxs.length > 0 ? (
        <div className="space-y-3">
          {recentTxs.map((tx) => (
            <TransactionCard
              key={tx.id}
              operation={tx}
              userPublicKey={publicKey!}
            />
          ))}
        </div>
      ) : (
        <div className="structured-card rounded-xl p-8 text-center">
          <p className="text-zinc-500">No transactions yet</p>
          <Link
            href="/send"
            className="inline-block mt-4 px-6 py-2 bg-blue-600/10 text-blue-500 rounded-lg text-sm font-medium hover:bg-blue-600/20 transition-colors"
          >
            Send Your First Payment →
          </Link>
        </div>
      )}
    </div>
  );
}
