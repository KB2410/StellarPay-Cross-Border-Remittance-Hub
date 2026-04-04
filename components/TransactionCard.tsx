'use client';

import type { HorizonOperation } from '@/types';

interface TransactionCardProps {
  operation: HorizonOperation;
  userPublicKey: string;
}

export default function TransactionCard({
  operation,
  userPublicKey,
}: TransactionCardProps) {
  const isSent = operation.from === userPublicKey || operation.source_account === userPublicKey;
  const isPayment = operation.type === 'payment' || operation.type === 'create_account';

  const counterparty = isSent ? operation.to : operation.from;
  const truncatedKey = counterparty
    ? `${counterparty.slice(0, 6)}...${counterparty.slice(-4)}`
    : 'Unknown';

  const date = new Date(operation.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl p-4 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Direction icon */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isSent
                ? 'bg-red-500/10 text-red-400'
                : 'bg-emerald-500/10 text-emerald-400'
            }`}
          >
            <svg
              className={`w-5 h-5 ${isSent ? 'rotate-45' : '-rotate-[135deg]'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </div>

          <div>
            <p className="text-white font-medium text-sm">
              {isSent ? 'Sent' : 'Received'}
              {isPayment && operation.asset_code
                ? ` ${operation.asset_code}`
                : operation.type === 'create_account'
                ? ' (Account Created)'
                : ` (${operation.type})`}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              {isSent ? 'To' : 'From'}: {truncatedKey}
            </p>
          </div>
        </div>

        <div className="text-right">
          {operation.amount && (
            <p
              className={`font-semibold text-sm ${
                isSent ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {isSent ? '-' : '+'}
              {parseFloat(operation.amount).toFixed(2)}{' '}
              {operation.asset_code || 'XLM'}
            </p>
          )}
          <p className="text-gray-600 text-xs mt-0.5">{date}</p>
        </div>
      </div>

      {/* TX hash on hover */}
      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={`https://stellar.expert/explorer/testnet/tx/${operation.transaction_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-violet-400 hover:text-violet-300 font-mono"
        >
          {operation.transaction_hash.slice(0, 16)}... ↗
        </a>
      </div>
    </div>
  );
}
