# Testing Guide for StellarPay

This document provides comprehensive testing instructions for all features of StellarPay.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Feature Testing](#feature-testing)
- [Multi-Signature Testing](#multi-signature-testing)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before testing, ensure you have:

1. **Freighter Wallet** installed ([freighter.app](https://www.freighter.app/))
2. **Testnet XLM** in your account (use [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator?network=test))
3. **USDC Trustline** added to your account
4. **Environment variables** configured (run `npm run validate-env`)

---

## Environment Setup

### 1. Validate Environment

```bash
npm run validate-env
```

This checks:
- All required environment variables are set
- Horizon API connection is working
- Supabase connection is working
- Configuration values are valid

### 2. Fund Test Account

Visit [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test) and:
1. Click "Generate keypair"
2. Click "Fund account with Friendbot"
3. Save your public and secret keys

### 3. Add USDC Trustline

Option A: Use StellarPay Setup Page
```
https://stellar-pay-cross-border-remittance-hub.vercel.app/setup
```

Option B: Use the HTML helper
```
Open add-usdc-trustline.html in your browser
```

Option C: Use Stellar Laboratory
1. Go to [Transaction Builder](https://laboratory.stellar.org/#txbuilder?network=test)
2. Add operation: "Change Trust"
3. Asset Code: `USDC`
4. Issuer: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
5. Sign and submit

---

## Feature Testing

### Test 1: Wallet Connection

**Steps:**
1. Go to homepage: `https://stellar-pay-cross-border-remittance-hub.vercel.app/`
2. Click "Connect with Freighter"
3. Approve connection in Freighter popup

**Expected Result:**
- Redirected to `/dashboard`
- Your public key displayed
- Balance shown

**Troubleshooting:**
- If "Freighter not found" error: Install Freighter extension
- If connection denied: Click connect again and approve

---

### Test 2: Send USDC Payment

**Prerequisites:**
- Connected wallet with USDC balance
- Recipient address with USDC trustline

**Steps:**
1. Go to `/send`
2. Enter recipient address (G...)
3. Enter amount (e.g., `10.50`)
4. Add memo (optional)
5. Click "Send USDC"
6. Approve transaction in Freighter

**Expected Result:**
- Success message with transaction hash
- Redirected to `/dashboard`
- Balance updated

**Test Cases:**
- ✓ Valid payment to existing account
- ✓ Payment with memo
- ✗ Invalid recipient address (should show error)
- ✗ Amount exceeds balance (should fail)
- ✗ Recipient without trustline (should show error)
- ✗ Send to self (should show error)

---

### Test 3: Receive USDC

**Steps:**
1. Go to `/receive`
2. Copy your public key or scan QR code
3. Share with sender

**Expected Result:**
- QR code displayed
- Public key shown with copy button
- Clicking copy shows "Copied!" message

---

### Test 4: Transaction History

**Steps:**
1. Go to `/history`
2. View all transactions
3. Click on a transaction to see details
4. Click "Export CSV" to download

**Expected Result:**
- All transactions listed (sent/received)
- Transaction details modal shows full info
- CSV file downloads with all transaction data
- Refresh button updates the list

---

### Test 5: Admin Dashboard

**Steps:**
1. Go to `/admin`
2. View metrics

**Expected Result:**
- Total users count
- Daily active users (DAU)
- Total transactions
- Transaction volume chart
- Real-time data from Supabase

---

## Multi-Signature Testing

### Test 6: Create Multi-Sig Vault

**Prerequisites:**
- Two testnet accounts (vault + co-signer)
- Both funded with XLM
- Both have USDC trustlines

**Steps:**
1. Connect with vault account
2. Go to `/vault`
3. Enter co-signer public key
4. Enter your secret key
5. Click "Create 2-of-2 Vault"

**Expected Result:**
- Success message with transaction hash
- Account converted to 2-of-2 multi-sig
- Verify on [Stellar Expert](https://stellar.expert/explorer/testnet)

**Verification:**
- Master weight: 1
- Co-signer weight: 1
- Medium threshold: 2
- High threshold: 2

**Automated Testing:**
```bash
node scripts/test-multisig-flow.js
```

---

### Test 7: Multi-Sig Payment Flow

**Steps:**

**Part A: Create Pending Transaction (Vault Owner)**
1. Connect with vault account
2. Go to `/send`
3. Enter recipient and amount
4. Click "Send USDC"
5. Approve in Freighter

**Expected Result:**
- Transaction added to pending queue
- Message: "Transaction created and pending co-signer approval"
- Redirected to `/approvals`

**Part B: Approve Transaction (Co-Signer)**
1. Disconnect vault account
2. Connect with co-signer account
3. Go to `/approvals`
4. View pending transaction details
5. Click "Sign & Execute"
6. Approve in Freighter

**Expected Result:**
- Transaction signed and submitted to Stellar
- Success message with transaction hash
- Transaction removed from pending queue
- Funds transferred to recipient

---

### Test 8: Reject Pending Transaction

**Steps:**
1. Connect with co-signer account
2. Go to `/approvals`
3. Click "Reject" on a pending transaction

**Expected Result:**
- Transaction status updated to "rejected"
- Transaction removed from pending list
- Funds remain in vault

---

## Troubleshooting

### Common Issues

#### 1. "op_no_destination" Error

**Cause:** Recipient account doesn't exist on Stellar network

**Solution:**
- Fund recipient account with Friendbot first
- Or send at least 1 XLM to create the account

#### 2. "op_src_no_trust" Error

**Cause:** Your account doesn't have USDC trustline

**Solution:**
- Go to `/setup` and add USDC trustline
- Or use `add-usdc-trustline.html`

#### 3. "op_no_trust" Error

**Cause:** Recipient doesn't have USDC trustline

**Solution:**
- Recipient must add USDC trustline first
- Share setup instructions with recipient

#### 4. "tx_insufficient_balance" Error

**Cause:** Not enough XLM for transaction fees

**Solution:**
- Ensure at least 1 XLM in account for fees
- Get more XLM from Friendbot

#### 5. Freighter Not Connecting

**Cause:** Extension not installed or not enabled

**Solution:**
- Install from [freighter.app](https://www.freighter.app/)
- Enable extension in browser
- Refresh page and try again

#### 6. Transaction Not Appearing in History

**Cause:** Horizon API delay or caching

**Solution:**
- Click "Refresh" button
- Wait 5-10 seconds for Horizon to index
- Check on Stellar Expert directly

#### 7. Multi-Sig Setup Fails

**Cause:** Invalid co-signer key or insufficient XLM

**Solution:**
- Verify co-signer public key is correct (starts with G, 56 chars)
- Ensure at least 2 XLM in account for reserves
- Check secret key matches your public key

---

## Test Accounts

For testing, you can use these demo accounts:

**Demo Vault:**
- Public: `GBCCNPNOF3C7MZWKO2PQRQW2Y7LFF2SVJQB6QYSYKRAZ3M3EJKSYSM4P`
- Secret: `SCCBE574DRP56LGIRR6QHVJL5GG72WVSHSIDGLK53AK5BFQFNEMAAIBW`

**Demo Co-Signer:**
- Public: `GAHV43H7MBATHR7ST6EHXWJH3M3I6J56QVWAXKREITZUMDZZIHYGEJBP`
- Secret: `SAJQHRQUXUPCE3PVN2N52O3EQTA4MDI3KUKORNTXUNMED3N47ZEGJZOJ`

**⚠️ WARNING:** These are public test accounts. Never use them for real funds!

---

## Automated Testing Scripts

### 1. Multi-Sig Flow Test

```bash
node scripts/test-multisig-flow.js
```

Tests complete multi-sig workflow:
- Creates vault and co-signer accounts
- Funds both accounts
- Adds USDC trustlines
- Converts to 2-of-2 vault
- Creates and signs multi-sig payment

### 2. Environment Validation

```bash
npm run validate-env
```

Validates:
- Environment variables
- Horizon connection
- Supabase connection
- Configuration values

### 3. Create Demo Vault

```bash
node scripts/create-demo-vault.js
```

Creates a demo vault with known credentials for testing.

---

## Test Checklist

Use this checklist to verify all features:

### Basic Features
- [ ] Connect Freighter wallet
- [ ] View dashboard with balance
- [ ] Send USDC payment
- [ ] Receive USDC (QR code)
- [ ] View transaction history
- [ ] Export transaction CSV
- [ ] View admin metrics

### Multi-Sig Features
- [ ] Create 2-of-2 vault
- [ ] Verify vault on Stellar Expert
- [ ] Create pending transaction
- [ ] View pending approvals
- [ ] Sign and execute transaction
- [ ] Reject pending transaction

### Error Handling
- [ ] Invalid recipient address
- [ ] Insufficient balance
- [ ] Missing trustline
- [ ] Freighter connection errors
- [ ] Network errors

### Security
- [ ] Secret keys never logged
- [ ] Input validation working
- [ ] XSS protection active
- [ ] HTTPS enforced (production)

---

## Reporting Issues

If you encounter issues:

1. Check this troubleshooting guide first
2. Verify environment with `npm run validate-env`
3. Check browser console for errors
4. Verify transaction on [Stellar Expert](https://stellar.expert/explorer/testnet)
5. Open GitHub issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser console errors
   - Transaction hash (if applicable)

---

## Additional Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Freighter Wallet Docs](https://docs.freighter.app/)
- [Stellar Laboratory](https://laboratory.stellar.org/)
- [Stellar Expert](https://stellar.expert/)
- [StellarPay Technical Docs](./TECHNICAL_DOCS.md)
- [Multi-Sig Guide](./MULTISIG_GUIDE.md)

---

**Last Updated:** April 2026

**Maintainer:** StellarPay Team
