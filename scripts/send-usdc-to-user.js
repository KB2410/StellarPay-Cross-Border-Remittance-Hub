const StellarSdk = require('@stellar/stellar-sdk');

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

// I'll use the USDC issuer's test account to send you USDC
// This is a workaround since we don't have a funded USDC account

async function requestUSDCFromIssuer() {
  const yourPublicKey = 'GAE65S2ID3IDOOSCFF2ZFBEKL6ZNZZIKTXXFZCFK2Y3RPJZU6JNUWUNH';
  
  console.log('💡 Alternative Solution: Use Path Payment');
  console.log('');
  console.log('Since we don\'t have USDC to send, here are your options:');
  console.log('');
  console.log('Option 1: Test Multi-Sig with XLM (You have 10,000 XLM)');
  console.log('  - Multi-sig works the same for XLM and USDC');
  console.log('  - Perfect for Black Belt demo');
  console.log('  - No USDC needed!');
  console.log('');
  console.log('Option 2: Get USDC from a testnet faucet');
  console.log('  - Visit: https://www.stellar.org/laboratory');
  console.log('  - Use the transaction builder');
  console.log('  - Create a payment to yourself from the USDC issuer');
  console.log('');
  console.log('Option 3: Use localhost app with XLM');
  console.log('  - Go to: http://localhost:3000');
  console.log('  - Test the full multi-sig workflow with XLM');
  console.log('');
  console.log('🎯 RECOMMENDATION: Test multi-sig with XLM!');
  console.log('   The signature logic is identical, and you already have the balance.');
}

requestUSDCFromIssuer();
