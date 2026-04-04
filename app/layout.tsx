import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'StellarPay — Cross-Border Remittance Hub',
  description:
    'Send money across borders instantly with Stellar blockchain. Multi-signature vaults, USDC payments, and institutional-grade security.',
  keywords: ['stellar', 'remittance', 'USDC', 'blockchain', 'multi-sig', 'payments'],
};

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0b14]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              StellarPay
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/send', label: 'Send' },
              { href: '/receive', label: 'Receive' },
              { href: '/vault', label: 'Vault' },
              { href: '/approvals', label: 'Approvals' },
              { href: '/history', label: 'History' },
              { href: '/admin', label: 'Admin' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
