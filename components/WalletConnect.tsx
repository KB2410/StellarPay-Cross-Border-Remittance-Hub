'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

      // Try to request access directly - Freighter will handle showing install prompt if needed
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
      
      // Handle specific Freighter errors
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
      // Supabase might not be configured yet — non-blocking
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm max-w-md text-center">
          <p className="font-medium mb-1">{error}</p>
          {error.includes('not found') && (
            <a
              href="https://www.freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline text-xs"
            >
              Install Freighter Wallet →
            </a>
          )}
        </div>
      )}
      <button
        onClick={connectFreighter}
        disabled={loading}
        className="btn-primary group relative px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center min-w-[280px]"
      >
        <span className="flex items-center gap-3">
          {loading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          {loading ? 'Connecting...' : 'Connect Freighter'}
        </span>
      </button>
      <p className="text-zinc-500 text-sm text-center max-w-sm font-medium">
        Secure connection via Freighter.{' '}
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-400 underline transition-colors"
        >
          Get the extension
        </a>
      </p>
    </div>
  );
}
