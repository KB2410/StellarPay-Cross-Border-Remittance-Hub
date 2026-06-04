'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Send, ShieldCheck } from 'lucide-react';
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

      const sanitizedRecipient = sanitizeInput(recipient);
      const sanitizedAmount = sanitizeInput(amount);
      const sanitizedMemo = sanitizeInput(memo);

      const recipientValidation = validatePublicKey(sanitizedRecipient);
      if (!recipientValidation.valid) {
        throw new Error(recipientValidation.error);
      }

      const amountValidation = validateAmountForAsset(sanitizedAmount, selectedAsset);
      if (!amountValidation.valid) {
        throw new Error(amountValidation.error);
      }

      const memoValidation = validateMemo(sanitizedMemo);
      if (!memoValidation.valid) {
        throw new Error(memoValidation.error);
      }

      if (!isValidAddress(sanitizedRecipient)) {
        throw new Error('Invalid Stellar address');
      }
      if (sanitizedRecipient === publicKey) {
        throw new Error('Cannot send to yourself');
      }

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

      const isVault = await isMultisigAccount(publicKey);

      if (isVault) {
        const freighterApi = await import('@stellar/freighter-api');
        const { network } = await import('@/lib/stellar');
        const signedVaultXdr = await freighterApi.signTransaction(xdr, {
          accountToSign: publicKey,
          networkPassphrase: network,
        });

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
            // Transaction submission already succeeded; logging is best effort.
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
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_0.82fr]">
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Asset
          </label>
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value as 'XLM' | 'USDC')}
            className="input-field h-12 w-full rounded-lg px-4 text-sm font-medium"
          >
            <option value="XLM">XLM (Stellar Lumens)</option>
            <option value="USDC">USDC (USD Coin)</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="G..."
            className="input-field h-12 w-full rounded-lg px-4 font-mono text-sm"
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-[0.8fr_1.2fr]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Amount ({selectedAsset})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.000001"
              min="0.000001"
              className="input-field h-12 w-full rounded-lg px-4 text-base font-semibold"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Memo <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Payment for..."
              maxLength={28}
              className="input-field h-12 w-full rounded-lg px-4 text-sm"
            />
          </div>
        </div>

        {status && (
          <div
            className={`rounded-lg p-4 text-sm font-medium ${
              status.type === 'success'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {status.message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !recipient || !amount}
          className="btn-primary flex h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Processing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              Send {selectedAsset}
            </>
          )}
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
        <p className="section-label">Transfer Summary</p>
        <dl className="mt-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-slate-500">Asset</dt>
            <dd className="text-sm font-semibold text-slate-950">{selectedAsset}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-slate-500">Amount</dt>
            <dd className="font-mono text-sm font-semibold text-slate-950">
              {amount || '0.00'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Recipient</dt>
            <dd className="mt-1 break-all font-mono text-xs font-semibold text-slate-700">
              {recipient || 'No recipient entered'}
            </dd>
          </div>
        </dl>

        <div className="mt-6 rounded-lg border border-emerald-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-950">Policy aware</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Standard wallets submit directly. Vault wallets create an approval request for the co-signer.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Review in Freighter
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      </div>
    </form>
  );
}
