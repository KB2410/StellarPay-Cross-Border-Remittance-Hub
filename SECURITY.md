# 🔒 Security Documentation: StellarPay Remittance Hub

## Overview

StellarPay implements multiple layers of security to protect user funds and data. This document outlines the security measures, threat model, and best practices.

---

## 1. Threat Model

### Assets to Protect
- **User Secret Keys**: Stellar account private keys that control funds
- **Transaction Data**: Payment history and pending multisig transactions
- **User Metadata**: Email addresses, display names, and activity logs
- **Platform Integrity**: Availability and correctness of the service

### Threat Actors
- **External Attackers**: Attempting to steal funds or user data
- **Malicious Users**: Attempting to exploit the platform or other users
- **Compromised Dependencies**: Supply chain attacks via npm packages
- **Infrastructure Failures**: Vercel, Supabase, or Stellar network outages

---

## 2. Key Management

### Secret Key Handling
- **Never Stored**: Secret keys are NEVER stored anywhere in the application
- **Freighter Only**: All users must use Freighter wallet extension where keys never leave the hardware/extension
- **No Server Transmission**: Secret keys are never sent to any API endpoint
- **Hardware Security**: Freighter provides hardware-level security for all signing operations

### Testnet Accounts
- **Freighter Required**: All users must have Freighter wallet installed and configured for Testnet
- **User Responsibility**: Users must fund their own testnet accounts via Stellar Laboratory Friendbot
- **Session Persistence**: Authentication uses signed, HTTP-only cookies; localStorage only caches the public key for UX convenience

---

## 3. Transaction Security

### Input Validation
```typescript
// All Stellar addresses validated before use
StrKey.decodeEd25519PublicKey(address); // Throws if invalid

// Payment amounts validated
- Must be positive
- Maximum 6 decimal places
- Checked against available balance
```

### Multi-Signature Protection
- **2-of-2 Threshold**: Vault accounts require both signatures for any payment
- **XDR Inspection**: Co-signers can inspect full transaction details before signing
- **Atomic Execution**: Transactions either fully succeed or fully fail (no partial execution)
- **Replay Protection**: Stellar sequence numbers prevent transaction replay attacks

### Transaction Signing Flow
1. Transaction built with 30-second timeout
2. First signature applied (creator)
3. XDR serialized and stored in Supabase
4. Co-signer retrieves, inspects, and signs
5. Fully-signed transaction submitted to Stellar network

---

## 4. Database Security (Supabase)

### Row-Level Security (RLS)
All tables have RLS enabled with a deny-by-default baseline:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Block direct client reads on users"
  ON users FOR SELECT USING (false);

CREATE POLICY "Block direct client transaction reads"
  ON transactions FOR SELECT USING (false);
