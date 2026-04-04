const StellarSdk = require('@stellar/stellar-sdk');

const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const YOUR_PUBLIC_KEY = 'GAE65S2ID3IDOOSCFF2ZFBEKL6ZNZZIKTXXFZCFK2Y3RPJZU6JNUWUNH';

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

async function buildTrustlineXDR() {
  try {
    console.log('🔗 Building USDC trustline transaction for your account...');
    console.log('Account:', YOUR_PUBLIC_KEY);
    console.log('');

    const account = await server.loadAccount(YOUR_PUBLIC_KEY);
    const usdcAsset = new StellarSdk.Asset('USDC', USDC_ISSUER);

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: usdcAsset,
        })
      )
      .setTimeout(180)
      .build();

    const xdr = transaction.toXDR();
    
    console.log('✅ Transaction XDR generated!');
    console.log('');
    console.log('📋 Copy this XDR and sign it with Freighter:');
    console.log('');
    console.log(xdr);
    console.log('');
    console.log('🔧 Steps to sign with Freighter:');
    console.log('1. Open browser console (F12)');
    console.log('2. Paste this code:');
    console.log('');
    console.log(`const xdr = "${xdr}";`);
    console.log('(await import("@stellar/freighter-api")).signTransaction(xdr, { networkPassphrase: "Test SDF Network ; September 2015" }).then(signedXdr => {');
    console.log('  fetch("https://horizon-testnet.stellar.org/transactions", {');
    console.log('    method: "POST",');
    console.log('    headers: { "Content-Type": "application/x-www-form-urlencoded" },');
    console.log('    body: `tx=${encodeURIComponent(signedXdr)}`');
    console.log('  }).then(r => r.json()).then(console.log);');
    console.log('});');
    console.log('');
    console.log('3. Press Enter and approve in Freighter');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

buildTrustlineXDR();
