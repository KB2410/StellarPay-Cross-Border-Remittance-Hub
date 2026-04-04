# StellarPay Project Structure

Clean and organized project structure for production deployment.

## 📁 Root Directory

```
StellarPay-Cross-Border-Remittance-Hub/
├── app/                          # Next.js 14 App Router pages
├── components/                   # React components
├── lib/                          # Core utilities and helpers
├── scripts/                      # Utility scripts
├── screenshots/                  # Project screenshots
├── types/                        # TypeScript type definitions
├── .env.local                    # Environment variables (not in git)
├── .gitignore                    # Git ignore rules
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── postcss.config.js             # PostCSS configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── supabase-schema.sql           # Database schema
├── sentry.client.config.ts       # Sentry client config
├── sentry.server.config.ts       # Sentry server config
└── Documentation files (see below)
```

---

## 📄 Documentation Files

### Essential Documentation
- **README.md** - Main project documentation and setup guide
- **TECHNICAL_DOCS.md** - Technical architecture and implementation details
- **USER_GUIDE.md** - End-user instructions
- **SECURITY.md** - Security considerations and best practices
- **TESTING.md** - Comprehensive testing guide
- **API_DOCUMENTATION.md** - API reference and examples

### Black Belt Submission
- **BLACK_BELT_SUMMARY.md** - Submission checklist and proof
- **MULTISIG_GUIDE.md** - Multi-signature implementation guide
- **MULTISIG_QUICKSTART.md** - Quick start for multi-sig features

### Project Management
- **CHANGELOG.md** - Version history and changes
- **USER_FEEDBACK.md** - User testimonials and feedback

---

## 📂 Directory Details

### `/app` - Next.js Pages
```
app/
├── admin/
│   └── page.tsx              # Admin metrics dashboard
├── api/
│   ├── health/
│   │   └── route.ts          # Health check endpoint
│   ├── metrics/
│   │   └── route.ts          # Metrics API
│   └── multisig/
│       └── route.ts          # Multi-sig transaction API
├── approvals/
│   └── page.tsx              # Pending approvals page
├── dashboard/
│   └── page.tsx              # User dashboard
├── history/
│   └── page.tsx              # Transaction history
├── receive/
│   └── page.tsx              # Receive USDC page
├── send/
│   └── page.tsx              # Send USDC page
├── setup/
│   └── page.tsx              # USDC trustline setup
├── vault/
│   └── page.tsx              # Multi-sig vault creation
├── globals.css               # Global styles
├── icon.svg                  # App favicon
├── layout.tsx                # Root layout
└── page.tsx                  # Landing page
```

### `/components` - React Components
```
components/
├── ErrorBoundary.tsx         # Error boundary wrapper
├── MetricsChart.tsx          # Recharts visualization
├── Navbar.tsx                # Navigation bar with mobile menu
├── QRDisplay.tsx             # QR code generator
├── SendForm.tsx              # Payment form (vault-aware)
├── TransactionCard.tsx       # Transaction list item
└── WalletConnect.tsx         # Freighter wallet connection
```

### `/lib` - Core Libraries
```
lib/
├── multisig.ts               # Multi-sig vault logic
├── performance.ts            # Performance monitoring utilities
├── stellar.ts                # Stellar SDK helpers
├── supabase.ts               # Supabase client
└── validation.ts             # Input validation and sanitization
```

### `/scripts` - Utility Scripts
```
scripts/
├── add-trustline.js          # Add USDC trustline helper
├── add-usdc-trustline-freighter.js  # Freighter trustline helper
├── check-metrics.js          # Check platform metrics
├── create-demo-vault.js      # Create demo vault for testing
├── send-test-usdc.js         # Send test USDC
├── send-usdc-to-user.js      # Send USDC to specific user
├── setup-test-recipient.js   # Setup test recipient account
├── test-multisig-flow.js     # Test complete multi-sig flow
└── validate-env.js           # Validate environment setup
```

### `/screenshots` - Project Screenshots
```
screenshots/
├── .gitkeep                  # Keep folder in git
├── admin-dashboard.png       # Admin dashboard screenshot
└── sentry_monitoring.png     # Sentry monitoring screenshot
```

### `/types` - TypeScript Types
```
types/
└── index.ts                  # Shared type definitions
```

---

## 🔧 Configuration Files

### Next.js Configuration
- **next.config.js** - Next.js settings, Sentry integration
- **next-env.d.ts** - Next.js type definitions (auto-generated)

### Styling Configuration
- **tailwind.config.js** - Tailwind CSS customization
- **postcss.config.js** - PostCSS plugins
- **app/globals.css** - Global styles and CSS variables

### TypeScript Configuration
- **tsconfig.json** - TypeScript compiler options (strict mode enabled)

### Database
- **supabase-schema.sql** - Complete database schema with RLS policies

### Monitoring
- **sentry.client.config.ts** - Sentry client-side configuration
- **sentry.server.config.ts** - Sentry server-side configuration

---

## 🚫 Ignored Files (.gitignore)

The following are automatically ignored:
- `node_modules/` - Dependencies
- `.next/` - Build output
- `.env*.local` - Environment variables
- `*.tsbuildinfo` - TypeScript build cache
- `.DS_Store` - macOS system files
- `.vscode/` - IDE settings

---

## 📦 Dependencies (package.json)

### Production Dependencies
- **next** - React framework
- **react** & **react-dom** - UI library
- **@stellar/stellar-sdk** - Stellar blockchain SDK
- **@stellar/freighter-api** - Freighter wallet integration
- **@supabase/supabase-js** - Database client
- **@sentry/nextjs** - Error monitoring
- **tailwindcss** - CSS framework
- **recharts** - Chart library
- **qrcode.react** - QR code generator

### Development Dependencies
- **typescript** - Type checking
- **@types/node**, **@types/react** - Type definitions
- **eslint** - Code linting

---

## 🎯 Key Features by Directory

### Authentication & Wallet
- `/components/WalletConnect.tsx` - Freighter-only authentication
- `/lib/stellar.ts` - Wallet connection helpers

### Payments
- `/app/send/page.tsx` - Send USDC interface
- `/app/receive/page.tsx` - Receive USDC with QR
- `/components/SendForm.tsx` - Payment form logic

### Multi-Signature
- `/app/vault/page.tsx` - Vault creation
- `/app/approvals/page.tsx` - Transaction approval
- `/lib/multisig.ts` - Multi-sig logic
- `/app/api/multisig/route.ts` - Backend API

### Monitoring & Metrics
- `/app/admin/page.tsx` - Admin dashboard
- `/app/api/metrics/route.ts` - Metrics API
- `/lib/performance.ts` - Performance tracking

### Security
- `/lib/validation.ts` - Input validation
- `/components/ErrorBoundary.tsx` - Error handling
- `SECURITY.md` - Security documentation

---

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your values
   ```

3. **Validate setup:**
   ```bash
   npm run validate-env
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

---

## 📊 File Count Summary

- **Pages:** 9 routes
- **Components:** 7 reusable components
- **Libraries:** 5 utility modules
- **Scripts:** 9 helper scripts
- **Documentation:** 11 markdown files
- **Configuration:** 8 config files

**Total:** Clean, organized, production-ready structure ✅

---

## 🔗 Related Documentation

- [README.md](./README.md) - Main documentation
- [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md) - Technical details
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference
- [TESTING.md](./TESTING.md) - Testing guide

---

**Last Updated:** April 4, 2026

**Status:** Production-Ready ✅
