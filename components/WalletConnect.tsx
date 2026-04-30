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
    <div className="flex flex-col items-center gap-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-5 py-4 rounded-xl text-sm max-w-md text-center shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <p className="font-medium mb-1">{error}</p>
          {error.includes('not found') && (
            <a
              href="https://www.freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-300 hover:text-white underline text-xs transition-colors"
            >
              Install Freighter Wallet &rarr;
            </a>
          )}
        </div>
      )}
      <div className="relative group">
        {/* Glow effect behind button */}
        <div className="absolute -inset-1 bg-gradient-to-r from-accent to-accent-cyan rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500 group-hover:duration-200"></div>
        <button
          onClick={connectFreighter}
          disabled={loading}
          className="relative bg-background border border-accent/50 px-8 py-4 rounded-xl font-bold text-lg text-white flex items-center justify-center min-w-[280px] overflow-hidden transition-all duration-300 transform group-hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-accent-cyan/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
          <span className="relative flex items-center gap-3 font-display tracking-wide z-10">
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-accent-cyan" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-accent-cyan transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            {loading ? 'Connecting...' : 'Connect Freighter'}
          </span>
        </button>
      </div>
      <p className="text-gray-500 text-sm text-center max-w-sm font-medium">
        Secure connection via Freighter.{' '}
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-cyan hover:text-white underline transition-colors"
        >
          Get the extension
        </a>
      </p>
    </div>
  );
}
