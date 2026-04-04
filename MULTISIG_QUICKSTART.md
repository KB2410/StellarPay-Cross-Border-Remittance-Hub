# Multi-Signature Quick Start Guide

## What is Multi-Signature?

Multi-signature (multi-sig) means that **2 people must approve** every payment. This is perfect for:
- Business accounts (owner + accountant)
- Joint accounts (partners, family)
- High-value transactions (extra security)

---

## 🚀 How to Use Multi-Sig in 3 Steps

### Step 1: Create a Vault (Account Owner)

1. **Go to the Vault page**: https://stellar-pay-cross-border-remittance-hub.vercel.app/vault

2. **Enter Co-Signer's Public Key**:
   - Ask your partner/co-signer for their Stellar public key (starts with 'G')
   - Paste it in the "Co-Signer Public Key" field

3. **Enter Your Secret Key**:
   - This is needed ONE TIME to convert your account
   - Your secret key starts with 'S'
   - ⚠️ **Warning**: This operation is irreversible!

4. **Click "Create 2-of-2 Vault"**

5. **Done!** Your account now requires 2 signatures for all payments

---

### Step 2: Send a Payment (Account Owner)

1. **Go to Send page**: https://stellar-pay-cross-border-remittance-hub.vercel.app/send

2. **Enter payment details**:
   - Recipient address
   - Amount (USDC)
   - Memo (optional)

3. **Click "Send USDC"**

4. **You'll see**: "Transaction created and pending co-signer approval"

5. **The payment is NOT sent yet** - it's waiting for your co-signer!

---

### Step 3: Approve the Payment (Co-Signer)

1. **Co-signer logs in** with their Freighter wallet

2. **Go to Approvals page**: https://stellar-pay-cross-border-remittance-hub.vercel.app/approvals

3. **Review the pending transaction**:
   - See amount, recipient, and memo
   - Make sure everything looks correct

4. **Click "Sign & Execute"**

5. **Approve in Freighter** (or enter secret key)

6. **Done!** The payment is now sent to the Stellar network

---

## 📱 Real-World Example

**Scenario**: Alice and Bob run a business together

1. **Alice creates a vault**:
   - Alice's account: `GAE65S2ID3IDOOSCFF2ZFBEKL6ZNZZIKTXXFZCFK2Y3RPJZU6JNUWUNH`
   - Bob's account (co-signer): `GBOB...`
   - Alice goes to `/vault`, enters Bob's public key, and creates the vault

2. **Alice wants to pay a supplier**:
   - Alice goes to `/send`
   - Enters supplier address and amount: 1000 USDC
   - Clicks "Send USDC"
   - Transaction is created but NOT sent

3. **Bob approves the payment**:
   - Bob logs in and goes to `/approvals`
   - Sees Alice's pending payment to the supplier
   - Reviews the details
   - Clicks "Sign & Execute"
   - Payment is now sent!

---

## ⚠️ Important Notes

### Before Creating a Vault

- ✅ Make sure you trust your co-signer
- ✅ Both parties should have access to their keys
- ✅ Test with small amounts first
- ⚠️ **This operation is IRREVERSIBLE** - you cannot undo it

### After Creating a Vault

- ❌ You CANNOT send payments alone anymore
- ✅ Every payment needs 2 signatures
- ✅ Both parties can see all pending transactions
- ✅ Either party can reject a transaction

### Security Benefits

- 🔒 No single point of failure
- 🔒 Protection against account compromise
- 🔒 Shared responsibility for funds
- 🔒 Audit trail of all approvals

---

## 🎯 Quick Reference

| Action | Who | Where | What Happens |
|--------|-----|-------|--------------|
| Create Vault | Owner | `/vault` | Account converted to 2-of-2 |
| Send Payment | Owner | `/send` | Transaction added to queue |
| Approve Payment | Co-Signer | `/approvals` | Transaction executed |
| Reject Payment | Co-Signer | `/approvals` | Transaction cancelled |

---

## 🆘 Troubleshooting

### "Freighter wallet not found"
- Install Freighter extension from freighter.app
- Refresh the page

### "Invalid co-signer address"
- Make sure the address starts with 'G'
- Check for typos
- Address should be 56 characters long

### "Transaction failed"
- Make sure both accounts have XLM for fees
- Check that recipient has USDC trustline
- Verify network connection

### "No pending approvals"
- Make sure you're logged in as the co-signer
- Check that a payment was initiated
- Refresh the page

---

## 📞 Need Help?

- **Full Documentation**: [MULTISIG_GUIDE.md](./MULTISIG_GUIDE.md)
- **Technical Details**: [TECHNICAL_DOCS.md](./TECHNICAL_DOCS.md)
- **User Guide**: [USER_GUIDE.md](./USER_GUIDE.md)
- **GitHub Issues**: https://github.com/KB2410/StellarPay-Cross-Border-Remittance-Hub/issues

---

## 🎥 Video Tutorial

[Add video tutorial link here]

---

**Ready to get started?** Go to https://stellar-pay-cross-border-remittance-hub.vercel.app/vault
