'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface QRDisplayProps {
  publicKey: string;
}

export default function QRDisplay({ publicKey }: QRDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-center">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <QRCodeSVG
          value={publicKey}
          size={220}
          bgColor="#ffffff"
          fgColor="#172033"
          level="H"
          includeMargin={false}
          className="h-auto w-full"
        />
      </div>

      <div>
        <p className="section-label">Wallet Address</p>
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-sm font-semibold text-slate-950 break-all">
          {publicKey}
        </div>

        <button
          onClick={copyAddress}
          className={`mt-4 inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ${
            copied
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'btn-secondary'
          }`}
        >
          {copied ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
          {copied ? 'Copied' : 'Copy Address'}
        </button>
      </div>
    </div>
  );
}
