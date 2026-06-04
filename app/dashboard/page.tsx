'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  History,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
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
      setRecentTxs(txs.slice(0, 4));
      setLoading(false);
    }
    fetchData();
  }, [router]);

  const xlmBalance = balances.find((b) => b.asset === 'XLM')?.balance || '0';
  const usdcBalance =
    balances.find((b) => b.asset === 'USDC')?.balance || '0';

  const quickActions = [
    { href: '/send', label: 'Send funds', icon: CreditCard },
    { href: '/receive', label: 'Receive', icon: QrCode },
    { href: '/vault', label: 'Vault setup', icon: ShieldCheck },
    { href: '/approvals', label: 'Approvals', icon: CheckCircle2 },
    { href: '/history', label: 'History', icon: History },
  ];

  if (loading) {
    return (
      <div className="page-shell">
        <div className="animate-pulse space-y-6">
          <div className="h-9 w-56 rounded-lg bg-slate-200" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-40 rounded-lg bg-slate-200" />
            <div className="h-40 rounded-lg bg-slate-200" />
            <div className="h-40 rounded-lg bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="section-label">Wallet Overview</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 font-display">
            Remittance dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Monitor balances, start payments, and manage co-signer workflows from a single operating view.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Connected wallet
          </p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-950">
            {publicKey?.slice(0, 10)}...{publicKey?.slice(-8)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr]">
        <div className="metric-card">
          <p className="section-label">XLM Balance</p>
          <p className="mt-4 text-4xl font-bold text-slate-950 font-display">
            {parseFloat(xlmBalance).toFixed(2)}
          </p>
          <p className="mt-2 text-sm text-slate-500">Native Stellar Lumens available for transfers and fees.</p>
        </div>
        <div className="metric-card">
          <p className="section-label">USDC Balance</p>
          <p className="mt-4 text-4xl font-bold text-slate-950 font-display">
            ${parseFloat(usdcBalance).toFixed(2)}
          </p>
          <p className="mt-2 text-sm text-slate-500">Issued USD Coin balance with trustline support.</p>
        </div>
        <div className="metric-card bg-slate-950 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">Vault posture</p>
          <p className="mt-4 text-3xl font-bold font-display">2-of-2 ready</p>
          <p className="mt-2 text-sm text-slate-300">Use approvals to execute shared-custody payments.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="structured-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="section-label">Actions</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">Payment workflow</h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                    {action.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="section-label">Ledger Activity</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">Recent transactions</h2>
            </div>
            <Link
              href="/history"
              className="text-sm font-semibold text-accent hover:text-accent-dark"
            >
              View all
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
            <div className="structured-card p-10 text-center">
              <CreditCard className="mx-auto mb-4 h-10 w-10 text-slate-400" aria-hidden="true" />
              <p className="font-semibold text-slate-950">No transactions yet</p>
              <p className="mt-2 text-sm text-slate-500">Your Stellar operations will appear here after the first transfer.</p>
              <Link
                href="/send"
                className="btn-primary mt-5 inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm"
              >
                Send first payment
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
