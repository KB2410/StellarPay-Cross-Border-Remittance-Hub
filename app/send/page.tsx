'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 font-medium relative z-10">
        <Link href="/dashboard" className="hover:text-white transition-colors">
          Dashboard
        </Link>
        <span>→</span>
        <span className="text-white">Send USDC</span>
      </div>

      {/* Header */}
      <div className="text-center mb-10 relative z-10">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(99,102,241,0.4)]">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 font-display">
          Send Payment
        </h1>
        <p className="text-gray-400 text-lg">
          Transfer USDC to any Stellar address instantly
        </p>
      </div>

      {/* Form Card */}
      <div className="glass rounded-3xl p-6 sm:p-10 max-w-lg mx-auto relative z-10 shadow-2xl border-white/10">
        <SendForm publicKey={publicKey} />
      </div>
    </div>
  );
}
