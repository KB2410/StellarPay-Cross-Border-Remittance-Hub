const StellarSdk = require('@stellar/stellar-sdk');

// Recipient account details
const recipientPublicKey = 'GADELLVYEQTYM2OBZZXBZR2THAFCGYUUXY7DCLCZFBG7SPL3YSDJQTLO';

// USDC issuer on testnet
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

async function addUSDCTrustline() {
  console.log('⚠️  This script requires the recipient account secret key to add trustline.');
  console.log('Since we only have the public key, the recipient needs to add the trustline themselves.\n');
  
  console.log('📋 Instructions for recipient:');
  console.log('1. Open Freighter wallet');
  console.log('2. Go to Settings → Manage Assets');
  console.log('3. Click "Add Asset"');
  console.log('4. Enter:');
  console.log('   - Asset Code: USDC');
  console.log(`   - Issuer: ${USDC_ISSUER}`);
  console.log('5. Click "Add"\n');
  
  console.log('Or use Stellar Laboratory:');
  console.log('https://laboratory.stellar.org/#txbuilder?network=test');
  console.log('\nAccount:', recipientPublicKey);
}

addUSDCTrustline();
