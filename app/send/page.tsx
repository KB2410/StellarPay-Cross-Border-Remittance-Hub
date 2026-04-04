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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/dashboard" className="hover:text-gray-300 transition-colors">
          Dashboard
        </Link>
        <span>→</span>
        <span className="text-white">Send USDC</span>
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Send Payment
        </h1>
        <p className="text-gray-400">
          Transfer USDC to any Stellar address instantly
        </p>
      </div>

      {/* Form Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 max-w-lg mx-auto">
        <SendForm publicKey={publicKey} />
      </div>
    </div>
  );
}
