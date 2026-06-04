'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, Plus, ShieldCheck } from 'lucide-react';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const router = useRouter();

  async function addUSDCTrustline() {
    setLoading(true);
    setStatus(null);

    try {
      const publicKey = localStorage.getItem('stellarpay_pubkey');
      if (!publicKey) {
        throw new Error('Please connect your wallet first');
      }

      const StellarSdk = await import('@stellar/stellar-sdk');
      const freighterApi = await import('@stellar/freighter-api');

      const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

      const account = await server.loadAccount(publicKey);
      const hasUSDC = account.balances.some(
        (b: {
          asset_code?: string;
          asset_issuer?: string;
          asset_type: string;
        }) =>
          b.asset_type !== 'native' &&
          b.asset_code === 'USDC' &&
          b.asset_issuer === USDC_ISSUER
      );

      if (hasUSDC) {
        setStatus({ type: 'success', message: 'USDC trustline already exists. You can send and receive USDC now.' });
        setTimeout(() => router.push('/send'), 2000);
        return;
      }

      const usdcAsset = new StellarSdk.Asset('USDC', USDC_ISSUER);
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.changeTrust({
            asset: usdcAsset,
          })
        )
        .setTimeout(180)
        .build();

      const xdr = transaction.toXDR();
      const signedXdr = await freighterApi.signTransaction(xdr, {
        networkPassphrase: StellarSdk.Networks.TESTNET,
      });

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, StellarSdk.Networks.TESTNET);
      const result = await server.submitTransaction(signedTx);

      setStatus({
        type: 'success',
        message: `USDC trustline added. TX: ${result.hash.slice(0, 12)}...`,
      });

      setTimeout(() => router.push('/send'), 2000);
    } catch (err: unknown) {
      const e = err as Error;
      setStatus({ type: 'error', message: e.message || 'Failed to add trustline' });
    } finally {
      setLoading(false);
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

      <div className="grid gap-6 lg:grid-cols-[0.68fr_0.32fr]">
        <section className="structured-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="section-label">Asset Configuration</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 font-display">
              Add USDC trustline
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Stellar accounts explicitly opt in to issued assets. Add the testnet USDC issuer once to receive and send USDC.
            </p>
          </div>

          <div className="p-6">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">USDC issuer</p>
              <p className="mt-2 break-all font-mono text-sm font-semibold text-slate-950">
                GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
              </p>
            </div>

            {status && (
              <div
                className={`mt-5 rounded-lg p-4 text-sm font-medium ${
                  status.type === 'success'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {status.message}
              </div>
            )}

            <button
              onClick={addUSDCTrustline}
              disabled={loading}
              className="btn-primary mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              {loading ? 'Adding trustline' : 'Add USDC Trustline'}
            </button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="structured-card p-5">
            <CheckCircle2 className="mb-4 h-5 w-5 text-accent" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-950">One-time setup</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              XLM works without a trustline. USDC requires this account-level permission.
            </p>
          </div>
          <div className="structured-card p-5">
            <ShieldCheck className="mb-4 h-5 w-5 text-accent" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-950">Freighter approval</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              The transaction is signed in your wallet and submitted to Horizon after approval.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
