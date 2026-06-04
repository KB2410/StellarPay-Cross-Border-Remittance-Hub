import { ArrowDownLeft, ArrowUpRight, CircleDollarSign, UserPlus } from 'lucide-react';
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

  let title = 'Network Operation';
  let amountStr = '';
  let counterparty = '';
  let isOutgoing = false;
  let Icon = CircleDollarSign;

  if (isPayment) {
    isOutgoing = operation.from === userPublicKey;
    title = isOutgoing ? 'Sent payment' : 'Received payment';
    const asset =
      operation.asset_type === 'native' ? 'XLM' : operation.asset_code;
    amountStr = `${isOutgoing ? '-' : '+'}${operation.amount} ${asset}`;
    counterparty = isOutgoing ? (operation.to || '') : (operation.from || '');
    Icon = isOutgoing ? ArrowUpRight : ArrowDownLeft;
  } else if (isCreateAccount) {
    title = 'Account created';
    amountStr = `+${operation.starting_balance} XLM`;
    counterparty = operation.account || '';
    Icon = UserPlus;
  } else {
    title = operation.type.replace('_', ' ');
  }

  const date = new Date(operation.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${
              isPayment && !isOutgoing
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold capitalize text-slate-950">
              {title}
            </p>
            {counterparty && (
              <p className="mt-1 truncate font-mono text-xs text-slate-500">
                {isOutgoing ? 'To: ' : 'From: '}
                {counterparty.slice(0, 8)}...{counterparty.slice(-4)}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p
            className={`text-sm font-bold ${
              isOutgoing ? 'text-slate-950' : 'text-emerald-700'
            }`}
          >
            {amountStr}
          </p>
          <p className="mt-1 text-xs text-slate-500">{date}</p>
        </div>
      </div>
    </div>
  );
}
