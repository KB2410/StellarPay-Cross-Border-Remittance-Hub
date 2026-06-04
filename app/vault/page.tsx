'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Loader2, ShieldCheck, Users } from 'lucide-react';
import { isValidAddress } from '@/lib/stellar';
import { establishWalletSession } from '@/lib/wallet-session';

export default function VaultPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [coSignerKey, setCoSignerKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info';
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
  }, [router]);

  async function handleSetupVault(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      if (!isValidAddress(coSignerKey)) {
        throw new Error('Invalid co-signer address');
      }

      if (coSignerKey === publicKey) {
        throw new Error('Co-signer cannot be the same as your address');
      }

      const walletSessionEstablished = await establishWalletSession(
        publicKey || ''
      );

      if (!walletSessionEstablished) {
        throw new Error('Please reconnect your wallet to continue');
      }

      const freighterApi = await import('@stellar/freighter-api');
      const { buildVaultSetupTransaction } = await import('@/lib/multisig');
      const { network, submitTransaction } = await import('@/lib/stellar');
      const xdr = await buildVaultSetupTransaction(publicKey!, coSignerKey);
      const signedXdr = await freighterApi.signTransaction(xdr, {
        accountToSign: publicKey!,
        networkPassphrase: network,
      });
      const result = await submitTransaction(signedXdr);

      if (!result.success || !result.hash) {
        throw new Error(result.error || 'Failed to set up vault');
      }

      setStatus({
        type: 'success',
        message: `Vault created. TX: ${result.hash.slice(0, 12)}... Your account now requires 2-of-2 signatures for payments.`,
      });
    } catch (err: unknown) {
      const e = err as Error;
      setStatus({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  }

  if (!publicKey) return null;

  return (
    <div className="page-shell">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Dashboard
      </Link>

      <div className="grid gap-6 lg:grid-cols-[0.68fr_0.32fr]">
        <section className="structured-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-accent">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="section-label">Shared Custody</p>
                <h1 className="mt-1 text-2xl font-bold text-slate-950 font-display">
                  Create 2-of-2 vault
                </h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
              Add a co-signer and raise payment thresholds so both wallets must approve future payments.
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Irreversible threshold change
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    Payments will require both signatures after setup. Confirm the co-signer controls and backs up their wallet.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSetupVault} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Your Address
                </label>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs font-semibold text-slate-700 break-all">
                  {publicKey}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Co-Signer Public Key
                </label>
                <input
                  type="text"
                  value={coSignerKey}
                  onChange={(e) => setCoSignerKey(e.target.value)}
                  placeholder="G..."
                  className="input-field h-12 w-full rounded-lg px-4 font-mono text-sm"
                  required
                />
              </div>

              {status && (
                <div
                  className={`rounded-lg p-4 text-sm font-medium ${
                    status.type === 'success'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                      : status.type === 'error'
                      ? 'border border-red-200 bg-red-50 text-red-700'
                      : 'border border-blue-200 bg-blue-50 text-blue-700'
                  }`}
                >
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !coSignerKey}
                className="btn-primary flex h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                )}
                {loading ? 'Setting up vault' : 'Create 2-of-2 Vault'}
              </button>
            </form>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="structured-card p-5">
            <Users className="mb-4 h-5 w-5 text-accent" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-950">Two-party control</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Master key weight and co-signer weight are each set to 1, with payment threshold set to 2.
            </p>
          </div>
          <div className="rounded-lg border border-slate-900 bg-slate-950 p-5 text-white shadow-sm">
            <p className="text-sm font-bold">Approval queue</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Vault payments are stored as signed XDRs until an authorized co-signer reviews and executes them.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
