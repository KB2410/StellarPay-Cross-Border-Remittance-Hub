'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

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

      // Check if Freighter is installed
      const isInstalled =
        typeof window !== 'undefined' &&
        (window as unknown as { freighter?: unknown }).freighter;

      if (!isInstalled) {
        setError('Freighter wallet not found. Please install it from freighter.app');
        setLoading(false);
        return;
      }

      const publicKey = await freighterApi.requestAccess();

      if (!publicKey) {
        throw new Error('User denied access');
      }

      // Save user to Supabase
      await saveUser(publicKey);

      if (onConnect) onConnect(publicKey);
      localStorage.setItem('stellarpay_pubkey', publicKey);
      localStorage.setItem('stellarpay_is_freighter', 'true');
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  }

  async function saveUser(publicKey: string) {
    try {
      const supabase = createClient();
      await supabase.from('users').upsert(
        { stellar_public_key: publicKey, last_active_at: new Date().toISOString() },
        { onConflict: 'stellar_public_key' }
      );
    } catch {
      // Supabase might not be configured yet — non-blocking
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm max-w-md text-center">
          <p className="font-medium mb-1">{error}</p>
          {error.includes('not found') && (
            <a
              href="https://www.freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 underline text-xs"
            >
              Install Freighter Wallet →
            </a>
          )}
        </div>
      )}
      <button
        onClick={connectFreighter}
        disabled={loading}
        className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-3">
          {loading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          {loading ? 'Connecting...' : 'Connect with Freighter'}
        </span>
      </button>
      <p className="text-gray-500 text-sm text-center max-w-sm">
        Connect your Freighter wallet to access StellarPay.{' '}
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-400 hover:text-violet-300 underline"
        >
          Don't have Freighter?
        </a>
      </p>
    </div>
  );
}
