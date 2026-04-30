'use client';

import { useState } from 'react';
import Link from 'next/link';
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

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Brand ─────────────────────────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg"
            aria-label="StellarPay home"
          >
            <div className="transition-transform duration-200 group-hover:scale-105">
              <Logo size={32} />
            </div>

            {/* Wordmark */}
            <div className="flex flex-col leading-tight">
              <span className="text-[17px] font-bold tracking-tight text-zinc-50">
                StellarPay
              </span>
              <span className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase">
                Remittance Hub
              </span>
            </div>
          </Link>

          {/* ── Desktop nav ───────────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Mobile hamburger ──────────────────────────────────────── */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
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
          <div className="md:hidden py-3 border-t border-zinc-800">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-md text-sm font-medium text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
