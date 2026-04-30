import Link from 'next/link';
import WalletConnect from '@/components/WalletConnect';
import Logo from '@/components/Logo';

export default function LandingPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] mix-blend-screen animate-float pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-accent-cyan/10 rounded-full blur-[128px] mix-blend-screen animate-float pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo mark above headline */}
          <div className="flex justify-center mb-10 animate-float">
            <div className="relative">
              <div className="absolute inset-0 bg-accent blur-xl opacity-50 rounded-full" />
              <Logo size={80} />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            <span className="text-sm text-gray-300 font-medium tracking-wide">
              Live on Stellar Testnet
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-white font-display">
            Institutional-Grade <br />
            <span className="text-gradient">Cross-Border Payments</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Settle USDC remittances globally on the Stellar network in seconds. 
            Secure your assets with multi-signature vaults. No intermediaries, no delays.
          </p>

          {/* Wallet Connect */}
          <div className="flex justify-center">
            <WalletConnect />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-24">
            {[
              { value: '< 5s', label: 'Global Settlement' },
              { value: '$0.001', label: 'Average Network Fee' },
              { value: '2-of-2', label: 'Multi-Sig Custody' },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-6 text-center transform transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-accent/50">
                <p className="text-3xl font-bold text-white font-display mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-accent-cyan font-medium uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 border-y border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">Platform Features</h2>
            <p className="text-gray-400 mt-4 text-lg">Built for scale, security, and speed.</p>
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
                className="structured-card p-8 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-accent/10 rounded-full blur-xl group-hover:bg-accent/20 transition-colors duration-500" />
                <div className="relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent-cyan/20 border border-accent/30 text-accent-cyan flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(6,182,212,0.15)] group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="relative z-10 text-xl font-semibold text-white mb-3 font-display">
                  {feature.title}
                </h3>
                <p className="relative z-10 text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-white/5 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size={24} />
            <p className="text-sm text-gray-500 font-medium">
              © 2026 StellarPay.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-medium text-gray-500 hover:text-white transition-colors">
              Admin Portal
            </Link>
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-500 hover:text-white transition-colors"
            >
              Stellar Network
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
