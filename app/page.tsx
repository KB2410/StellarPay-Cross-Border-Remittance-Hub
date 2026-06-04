import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Landmark,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import WalletConnect from '@/components/WalletConnect';

const operatingStats = [
  { label: 'Settlement Window', value: '< 5s' },
  { label: 'Network Fee', value: '$0.001' },
  { label: 'Vault Policy', value: '2-of-2' },
];

const transferRows = [
  {
    name: 'Operations Vault',
    route: 'Mumbai to Nairobi',
    amount: '240.00 USDC',
    status: 'Ready',
  },
  {
    name: 'Family Remittance',
    route: 'New York to Manila',
    amount: '75.00 XLM',
    status: 'Settled',
  },
  {
    name: 'Supplier Payout',
    route: 'London to Delhi',
    amount: '500.00 USDC',
    status: 'Awaiting co-signer',
  },
];

export default function LandingPage() {
  return (
    <div className="page-shell">
      <section className="grid min-h-[calc(100vh-8rem)] items-center gap-10 py-10 lg:grid-cols-[0.92fr_1.08fr] lg:py-14">
        <div>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
            <Landmark className="h-4 w-4" aria-hidden="true" />
            Stellar testnet remittance console
          </div>

          <p className="section-label">StellarPay</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-[1.06] tracking-tight text-slate-950 font-display sm:text-5xl lg:text-6xl">
            Cross-border transfers with vault-grade controls.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Send XLM and USDC on Stellar, manage shared custody approvals, and monitor platform activity from one focused product workspace.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <WalletConnect />
            <Link
              href="/admin"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950"
            >
              View admin portal
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {operatingStats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xl font-bold text-slate-950 font-display">{stat.value}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <p className="section-label">Live Workspace</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">Transfer Operations</h2>
            </div>
            <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Horizon connected
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3">
            {[
              { label: 'Available XLM', value: '8,420.50', icon: Clock3 },
              { label: 'USDC Balance', value: '$3,180.00', icon: Landmark },
              { label: 'Pending Reviews', value: '3', icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <Icon className="mb-4 h-5 w-5 text-accent" aria-hidden="true" />
                  <p className="text-2xl font-bold text-slate-950 font-display">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="px-5 pb-5">
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.9fr] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <span>Flow</span>
                <span>Route</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              {transferRows.map((row) => (
                <div
                  key={row.name}
                  className="grid grid-cols-[1.2fr_1fr_0.8fr_0.9fr] items-center border-t border-slate-200 px-4 py-4 text-sm"
                >
                  <span className="font-semibold text-slate-950">{row.name}</span>
                  <span className="text-slate-500">{row.route}</span>
                  <span className="font-mono text-slate-700">{row.amount}</span>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <LockKeyhole className="h-5 w-5 text-slate-500" aria-hidden="true" />
              HTTP-only sessions and signed wallet challenges
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <ShieldCheck className="h-5 w-5 text-slate-500" aria-hidden="true" />
              Co-signer approvals before vault execution
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
