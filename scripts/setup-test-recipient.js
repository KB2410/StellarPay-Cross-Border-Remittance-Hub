const StellarSdk = require('@stellar/stellar-sdk');

const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

async function setupTestRecipient() {
  try {
    // Generate a new keypair
    const pair = StellarSdk.Keypair.random();
    console.log('🔑 Generated test recipient account:');
    console.log('Public Key:', pair.publicKey());
    console.log('Secret Key:', pair.secret());
    console.log('');

    // Fund the account
    console.log('💰 Funding account with Friendbot...');
    const response = await fetch(`https://friendbot.stellar.org?addr=${pair.publicKey()}`);
    const result = await response.json();
    
    if (!result.successful) {
      throw new Error('Failed to fund account');
    }
    console.log('✅ Account funded!');
    console.log('');

    // Wait a bit for the account to be created
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Add USDC trustline
    console.log('🔗 Adding USDC trustline...');
    const account = await server.loadAccount(pair.publicKey());
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

    transaction.sign(pair);
    const txResult = await server.submitTransaction(transaction);
    
    console.log('✅ USDC trustline added!');
    console.log('Transaction hash:', txResult.hash);
    console.log('');
    console.log('🎉 Test recipient is ready to receive USDC!');
    console.log('');
    console.log('📋 Use this address in your app:');
    console.log(pair.publicKey());
    console.log('');
    console.log('🔍 View on Stellar Expert:');
    console.log(`https://stellar.expert/explorer/testnet/account/${pair.publicKey()}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupTestRecipient();
