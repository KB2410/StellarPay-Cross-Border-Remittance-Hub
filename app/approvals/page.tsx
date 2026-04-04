'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitTransaction } from '@/lib/stellar';
import { inspectTransaction } from '@/lib/multisig';
import type { PendingTransaction } from '@/types';

export default function ApprovalsPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [pendingTxs, setPendingTxs] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState('');
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const key = localStorage.getItem('stellarpay_pubkey');
    if (!key) {
      router.push('/');
      return;
    }
    setPublicKey(key);
    fetchPendingTransactions();
  }, [router]);

  async function fetchPendingTransactions() {
    try {
      const res = await fetch('/api/multisig');
      const data = await res.json();
      setPendingTxs(data.pendingTransactions || []);
    } catch {
      // Supabase might not be configured
      setPendingTxs([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignAndExecute(tx: PendingTransaction) {
    setStatus(null);

    const isFreighter =
      localStorage.getItem('stellarpay_is_freighter') === 'true';

    try {
      let signedXdr: string;

      if (isFreighter) {
        const freighterApi = await import('@stellar/freighter-api');
        signedXdr = await freighterApi.signTransaction(tx.xdr_payload, {
          networkPassphrase: 'Test SDF Network ; September 2015',
        });
      } else {
        if (!secretKey) {
          setSigningId(tx.id);
          return;
        }

        const StellarSdk = await import('@stellar/stellar-sdk');
        const { signPendingTransaction } = await import('@/lib/multisig');
        const keypair = StellarSdk.Keypair.fromSecret(secretKey);
        signedXdr = signPendingTransaction(tx.xdr_payload, keypair);
      }

      // Submit to Horizon
      const result = await submitTransaction(signedXdr);

      if (result.success) {
        // Update the pending tx status
        await fetch('/api/multisig', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            txId: tx.id,
            xdrPayload: signedXdr,
          }),
        });

        setStatus({
          type: 'success',
          message: `Transaction executed! TX: ${result.hash?.slice(0, 12)}...`,
        });

        setSigningId(null);
        setSecretKey('');
        fetchPendingTransactions();
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (err: unknown) {
      const e = err as Error;
      setStatus({ type: 'error', message: e.message });
    }
  }

  async function handleReject(txId: string) {
    try {
      await fetch('/api/multisig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', txId }),
      });
      fetchPendingTransactions();
    } catch {
      // silent
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/dashboard" className="hover:text-gray-300 transition-colors">
          Dashboard
        </Link>
        <span>→</span>
        <span className="text-white">Pending Approvals</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Pending Approvals
          </h1>
          <p className="text-gray-500 text-sm">
            Multi-sig transactions awaiting your signature
          </p>
        </div>
        <button
          onClick={fetchPendingTransactions}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 transition-all"
        >
          Refresh
        </button>
      </div>

      {/* Status */}
      {status && (
        <div
          className={`p-4 rounded-xl text-sm mb-6 ${
            status.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {status.message}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white/[0.03] rounded-2xl shimmer" />
          ))}
        </div>
      ) : pendingTxs.length > 0 ? (
        <div className="space-y-4">
          {pendingTxs.map((tx) => {
            const details = inspectTransaction(tx.xdr_payload);
            return (
              <div
                key={tx.id}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 pulse-glow" />
                      <span className="text-sm font-medium text-amber-400">
                        Pending ({tx.current_signatures}/{tx.required_signatures} signatures)
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Created {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-medium">
                    Awaiting
                  </span>
                </div>

                {/* Transaction details */}
                {details && details.operations.length > 0 && (
                  <div className="bg-white/[0.02] rounded-xl p-4 mb-4">
                    {details.operations.map((op, i) => (
                      <div key={i} className="text-sm">
                        <span className="text-gray-400">
                          {op.type === 'payment' ? 'Payment' : op.type}:
                        </span>
                        {op.amount && (
                          <span className="text-white font-medium ml-2">
                            {op.amount} {op.asset || 'XLM'}
                          </span>
                        )}
                        {op.destination && (
                          <p className="text-xs text-gray-500 font-mono mt-1">
                            To: {op.destination.slice(0, 12)}...{op.destination.slice(-6)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Vault + Creator info */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                  <div>
                    <span className="text-gray-500">Vault:</span>
                    <p className="text-gray-400 font-mono">
                      {tx.vault_public_key.slice(0, 8)}...{tx.vault_public_key.slice(-4)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Creator:</span>
                    <p className="text-gray-400 font-mono">
                      {tx.creator_public_key.slice(0, 8)}...{tx.creator_public_key.slice(-4)}
                    </p>
                  </div>
                </div>

                {/* Secret key input for non-Freighter users */}
                {signingId === tx.id && (
                  <div className="mb-4">
                    <input
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="Enter your secret key (S...)"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono text-sm"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSignAndExecute(tx)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-sm font-semibold transition-all"
                  >
                    {signingId === tx.id ? 'Confirm & Execute' : 'Sign & Execute'}
                  </button>
                  <button
                    onClick={() => handleReject(tx.id)}
                    className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-all"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center">
          <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg">No pending approvals</p>
          <p className="text-gray-600 text-sm mt-1">
            Vault transactions requiring your signature will appear here
          </p>
        </div>
      )}
    </div>
  );
}