```

### API Key Management
- **Anon Key**: Present for client initialization only; sensitive data access is not granted to browser clients
- **Service Role Key**: Used only in trusted server-side API routes
- **Dedicated Auth Secret**: `ADMIN_AUTH_SECRET` signs app sessions independently of Supabase credentials
- **Environment Variables**: Secrets stay in `.env.local` or the hosting platform secret store and are never committed

### Audit Logging
- **Security Events**: Authentication failures, admin access, rate limiting, and sensitive transaction actions are written to `security_events`
- **Minimal PII**: Logs store public keys, route metadata, hashed IP context, and outcome details only as needed for incident response

---

## 5. Web Application Security

### HTTP Security Headers
```typescript
// next.config.ts
headers: [
  {
    key: 'X-Frame-Options',
    value: 'DENY' // Prevent clickjacking
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff' // Prevent MIME sniffing
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains' // Force HTTPS
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]
```

### Content Security Policy (CSP)
- **Script Sources**: Only trusted domains allowed
- **Style Sources**: Inline styles restricted
- **Connect Sources**: Limited to Stellar Horizon, Supabase, and Sentry

### Authentication Controls
- **Public Admin Portal**: The `/admin` page is publicly reachable, but the dashboard requires a password login
- **Portal Password Source**: The dashboard uses `ADMIN_PORTAL_PASSWORD` when set, otherwise it falls back to `ADMIN_AUTH_SECRET`
- **Signed Wallet Challenges**: Wallet sessions still require a valid Freighter-signed Stellar challenge transaction
- **HTTP-Only Sessions**: Session cookies are `httpOnly`, `sameSite=strict`, and `secure` in production
- **Route Guards**: Admin metrics and health endpoints enforce server-side authorization
- **Rate Limiting**: Auth, multisig, profile, and transaction routes are rate-limited to reduce abuse

### Input Sanitization
- All user inputs validated on both client and server
- Stellar addresses validated with SDK functions
- Amounts validated for format and range
- Memos sanitized to prevent injection attacks

---

## 6. Monitoring & Incident Response

### Sentry Integration
- **Error Tracking**: All exceptions logged with context
- **Performance Monitoring**: API latency and transaction times tracked
- **Session Replays**: Visual debugging for user-reported issues
- **Alerting**: Real-time notifications for critical errors

### Health Monitoring
```typescript
// /api/health endpoint checks:
- Stellar Horizon connectivity
- Supabase database connectivity
- Response time thresholds
```

### Incident Response Plan
1. **Detection**: Sentry alerts or user reports
2. **Assessment**: Review error logs and session replays
3. **Containment**: Disable affected features if necessary
4. **Resolution**: Deploy fix to Vercel
5. **Post-Mortem**: Document incident and prevention measures

---

## 7. Deployment Security

### Vercel Configuration
- **Environment Variables**: All secrets stored in Vercel dashboard (encrypted at rest)
- **HTTPS Only**: All traffic forced to HTTPS
- **DDoS Protection**: Vercel's built-in protection enabled
- **Application Rate Limiting**: Sensitive routes have in-app rate limits; for multi-instance deployments, move these buckets to Redis/Upstash

### Dependency Management
- **npm audit**: Run regularly to check for vulnerabilities
- **Dependabot**: Automated security updates enabled
- **Lock Files**: `package-lock.json` committed to ensure reproducible builds

---

## 8. Known Limitations & Future Improvements

### Current Limitations
- **Testnet Only**: Not audited for mainnet use
- **Freighter Required**: Users must install Freighter browser extension
- **No 2FA**: Multi-factor authentication not yet implemented
- **In-Memory Rate Limiting**: Current rate-limit buckets are process-local and should be externalized for horizontally scaled production deployments

### Planned Improvements
- [ ] Hardware wallet support (Ledger)
- [ ] Email/SMS 2FA for vault operations
- [ ] Redis/Upstash-backed distributed rate limiting
- [ ] Formal security audit before mainnet deployment
- [ ] Bug bounty program
- [ ] Additional wallet support (Albedo, Rabet)

---

## 9. Security Best Practices for Users

### For All Users
1. **Install Freighter**: Use the official Freighter wallet from freighter.app
2. **Verify Addresses**: Always double-check recipient addresses before sending
3. **Start Small**: Test with small amounts first
4. **Secure Your Device**: Keep your computer/phone secure and updated
5. **Beware Phishing**: Only use the official StellarPay URL
6. **Backup Freighter**: Securely backup your Freighter recovery phrase

### For Vault Users
1. **Trust Your Co-Signer**: Only create vaults with people you trust
2. **Inspect XDRs**: Always review transaction details before signing
3. **Secure Communication**: Coordinate with co-signer through secure channels
4. **Backup Keys**: Both signers should securely backup their keys

---

## 10. Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

**Email**: [Add your security contact email]

**Please include**:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

**We commit to**:
- Acknowledge receipt within 24 hours
- Provide a fix timeline within 72 hours
- Credit you in our security acknowledgments (if desired)

---

## 11. Compliance & Regulations

### Data Privacy
- **No PII Required**: Users can use the platform without providing personal information
- **Optional Metadata**: Email and display name are optional
- **Data Retention**: Transaction history retained for 90 days
- **Right to Deletion**: Users can request account deletion

### Financial Regulations
- **Testnet Only**: Current deployment is for testing purposes only
- **No Fiat Integration**: Platform only handles crypto-to-crypto transfers
- **KYC/AML**: Not currently implemented (required for mainnet/fiat integration)

---

**Last Updated**: April 8, 2026  
**Version**: 1.1.0
