'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/dashboard" className="hover:text-gray-300 transition-colors">
          Dashboard
        </Link>
        <span>→</span>
        <span className="text-white">Receive</span>
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Receive Payment
        </h1>
        <p className="text-gray-400">
          Share your address or QR code to receive USDC
        </p>
      </div>

      {/* QR Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 max-w-md mx-auto">
        <QRDisplay publicKey={publicKey} />
      </div>
    </div>
  );
}
