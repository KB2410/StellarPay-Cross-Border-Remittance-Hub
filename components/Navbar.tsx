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
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0b14]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Brand ─────────────────────────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg"
            aria-label="StellarPay home"
          >
            {/* Logo mark with hover glow */}
            <div className="transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(139,92,246,0.6)]">
              <Logo size={34} />
            </div>

            {/* Wordmark */}
            <div className="flex flex-col leading-none">
              <span className="text-[17px] font-bold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
                StellarPay
              </span>
              <span className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">
                Remittance Hub
              </span>
            </div>
          </Link>

          {/* ── Desktop nav ───────────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Mobile hamburger ──────────────────────────────────────── */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
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
          <div className="md:hidden py-3 border-t border-white/[0.06]">
            <div className="grid grid-cols-2 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
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
