'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { network, submitTransaction } from '@/lib/stellar';
import { inspectTransaction } from '@/lib/multisig';
import type { PendingTransaction } from '@/types';
import { establishWalletSession } from '@/lib/wallet-session';

export default function ApprovalsPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [pendingTxs, setPendingTxs] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const router = useRouter();

  const fetchPendingTransactions = useCallback(async (walletAddress: string) => {
    try {
      const walletSessionEstablished = await establishWalletSession(walletAddress);

      if (!walletSessionEstablished) {
        throw new Error('Please reconnect your wallet to review approvals');
      }

      const res = await fetch('/api/multisig', {
        credentials: 'same-origin',
      });
      const data = await res.json();
      setPendingTxs(data.pendingTransactions || []);
      setStatus(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load pending approvals';
      setPendingTxs([]);
      setStatus({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const key = localStorage.getItem('stellarpay_pubkey');
    if (!key) {
      router.push('/');
      return;
    }
    setPublicKey(key);
    void fetchPendingTransactions(key);
  }, [fetchPendingTransactions, router]);

  async function handleSignAndExecute(tx: PendingTransaction) {
    setStatus(null);

    try {
      const walletSessionEstablished = await establishWalletSession(
        publicKey || ''
      );

      if (!walletSessionEstablished) {
        throw new Error('Please reconnect your wallet to sign approvals');
      }

      const freighterApi = await import('@stellar/freighter-api');
      const signedXdr = await freighterApi.signTransaction(tx.xdr_payload, {
        accountToSign: publicKey!,
        networkPassphrase: network,
      });

      // Submit to Horizon
      const result = await submitTransaction(signedXdr);

      if (result.success) {
        // Update the pending tx status
        await fetch('/api/multisig', {
          credentials: 'same-origin',
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
        if (publicKey) {
          void fetchPendingTransactions(publicKey);
        }
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
        credentials: 'same-origin',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', txId }),
      });
      if (publicKey) {
        void fetchPendingTransactions(publicKey);
      }
    } catch {
      // silent
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-8 font-medium">
        <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
          Dashboard
        </Link>
        <span>→</span>
        <span className="text-zinc-50">Pending Approvals</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-50 mb-1">
            Pending Approvals
          </h1>
          <p className="text-zinc-500 text-sm">
            Multi-sig transactions awaiting your signature
          </p>
        </div>
        <button
          onClick={() => {
            if (publicKey) {
              void fetchPendingTransactions(publicKey);
            }
          }}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 transition-all font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Status */}
      {status && (
        <div
          className={`p-4 rounded-lg text-sm mb-6 font-medium ${
            status.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {status.message}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-800 rounded-xl shimmer" />
          ))}
        </div>
      ) : pendingTxs.length > 0 ? (
        <div className="space-y-4">
          {pendingTxs.map((tx) => {
            const details = inspectTransaction(tx.xdr_payload);
            return (
              <div
                key={tx.id}
                className="structured-card rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-sm font-semibold text-blue-500">
                        Pending ({tx.current_signatures}/{tx.required_signatures} signatures)
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Created {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-md text-xs font-medium">
                    Awaiting
                  </span>
                </div>

                {/* Transaction details */}
                {details && details.operations.length > 0 && (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 mb-4">
                    {details.operations.map((op, i) => (
                      <div key={i} className="text-sm">
                        <span className="text-zinc-500 font-medium">
                          {op.type === 'payment' ? 'Payment' : op.type}:
                        </span>
                        {op.amount && (
                          <span className="text-zinc-50 font-bold ml-2">
                            {op.amount} {op.asset || 'XLM'}
                          </span>
                        )}
                        {op.destination && (
                          <p className="text-xs text-zinc-400 font-mono mt-1">
                            To: {op.destination.slice(0, 12)}...{op.destination.slice(-6)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Vault + Creator info */}
                <div className="grid grid-cols-2 gap-4 mb-5 text-xs">
                  <div>
                    <span className="text-zinc-500 font-medium block mb-0.5">Vault:</span>
                    <p className="text-zinc-300 font-mono">
                      {tx.vault_public_key.slice(0, 8)}...{tx.vault_public_key.slice(-4)}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-medium block mb-0.5">Creator:</span>
                    <p className="text-zinc-300 font-mono">
                      {tx.creator_public_key.slice(0, 8)}...{tx.creator_public_key.slice(-4)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSignAndExecute(tx)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    Sign & Execute
                  </button>
                  <button
                    onClick={() => handleReject(tx.id)}
                    className="px-6 py-2.5 bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-zinc-700 hover:border-red-500/30 rounded-lg text-sm font-medium transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="structured-card rounded-xl p-12 text-center">
          <svg className="w-12 h-12 text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-zinc-400 font-medium text-lg">No pending approvals</p>
          <p className="text-zinc-500 text-sm mt-1">
            Vault transactions requiring your signature will appear here
          </p>
        </div>
      )}
    </div>
  );
}
