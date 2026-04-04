'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

      // Load account
      const account = await server.loadAccount(publicKey);
      
      // Check if trustline already exists
      const hasUSDC = account.balances.some(
        (b: any) =>
          b.asset_type !== 'native' &&
          b.asset_code === 'USDC' &&
          b.asset_issuer === USDC_ISSUER
      );

      if (hasUSDC) {
        setStatus({ type: 'success', message: 'USDC trustline already exists! You can send USDC now.' });
        setTimeout(() => router.push('/send'), 2000);
        return;
      }

      // Build trustline transaction
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

      // Sign with Freighter
      const signedXdr = await freighterApi.signTransaction(xdr, {
        networkPassphrase: StellarSdk.Networks.TESTNET,
      });

      // Submit transaction
      const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, StellarSdk.Networks.TESTNET);
      const result = await server.submitTransaction(signedTx);

      setStatus({
        type: 'success',
        message: `USDC trustline added! TX: ${result.hash.slice(0, 12)}... You can now send USDC!`,
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
    <div className="min-h-screen bg-[#0a0b14] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Setup USDC</h1>
          <p className="text-gray-400">Add USDC trustline to your account before sending payments</p>
        </div>

        {/* Info Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">What is a trustline?</h2>
          <p className="text-gray-400 text-sm mb-4">
            On Stellar, you need to explicitly trust an asset before you can hold it. This is a one-time setup that
            allows your account to receive and send USDC.
          </p>
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4">
            <p className="text-violet-300 text-sm">
              <strong>USDC Issuer:</strong>
              <br />
              <code className="text-xs break-all">GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5</code>
            </p>
          </div>
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

        {/* Action Button */}
        <button
          onClick={addUSDCTrustline}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Adding Trustline...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add USDC Trustline
            </>
          )}
        </button>

        <Link
          href="/dashboard"
          className="block text-center text-gray-400 hover:text-white transition-colors text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
