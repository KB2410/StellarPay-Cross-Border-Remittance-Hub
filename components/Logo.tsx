import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * StellarPay brand logo — an upward arrow with an orbital ring,
 * representing instant cross-border payments on the Stellar network.
 */
export default function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="StellarPay logo"
      role="img"
    >
      <defs>
        <linearGradient id="sp-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="sp-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="url(#sp-bg)" />

      {/* Orbital ring — represents Stellar network */}
      <ellipse
        cx="50"
        cy="50"
        rx="38"
        ry="13"
        fill="none"
        stroke="url(#sp-ring)"
        strokeWidth="2.5"
        opacity="0.55"
        transform="rotate(-30 50 50)"
      />

      {/* Upward arrow — represents sending / remittance */}
      <path
        d="M28 52 L50 26 L72 52 L58 52 L58 74 L42 74 L42 52 Z"
        fill="white"
        opacity="0.95"
      />

      {/* Accent dot at arrow tip */}
      <circle cx="50" cy="26" r="4" fill="#c4b5fd" />
    </svg>
  );
}
