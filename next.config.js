/** @type {import('next').NextConfig} */
const { URL } = require('url');

function toOrigin(url) {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

const connectSrc = [
  "'self'",
  toOrigin(process.env.NEXT_PUBLIC_HORIZON_URL),
  toOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL),
  toOrigin(process.env.NEXT_PUBLIC_SENTRY_DSN),
  'https://horizon-testnet.stellar.org',
].filter(Boolean);

const scriptSrc = ["'self'", "'unsafe-inline'"];

if (process.env.NODE_ENV !== 'production') {
  scriptSrc.push("'unsafe-eval'");
}

const contentSecurityPolicy = [
  "default-src 'self'",
  `connect-src ${connectSrc.join(' ')}`,
  "font-src 'self' https://fonts.gstatic.com",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https:",
  "object-src 'none'",
  `script-src ${scriptSrc.join(' ')}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "upgrade-insecure-requests",
].join('; ');

const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },

  // Suppress punycode deprecation warning from stellar-sdk
  webpack: (config, { isServer }) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/require-addon\/lib\/node\.js/,
      },
      {
        module: /node_modules\/sodium-native\/index\.js/,
      },
    ];

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
