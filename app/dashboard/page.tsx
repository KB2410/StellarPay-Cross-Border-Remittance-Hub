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
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      color: 'bg-accent/20 border-accent/30 text-accent-cyan hover:bg-accent/30 hover:border-accent/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]',
    },
    {
      href: '/receive',
      label: 'Receive',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
      color: 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20',
    },
    {
      href: '/vault',
      label: 'Vault',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      color: 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20',
    },
    {
      href: '/approvals',
      label: 'Approvals',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20',
    },
    {
      href: '/history',
      label: 'History',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20',
    },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-800 rounded-lg w-48" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-40 bg-gray-800 rounded-2xl" />
            <div className="h-40 bg-gray-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-display">
          Dashboard
        </h1>
        <p className="text-accent-cyan text-sm font-mono bg-accent-cyan/10 inline-block px-3 py-1 rounded-md border border-accent-cyan/20">
          {publicKey?.slice(0, 8)}...{publicKey?.slice(-6)}
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {/* XLM Balance */}
        <div className="structured-card rounded-2xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-accent/20 transition-colors duration-500" />
          <p className="text-sm text-gray-400 font-medium mb-3 relative z-10">Total XLM Balance</p>
          <p className="text-4xl font-bold text-white font-display relative z-10">
            {parseFloat(xlmBalance).toFixed(2)}
          </p>
          <div className="flex items-center gap-2 mt-2 relative z-10">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Stellar Lumens</p>
          </div>
        </div>

        {/* USDC Balance */}
        <div className="structured-card rounded-2xl p-8 relative overflow-hidden group border-accent-cyan/20">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent-cyan/10 rounded-full blur-2xl -mr-10 -mb-10 group-hover:bg-accent-cyan/20 transition-colors duration-500" />
          <p className="text-sm text-gray-400 font-medium mb-3 relative z-10">USDC Balance</p>
          <p className="text-4xl font-bold text-white font-display relative z-10">
            ${parseFloat(usdcBalance).toFixed(2)}
          </p>
          <div className="flex items-center gap-2 mt-2 relative z-10">
            <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            <p className="text-xs text-accent-cyan uppercase tracking-widest font-semibold">USD Coin</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-bold text-white mb-6 font-display">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-12">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all duration-300 ${action.color}`}
          >
            <div>
              {action.icon}
            </div>
            <span className="text-sm font-semibold">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white font-display">
          Recent Transactions
        </h2>
        <Link
          href="/history"
          className="text-sm text-accent-cyan hover:text-white font-medium transition-colors flex items-center gap-1"
        >
          View All <span>&rarr;</span>
        </Link>
      </div>

      {recentTxs.length > 0 ? (
        <div className="space-y-4">
          {recentTxs.map((tx) => (
            <TransactionCard
              key={tx.id}
              operation={tx}
              userPublicKey={publicKey!}
            />
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center border-dashed border-2 border-white/10">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-400 mb-6">No transactions yet</p>
          <Link
            href="/send"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-accent-cyan text-white rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all transform hover:scale-105"
          >
            Send Your First Payment
          </Link>
        </div>
      )}
    </div>
  );
}
