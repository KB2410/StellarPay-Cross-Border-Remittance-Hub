'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  History,
  Home,
  Landmark,
  Menu,
  QrCode,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import Logo from '@/components/Logo';

const navLinks = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  { href: '/send', label: 'Send', icon: CreditCard },
  { href: '/receive', label: 'Receive', icon: QrCode },
  { href: '/history', label: 'History', icon: History },
  { href: '/vault', label: 'Vault', icon: ShieldCheck },
  { href: '/approvals', label: 'Approvals', icon: CheckCircle2 },
  { href: '/setup', label: 'Assets', icon: Wallet },
  { href: '/admin', label: 'Admin', icon: BarChart3 },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="StellarPay home"
          >
            <Logo size={32} />
            <div className="flex flex-col leading-tight">
              <span className="text-[17px] font-bold tracking-tight text-slate-950 font-display">
                StellarPay
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-[0.16em] uppercase">
                Remittance Hub
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:bg-white/80 hover:text-slate-950'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <Landmark className="h-4 w-4" aria-hidden="true" />
            Testnet
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute left-0 w-full border-t border-slate-200 bg-white px-4 py-3 shadow-lg lg:hidden">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border border-slate-200 bg-slate-100 text-slate-950'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
