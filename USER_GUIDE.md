# 📖 UI User Guide: StellarPay Remittance Hub

Welcome to StellarPay! This guide will walk you through setting up your wallet, sending payments, and managing your joint custody vault.

---

## 1. Connecting Your Wallet

StellarPay requires the **Freighter Wallet** browser extension to connect to the Stellar Testnet.

### Setup Instructions
1. Install the **[Freighter Wallet](https://www.freighter.app/)** browser extension
2. Create or import an account in Freighter
3. Switch the network in Freighter settings to **Testnet**
4. On StellarPay, click **Connect with Freighter**
5. Approve the connection request in the Freighter popup

**Note**: Make sure your Freighter wallet is funded with testnet XLM. You can get free testnet XLM from the [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator?network=test).

---

## 2. Navigating the Dashboard

Once connected, your dashboard gives you a high-level view:
- **Balance**: Shows your current XLM and USDC balances.
- **Recent Transactions**: Provides a feed of your last 10 payments.
- **Quick Actions**: Buttons to Send, Receive, or manage your Vault.

---

## 3. Sending Payments

1. Click the **Send** button on the dashboard.
2. Enter the recipient's **Public Key** (starts with 'G').
3. Enter the amount of **USDC** you wish to send.
4. (Optional) Add a **Memo** to help the recipient identify the payment.
5. Click **Send USDC**.
6. If using Freighter, a popup will appear for you to sign the transaction.

---

## 4. Setting Up a Multi-Sig Vault

A Vault converts your account into a **Joint Account**. No money can be spent without approval from *two* separate people.

1. Click the **Manage Vault** link.
2. Enter the **Public Key of your Co-signer**.
3. Click **Setup 2-of-2 Vault**.
4. **⚠️ WARNING**: This permanently modifies your account. Both you and your co-signer will now be required to sign all FUTURE payments.

---

## 5. Approving Pending Transactions

If your account is a Vault, your payments won't go through instantly. They enter a "Pending" stage.

1. Go to the **Approvals** page.
2. You will see a list of transactions awaiting signatures.
3. Click **Inspect** to see the payment details (amount, recipient).
4. Click **Sign & Execute** to finalize the transaction.
5. Once the second signature is applied, the transaction is automatically submitted to the Stellar network.

---

## 6. Receiving Payments

1. Click the **Receive** button.
2. You will see your **Public Key** and a **QR Code**.
3. Have the sender scan the QR code or copy-paste your address to receive funds.

---

## 7. Admin Dashboard (Monitoring)

If you are a platform administrator, you can view the system's health and usage metrics at:
**[Your URL]/admin**

- **System Health**: Shows if the app is successfully connected to Stellar (Horizon) and the Database (Supabase).
- **Platform Overview**: Charts showing total users, daily active users, and transaction volume.
