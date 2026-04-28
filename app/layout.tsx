import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import ErrorBoundary from '@/components/ErrorBoundary';
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'StellarPay — Cross-Border Remittance Hub',
  description:
    'Send money across borders instantly with Stellar blockchain. Multi-signature vaults, USDC payments, and institutional-grade security.',
  keywords: ['stellar', 'remittance', 'USDC', 'blockchain', 'multi-sig', 'payments'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ErrorBoundary>
          <Navbar />
          <main className="flex-1">{children}</main>
          <SpeedInsights />
          <Analytics />
        </ErrorBoundary>
      </body>
    </html>
  );
}
