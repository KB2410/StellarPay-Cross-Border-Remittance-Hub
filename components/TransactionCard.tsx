import type { HorizonOperation } from '@/types';

interface TransactionCardProps {
  operation: HorizonOperation;
  userPublicKey: string;
}

export default function TransactionCard({
  operation,
  userPublicKey,
}: TransactionCardProps) {
  const isPayment = operation.type === 'payment';
  const isCreateAccount = operation.type === 'create_account';

  let title = 'Transaction';
  let amountStr = '';
  let counterparty = '';
  let isOutgoing = false;
  let Icon = null;

  if (isPayment) {
    isOutgoing = operation.from === userPublicKey;
    title = isOutgoing ? 'Sent Payment' : 'Received Payment';
    const asset =
      operation.asset_type === 'native' ? 'XLM' : operation.asset_code;
    amountStr = `${isOutgoing ? '-' : '+'}${operation.amount} ${asset}`;
    counterparty = isOutgoing ? (operation.to || '') : (operation.from || '');

    Icon = isOutgoing ? (
      <svg className="w-5 h-5 text-zinc-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-zinc-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    );
  } else if (isCreateAccount) {
    title = 'Account Created';
    amountStr = `+${operation.starting_balance} XLM`;
    counterparty = operation.account || '';
    Icon = (
      <svg className="w-5 h-5 text-zinc-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    );
  } else {
    title = operation.type.replace('_', ' ');
    Icon = (
      <svg className="w-5 h-5 text-zinc-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  }

  const date = new Date(operation.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="structured-card rounded-xl p-4 flex items-center justify-between transition-colors hover:bg-zinc-800/50">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            isPayment
              ? isOutgoing
                ? 'bg-zinc-800'
                : 'bg-emerald-600'
              : 'bg-blue-600'
          }`}
        >
          {Icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-50 capitalize truncate">
            {title}
          </p>
          {counterparty && (
            <p className="text-xs text-zinc-400 font-mono truncate mt-0.5">
              {isOutgoing ? 'To: ' : 'From: '}
              {counterparty.slice(0, 8)}...{counterparty.slice(-4)}
            </p>
          )}
        </div>
      </div>
      
      <div className="text-right shrink-0 ml-4">
        <p
          className={`text-sm font-bold ${
            isOutgoing ? 'text-zinc-50' : 'text-emerald-500'
          }`}
        >
          {amountStr}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">{date}</p>
      </div>
    </div>
  );
}
