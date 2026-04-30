import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * StellarPay brand logo — A minimalistic, geometric 'S' mark
 * conveying speed, structure, and professional fintech reliability.
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
      <rect width="100" height="100" rx="20" fill="#2563EB" />
      <path
        d="M65 35H45C39.4772 35 35 39.4772 35 45C35 50.5228 39.4772 55 45 55H55C60.5228 55 65 59.4772 65 65C65 70.5228 60.5228 75 55 75H35"
        stroke="white"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M60 25L65 35L60 45"
        stroke="white"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
