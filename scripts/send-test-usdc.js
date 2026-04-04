const StellarSdk = require('@stellar/stellar-sdk');

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

// Test account with USDC (from earlier)
const senderSecret = 'SBLNOHWEDTLQBJQF5TDY26LF74O54ULYHOLC5BLTVMGLFK3JVZUJBBMC';
const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);

// Your account
const recipientPublicKey = 'GAE65S2ID3IDOOSCFF2ZFBEKL6ZNZZIKTXXFZCFK2Y3RPJZU6JNUWUNH';

async function sendTestUSDC() {
  try {
    console.log('💸 Sending 100 USDC to your account...');
    console.log('From:', senderKeypair.publicKey());
    console.log('To:', recipientPublicKey);
    console.log('');

    const account = await server.loadAccount(senderKeypair.publicKey());
    const usdcAsset = new StellarSdk.Asset('USDC', USDC_ISSUER);

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: recipientPublicKey,
          asset: usdcAsset,
          amount: '100',
        })
      )
      .setTimeout(180)
      .build();

    transaction.sign(senderKeypair);
    const result = await server.submitTransaction(transaction);

    console.log('✅ Success! 100 USDC sent to your account');
    console.log('Transaction:', `https://stellar.expert/explorer/testnet/tx/${result.hash}`);
    console.log('');
    console.log('🎉 You can now test sending USDC payments!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data?.extras?.result_codes) {
      console.error('Result codes:', error.response.data.extras.result_codes);
    }
  }
}

sendTestUSDC();
