'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PlugZap } from 'lucide-react';
import { establishWalletSession } from '@/lib/wallet-session';

interface WalletConnectProps {
  onConnect?: (publicKey: string) => void;
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function connectFreighter() {
    setLoading(true);
    setError('');
    try {
      const freighterApi = await import('@stellar/freighter-api');
      const publicKey = await freighterApi.requestAccess();

      if (!publicKey) {
        throw new Error('User denied access');
      }

      const walletSessionEstablished = await establishWalletSession(publicKey);

      if (!walletSessionEstablished) {
        throw new Error('Failed to verify wallet session');
      }

      await saveUser();

      if (onConnect) onConnect(publicKey);
      localStorage.setItem('stellarpay_pubkey', publicKey);
      localStorage.setItem('stellarpay_is_freighter', 'true');
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as Error;
      const errorMessage = e.message || 'Failed to connect wallet';

      if (errorMessage.includes('User declined access') || errorMessage.includes('denied')) {
        setError('Connection cancelled. Please approve the connection in Freighter.');
      } else if (errorMessage.includes('Freighter is not installed') || errorMessage.includes('not available')) {
        setError('Freighter wallet not found. Please install it from freighter.app');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveUser() {
    try {
      await fetch('/api/wallet/profile', {
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
    } catch {
      // Supabase might not be configured yet; this is non-blocking.
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={connectFreighter}
        disabled={loading}
        className="btn-primary inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-lg px-5 text-sm"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <PlugZap className="h-4 w-4" aria-hidden="true" />
        )}
        {loading ? 'Connecting wallet' : 'Connect Freighter'}
      </button>

      {error && (
        <div className="max-w-sm rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <p>{error}</p>
          {error.includes('not found') && (
            <a
              href="https://www.freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-red-700 underline underline-offset-2"
            >
              Install Freighter Wallet
            </a>
          )}
        </div>
      )}
    </div>
  );
}
