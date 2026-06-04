'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { network, submitTransaction } from '@/lib/stellar';
import { inspectTransaction } from '@/lib/multisig';
import type { PendingTransaction } from '@/types';
import { establishWalletSession } from '@/lib/wallet-session';

export default function ApprovalsPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [pendingTxs, setPendingTxs] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
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
    setActiveTxId(tx.id);

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

      const result = await submitTransaction(signedXdr);

      if (result.success) {
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
          message: `Transaction executed. TX: ${result.hash?.slice(0, 12)}...`,
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
    } finally {
      setActiveTxId(null);
    }
  }

  async function handleReject(txId: string) {
    setActiveTxId(txId);
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
      setStatus({ type: 'error', message: 'Failed to reject transaction' });
    } finally {
      setActiveTxId(null);
    }
  }

  return (
    <div className="page-shell">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Dashboard
      </Link>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="section-label">Approval Queue</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 font-display">
            Pending approvals
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Review multisig payment requests, inspect transaction details, and execute authorized XDRs.
          </p>
        </div>
        <button
          onClick={() => {
            if (publicKey) {
              setLoading(true);
              void fetchPendingTransactions(publicKey);
            }
          }}
          className="btn-secondary inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </button>
      </div>

      {status && (
        <div
          className={`mb-6 rounded-lg p-4 text-sm font-medium ${
            status.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {status.message}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 rounded-lg bg-slate-200 shimmer" />
          ))}
        </div>
      ) : pendingTxs.length > 0 ? (
        <div className="space-y-4">
          {pendingTxs.map((tx) => {
            const details = inspectTransaction(tx.xdr_payload);
            const isBusy = activeTxId === tx.id;

            return (
              <div key={tx.id} className="structured-card overflow-hidden">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
                      <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-950">
                          Pending signature
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {tx.current_signatures}/{tx.required_signatures} signatures
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Created {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    Awaiting review
                  </span>
                </div>

                <div className="grid gap-5 p-5 lg:grid-cols-[1fr_0.72fr]">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="section-label">Transaction Details</p>
                    {details && details.operations.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {details.operations.map((op, i) => (
                          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
                            <p className="text-sm font-semibold capitalize text-slate-950">
                              {op.type === 'payment' ? 'Payment' : op.type}
                            </p>
                            {op.amount && (
                              <p className="mt-2 text-xl font-bold text-slate-950 font-display">
                                {op.amount} {op.asset || 'XLM'}
                              </p>
                            )}
                            {op.destination && (
                              <p className="mt-2 break-all font-mono text-xs text-slate-500">
                                To: {op.destination}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">
                        Transaction details could not be parsed.
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Vault</p>
                      <p className="mt-2 break-all font-mono text-xs font-semibold text-slate-700">
                        {tx.vault_public_key}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Creator</p>
                      <p className="mt-2 break-all font-mono text-xs font-semibold text-slate-700">
                        {tx.creator_public_key}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSignAndExecute(tx)}
                        disabled={isBusy}
                        className="btn-primary flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm"
                      >
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        )}
                        Sign & Execute
                      </button>
                      <button
                        onClick={() => handleReject(tx.id)}
                        disabled={isBusy}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="structured-card p-12 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-600" aria-hidden="true" />
          <p className="text-lg font-semibold text-slate-950">No pending approvals</p>
          <p className="mt-2 text-sm text-slate-500">
            Vault transactions requiring your signature will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
