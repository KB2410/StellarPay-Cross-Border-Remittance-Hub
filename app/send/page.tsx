'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ShieldCheck, Wallet } from 'lucide-react';
import SendForm from '@/components/SendForm';

export default function SendPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const key = localStorage.getItem('stellarpay_pubkey');
    if (!key) {
      router.push('/');
      return;
    }
    setPublicKey(key);
  }, [router]);

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

      <div className="grid gap-6 lg:grid-cols-[0.68fr_0.32fr]">
        <section className="structured-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="section-label">Transfer Desk</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 font-display">
              Send payment
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Build a Stellar payment, sign with Freighter, and route vault transactions through co-signer approval.
            </p>
          </div>
          <div className="p-6">
            <SendForm publicKey={publicKey} />
          </div>
        </section>

        <aside className="space-y-4">
          <div className="structured-card p-5">
            <p className="section-label">Wallet</p>
            <div className="mt-4 flex items-start gap-3">
              <Wallet className="h-5 w-5 text-accent" aria-hidden="true" />
              <p className="break-all font-mono text-sm font-semibold text-slate-950">
                {publicKey}
              </p>
            </div>
          </div>

          <div className="structured-card p-5">
            <p className="section-label">Review Steps</p>
            <div className="mt-4 space-y-4">
              {[
                ['Validate recipient', 'Address format and account existence are checked before signing.'],
                ['Sign transaction', 'Freighter signs locally; secret keys never touch the app server.'],
                ['Record activity', 'Successful transfers are logged for metrics and reporting.'],
              ].map(([title, body]) => (
                <div key={title} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{title}</p>
                    <p className="mt-1 text-sm text-slate-500">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-900 bg-slate-950 p-5 text-white shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-300" aria-hidden="true" />
              <p className="text-sm font-bold">Vault-aware routing</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Multisig accounts create pending approval requests instead of submitting single-signer payments.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
