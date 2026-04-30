'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/setup',     label: 'Setup'     },
  { href: '/send',      label: 'Send'      },
  { href: '/receive',   label: 'Receive'   },
  { href: '/vault',     label: 'Vault'     },
  { href: '/approvals', label: 'Approvals' },
  { href: '/history',   label: 'History'   },
  { href: '/admin',     label: 'Admin'     },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Brand ─────────────────────────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
            aria-label="StellarPay home"
          >
            <div className="transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
              <Logo size={32} />
            </div>

            {/* Wordmark */}
            <div className="flex flex-col leading-tight">
              <span className="text-[17px] font-bold tracking-tight text-white font-display">
                StellarPay
              </span>
              <span className="text-[10px] text-accent-cyan font-medium tracking-widest uppercase">
                Remittance Hub
              </span>
            </div>
          </Link>

          {/* ── Desktop nav ───────────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isActive
                      ? 'text-white bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 w-1/2 h-[2px] -translate-x-1/2 bg-gradient-to-r from-accent to-accent-cyan rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── Mobile hamburger ──────────────────────────────────────── */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Mobile menu ───────────────────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-white/10 bg-background/95 backdrop-blur-xl absolute w-full left-0 px-4 shadow-xl">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-white bg-accent/20 border border-accent/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
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
