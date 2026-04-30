import Link from 'next/link';
import WalletConnect from '@/components/WalletConnect';
import Logo from '@/components/Logo';

export default function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo mark above headline */}
          <div className="flex justify-center mb-8">
            <Logo size={64} />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-zinc-300 font-medium">
              Live on Stellar Testnet
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-zinc-50">
            Institutional-Grade <br />
            <span className="text-blue-500">Cross-Border Payments</span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Settle USDC remittances globally on the Stellar network in seconds. 
            Secure your assets with multi-signature vaults. No intermediaries, no delays.
          </p>

          {/* Wallet Connect */}
          <WalletConnect />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-24 border-t border-zinc-800 pt-12">
            {[
              { value: '< 5s', label: 'Global Settlement' },
              { value: '$0.001', label: 'Average Network Fee' },
              { value: '2-of-2', label: 'Multi-Sig Custody' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-zinc-50">
                  {stat.value}
                </p>
                <p className="text-sm text-zinc-500 mt-1 font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-zinc-900/50 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-50">Platform Features</h2>
            <p className="text-zinc-400 mt-4">Built for scale, security, and speed.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Instant Settlements',
                desc: 'Transfer USDC and XLM globally. Funds arrive in under 5 seconds with deterministic finality.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'Multi-Signature Vaults',
                desc: 'Configure accounts with M-of-N threshold signatures. Co-signers approve transactions before execution.',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'Live Auditing & Metrics',
                desc: 'Monitor platform health, track transaction volumes, and audit user activity in real-time.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="structured-card rounded-xl p-8 transition-shadow hover:shadow-lg hover:border-zinc-700"
              >
                <div className="w-12 h-12 rounded-lg bg-zinc-800 text-blue-500 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-zinc-50 mb-3">
                  {feature.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size={24} />
            <p className="text-sm text-zinc-500 font-medium">
              © 2026 StellarPay.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
              Admin Portal
            </Link>
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Stellar Network
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
