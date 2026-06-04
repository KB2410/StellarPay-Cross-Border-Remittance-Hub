'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Landmark, QrCode, ShieldCheck } from 'lucide-react';
import QRDisplay from '@/components/QRDisplay';

export default function ReceivePage() {
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

      <div className="grid gap-6 lg:grid-cols-[1fr_0.34fr]">
        <section className="structured-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-accent">
                <QrCode className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="section-label">Receive Desk</p>
                <h1 className="mt-1 text-2xl font-bold text-slate-950 font-display">
                  Receive payment
                </h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm text-slate-600">
              Share your Stellar address or QR code with a sender. XLM can arrive directly; issued assets require the matching trustline.
            </p>
          </div>
          <div className="p-6">
            <QRDisplay publicKey={publicKey} />
          </div>
        </section>

        <aside className="space-y-4">
          <div className="structured-card p-5">
            <Landmark className="mb-4 h-5 w-5 text-accent" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-950">Stellar network</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              The address is your public key on Stellar testnet. Keep it shareable; keep secret keys inside Freighter.
            </p>
          </div>
          <div className="structured-card p-5">
            <ShieldCheck className="mb-4 h-5 w-5 text-accent" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-950">Trustline note</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use the Assets page to add USDC support before receiving USDC payments.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
