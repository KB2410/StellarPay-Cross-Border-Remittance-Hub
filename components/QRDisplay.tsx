'use client';

import { useState } from 'react';
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
    <div className="flex flex-col items-center gap-6">
      {/* QR Code */}
      <div className="bg-white p-4 rounded-2xl shadow-lg shadow-violet-500/10">
        <QRCodeSVG
          value={publicKey}
          size={200}
          bgColor="#ffffff"
          fgColor="#0f0f1e"
          level="H"
          includeMargin={false}
        />
      </div>

      {/* Public Key Display */}
      <div className="w-full max-w-md">
        <label className="block text-sm font-medium text-gray-400 mb-2 text-center">
          Your Stellar Address
        </label>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 break-all font-mono text-sm text-gray-300 text-center">
          {publicKey}
        </div>
      </div>

      {/* Copy Button */}
      <button
        onClick={copyAddress}
        className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
          copied
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30'
        }`}
      >
        {copied ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Address
          </>
        )}
      </button>
    </div>
  );
}
