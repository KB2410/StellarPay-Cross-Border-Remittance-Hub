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
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    );
  } else if (isCreateAccount) {
    title = 'Account Created';
    amountStr = `+${operation.starting_balance} XLM`;
    counterparty = operation.account || '';
    Icon = (
      <svg className="w-5 h-5 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    );
  } else {
    title = operation.type.replace('_', ' ');
    Icon = (
      <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="glass rounded-xl p-4 flex items-center justify-between transition-all duration-300 hover:bg-white/10 hover:shadow-lg group">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-110 ${
            isPayment
              ? isOutgoing
                ? 'bg-white/5 border-white/10'
                : 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-accent/10 border-accent/20'
          }`}
        >
          {Icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white capitalize truncate font-display tracking-wide">
            {title}
          </p>
          {counterparty && (
            <p className="text-xs text-gray-400 font-mono truncate mt-1">
              {isOutgoing ? 'To: ' : 'From: '}
              {counterparty.slice(0, 8)}...{counterparty.slice(-4)}
            </p>
          )}
        </div>
      </div>
      
      <div className="text-right shrink-0 ml-4">
        <p
          className={`text-sm font-bold font-display tracking-wide ${
            isOutgoing ? 'text-white' : 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'
          }`}
        >
          {amountStr}
        </p>
        <p className="text-xs text-gray-500 mt-1">{date}</p>
      </div>
    </div>
  );
}
