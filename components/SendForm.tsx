'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  isValidAddress,
  buildPaymentTransaction,
  buildNativePaymentTransaction,
  submitTransaction,
  isMultisigAccount,
} from '@/lib/stellar';
import {
  validatePublicKey,
  validateAmountForAsset,
  validateMemo,
  sanitizeInput,
} from '@/lib/validation';
import { establishWalletSession } from '@/lib/wallet-session';

interface SendFormProps {
  publicKey: string;
}

export default function SendForm({ publicKey }: SendFormProps) {
  const [selectedAsset, setSelectedAsset] = useState<'XLM' | 'USDC'>('XLM');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const walletSessionEstablished = await establishWalletSession(publicKey);

      if (!walletSessionEstablished) {
        throw new Error('Please reconnect your wallet to continue');
      }

      // Sanitize inputs
      const sanitizedRecipient = sanitizeInput(recipient);
      const sanitizedAmount = sanitizeInput(amount);
      const sanitizedMemo = sanitizeInput(memo);

      // Validate recipient
      const recipientValidation = validatePublicKey(sanitizedRecipient);
      if (!recipientValidation.valid) {
        throw new Error(recipientValidation.error);
      }

      // Validate amount
      const amountValidation = validateAmountForAsset(sanitizedAmount, selectedAsset);
      if (!amountValidation.valid) {
        throw new Error(amountValidation.error);
      }

      // Validate memo
      const memoValidation = validateMemo(sanitizedMemo);
      if (!memoValidation.valid) {
        throw new Error(memoValidation.error);
      }

      // Additional checks
      if (!isValidAddress(sanitizedRecipient)) {
        throw new Error('Invalid Stellar address');
      }
      if (sanitizedRecipient === publicKey) {
        throw new Error('Cannot send to yourself');
      }

      // Build the payment XDR
      const xdr = selectedAsset === 'XLM'
        ? await buildNativePaymentTransaction(
            publicKey,
            sanitizedRecipient,
            sanitizedAmount,
            sanitizedMemo || undefined
          )
        : await buildPaymentTransaction(
            publicKey,
            sanitizedRecipient,
            sanitizedAmount,
            sanitizedMemo || undefined
          );

      // Check if account is a multisig vault
      const isVault = await isMultisigAccount(publicKey);

      if (isVault) {
        const freighterApi = await import('@stellar/freighter-api');
        const { network } = await import('@/lib/stellar');
        const signedVaultXdr = await freighterApi.signTransaction(xdr, {
          accountToSign: publicKey,
          networkPassphrase: network,
        });

        // Send to multisig queue instead of submitting directly
        const res = await fetch('/api/multisig', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            vaultPublicKey: publicKey,
            creatorPublicKey: publicKey,
            xdrPayload: signedVaultXdr,
          }),
        });
        const data = await res.json();

        if (data.success) {
          setStatus({
            type: 'success',
            message:
              'Transaction created and pending co-signer approval. Check the Approvals page.',
          });
          setTimeout(() => router.push('/approvals'), 2000);
        } else {
          throw new Error(data.error || 'Failed to create pending transaction');
        }
      } else {
        // Standard account — sign with Freighter
        const freighterApi = await import('@stellar/freighter-api');
        const { network } = await import('@/lib/stellar');
        
        const signedXdr = await freighterApi.signTransaction(xdr, {
          networkPassphrase: network,
        });

        const result = await submitTransaction(signedXdr);

        if (result.success) {
          setStatus({
            type: 'success',
            message: `Payment sent! TX: ${result.hash?.slice(0, 12)}...`,
          });

          try {
            await fetch('/api/transactions', {
              body: JSON.stringify({
                amount: sanitizedAmount,
                asset: selectedAsset,
                counterparty: sanitizedRecipient,
                memo: sanitizedMemo,
                stellarTxHash: result.hash,
              }),
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' },
              method: 'POST',
            });
          } catch {
            // Non-blocking
          }
          setTimeout(() => router.push('/dashboard'), 2000);
        } else {
          throw new Error(result.error || 'Transaction failed');
        }
      }
    } catch (err: unknown) {
      const e = err as Error;
      setStatus({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg mx-auto">
      {/* Asset Selector */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-2">
          Asset
        </label>
        <select
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value as 'XLM' | 'USDC')}
          className="input-field w-full px-4 py-3 rounded-lg text-sm font-medium"
        >
          <option value="XLM">XLM (Stellar Lumens)</option>
          <option value="USDC">USDC (USD Coin)</option>
        </select>
      </div>

      {/* Recipient */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-2">
          Recipient Address
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="G..."
          className="input-field w-full px-4 py-3 rounded-lg font-mono text-sm placeholder:text-zinc-600"
          required
        />
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-2">
          Amount ({selectedAsset})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.000001"
          min="0.000001"
          className="input-field w-full px-4 py-3 rounded-lg text-lg font-medium placeholder:text-zinc-600"
          required
        />
      </div>

      {/* Memo */}
      <div>
        <label className="block text-sm font-semibold text-zinc-300 mb-2">
          Memo <span className="text-zinc-500 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Payment for..."
          maxLength={28}
          className="input-field w-full px-4 py-3 rounded-lg text-sm placeholder:text-zinc-600"
        />
      </div>

      {/* Status */}
      {status && (
        <div
          className={`p-4 rounded-lg text-sm font-medium ${
            status.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {status.message}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !recipient || !amount}
        className="btn-primary w-full py-3.5 rounded-lg font-semibold text-base mt-2 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send {selectedAsset}
          </>
        )}
      </button>
    </form>
  );
}
