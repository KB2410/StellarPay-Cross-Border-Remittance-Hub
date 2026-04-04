# 🛠 Technical Documentation: StellarPay Remittance Hub

## 1. System Architecture

StellarPay is a decentralized finance (DeFi) application built on the **Stellar Network** using a modern full-stack architecture.

### High-Level Architecture
- **Frontend**: Next.js 14 (App Router) with React Server Components for optimized loading.
- **State Management**: React `useState`/`useEffect` for local UI state; localStorage for persistent wallet session management.
- **Backend Service Layer**: Next.js API Routes (Server-side) handle sensitive operations like metrics aggregation and multi-sig queue management.
- **Data Persistence**: Supabase (PostgreSQL) acts as an availability layer for data not natively stored on-chain (e.g., pending XDRs, user metadata, and custom transaction indexing).
- **Blockchain Interface**: `@stellar/stellar-sdk` communicating with the Stellar Horizon Testnet API.

---

## 2. Stellar Blockchain Integration

### Account Management
- **Freighter Integration**: Uses `@stellar/freighter-api` to request user access and sign transactions without exposing secret keys. All users must have Freighter wallet installed.
- **Security**: Secret keys never leave the Freighter extension, providing hardware-level security for user funds.

### Transaction Lifecycle
1. **Building**: Transactions are constructed using the `TransactionBuilder` with a 30-second timeout.
2. **Signing**: 
   - Non-multisig: Signed immediately via Freighter or local keypair.
   - Multisig: Only the first signature is applied; the raw XDR is then serialized.
3. **Submission**: Fully signed transactions are submitted via `server.submitTransaction(transaction)`.

---

## 3. Multi-Signature (Vault) Protocol

StellarPay implements a **2-of-2 Threshold Signature** scheme leveraging Stellar's native `setOptions` operation.

### Phase 1: Setup (`/vault`)
To convert a standard account into a vault, the application executes a `setOptions` operation that:
- Adds the co-signer as a new signer with weight 1.
- Sets the `masterWeight` to 1.
- Raises the `med_threshold` and `high_threshold` to **2**.
- This ensures no funds can leave the account without both signatures.

### Phase 2: The Pending Queue (`/api/multisig`)
Since the Stellar network requires fully signed transactions before processing, StellarPay uses an "Out-of-Band" coordination mechanism:
- Part-signed XDRs are stored in the `pending_transactions` table in Supabase.
- These XDRs are base64-encoded strings containing all transaction details but lacking the final signature.

### Phase 3: Finalization (`/approvals`)
- The co-signer retrieves the pending XDR.
- The app uses `new Transaction(xdr, networkPassphrase)` to decode and display the transaction details (Recipient, Amount, Memo) to the co-signer.
- Once the co-signer clicks "Approve", the final signature is appended, and the transaction is submitted to the network.

---

## 4. Data Indexing & Persistence

While the Stellar ledger is the source of truth, StellarPay utilizes Supabase to provide a faster, more flexible user experience:
- **Transaction Indexing**: Successful payments are logged to the `transactions` table to allow for immediate filtering and search without repeatedly querying Horizon.
- **Real-time Metrics**: User activity (DAU) and volume are calculated via SQL aggregations in the `metrics` API, enabling the Admin Dashboard.
- **Availability**: Supabase ensures that pending multi-sig transactions remain reachable even if the user closes their browser.

---

## 5. Security Engineering

### Frontend Security
- **Strict Content Security Policy (CSP)**: Managed via Next.js headers.
- **No Secret Storage**: Local keys are only kept in memory during the session and are never transmitted to any server.
- **freighter-api**: Preferred over local keys to ensure keys never leave the hardware/extension.

### Database Security (Supabase RLS)
- **Row-Level Security (RLS)** is enabled on all tables.
- **Service Role Access**: Metrics/Health APIs use the `SUPABASE_SERVICE_ROLE_KEY` for read-only aggregation.
- **Anon Access**: Client-side queries are restricted by API keys and enforced via RLS policies.

---

## 6. Observability & Monitoring

### Sentry Integration
- **Client-side**: Tracks React rendering errors and network failures.
- **Server-side**: Monitors API route latency and 500-level errors.
- **Session Replays**: Enabled to allow developers to visually inspect how users encountered an error.
- **Tunneling**: Sentry requests are tunneled through the Next.js API to prevent ad-blockers from stripping telemetry.
