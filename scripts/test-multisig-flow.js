const StellarSdk = require('@stellar/stellar-sdk');

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

async function testMultisigFlow() {
  console.log('🧪 Testing Multi-Signature Flow\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Generate two test accounts
    console.log('\n📝 Step 1: Generating Test Accounts...');
    const vaultKeypair = StellarSdk.Keypair.random();
    const coSignerKeypair = StellarSdk.Keypair.random();
    
    console.log('Vault Account:', vaultKeypair.publicKey());
    console.log('Co-Signer Account:', coSignerKeypair.publicKey());
    
    // Step 2: Fund both accounts
    console.log('\n💰 Step 2: Funding Accounts with Friendbot...');
    await fundAccount(vaultKeypair.publicKey());
    await fundAccount(coSignerKeypair.publicKey());
    console.log('✅ Both accounts funded');
    
    // Wait for accounts to be created
    await sleep(3000);
    
    // Step 3: Add USDC trustline to vault
    console.log('\n🔗 Step 3: Adding USDC Trustline to Vault...');
    await addUSDCTrustline(vaultKeypair);
    console.log('✅ USDC trustline added');
    
    await sleep(2000);
    
    // Step 4: Convert vault to multi-sig (2-of-2)
    console.log('\n🔐 Step 4: Converting to 2-of-2 Multi-Sig Vault...');
    const setupTxHash = await setupVault(vaultKeypair, coSignerKeypair.publicKey());
    console.log('✅ Vault setup complete');
    console.log('Transaction:', `https://stellar.expert/explorer/testnet/tx/${setupTxHash}`);
    
    await sleep(2000);
    
    // Step 5: Verify vault configuration
    console.log('\n🔍 Step 5: Verifying Vault Configuration...');
    const vaultAccount = await server.loadAccount(vaultKeypair.publicKey());
    console.log('Thresholds:', {
      low: vaultAccount.thresholds.low_threshold,
      medium: vaultAccount.thresholds.med_threshold,
      high: vaultAccount.thresholds.high_threshold,
    });
    console.log('Signers:', vaultAccount.signers.map(s => ({
      key: s.key.slice(0, 8) + '...',
      weight: s.weight,
    })));
    
    // Step 6: Create a payment transaction (requires 2 signatures)
    console.log('\n💸 Step 6: Creating Multi-Sig Payment Transaction...');
    const recipientKeypair = StellarSdk.Keypair.random();
    await fundAccount(recipientKeypair.publicKey());
    await sleep(2000);
    await addUSDCTrustline(recipientKeypair);
    await sleep(2000);
    
    const paymentXdr = await buildPaymentTransaction(
      vaultKeypair.publicKey(),
      recipientKeypair.publicKey(),
      '1.0'
    );
    console.log('✅ Payment transaction built');
    
    // Step 7: Sign with vault keypair (signature 1 of 2)
    console.log('\n✍️  Step 7: Adding Signature 1 of 2 (Vault Owner)...');
    let tx = new StellarSdk.Transaction(paymentXdr, StellarSdk.Networks.TESTNET);
    tx.sign(vaultKeypair);
    console.log('✅ Vault owner signed');
    console.log('Signatures:', tx.signatures.length, '/ 2');
    
    // Step 8: Sign with co-signer (signature 2 of 2)
    console.log('\n✍️  Step 8: Adding Signature 2 of 2 (Co-Signer)...');
    tx.sign(coSignerKeypair);
    console.log('✅ Co-signer signed');
    console.log('Signatures:', tx.signatures.length, '/ 2');
    
    // Step 9: Submit transaction
    console.log('\n🚀 Step 9: Submitting Multi-Sig Transaction...');
    const result = await server.submitTransaction(tx);
    console.log('✅ Transaction executed successfully!');
    console.log('Transaction:', `https://stellar.expert/explorer/testnet/tx/${result.hash}`);
    
    // Step 10: Verify payment
    console.log('\n✅ Step 10: Verifying Payment...');
    await sleep(2000);
    const recipientAccount = await server.loadAccount(recipientKeypair.publicKey());
    const usdcBalance = recipientAccount.balances.find(
      b => b.asset_code === 'USDC' && b.asset_issuer === USDC_ISSUER
    );
    console.log('Recipient USDC Balance:', usdcBalance?.balance || '0');
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 MULTI-SIG TEST COMPLETED SUCCESSFULLY!\n');
    console.log('📋 Summary:');
    console.log(`   Vault Account: ${vaultKeypair.publicKey()}`);
    console.log(`   Co-Signer: ${coSignerKeypair.publicKey()}`);
    console.log(`   Recipient: ${recipientKeypair.publicKey()}`);
    console.log(`   Setup TX: https://stellar.expert/explorer/testnet/tx/${setupTxHash}`);
    console.log(`   Payment TX: https://stellar.expert/explorer/testnet/tx/${result.hash}`);
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

async function fundAccount(publicKey) {
  const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
  const result = await response.json();
  if (!result.successful) {
    throw new Error('Failed to fund account');
  }
}

async function addUSDCTrustline(keypair) {
  const account = await server.loadAccount(keypair.publicKey());
  const usdcAsset = new StellarSdk.Asset('USDC', USDC_ISSUER);
  
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(StellarSdk.Operation.changeTrust({ asset: usdcAsset }))
    .setTimeout(180)
    .build();
  
  tx.sign(keypair);
  await server.submitTransaction(tx);
}

async function setupVault(vaultKeypair, coSignerPublicKey) {
  const account = await server.loadAccount(vaultKeypair.publicKey());
  
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.setOptions({
        signer: { ed25519PublicKey: coSignerPublicKey, weight: 1 },
        masterWeight: 1,
        lowThreshold: 1,
        medThreshold: 2,
        highThreshold: 2,
      })
    )
    .setTimeout(180)
    .build();
  
  tx.sign(vaultKeypair);
  const result = await server.submitTransaction(tx);
  return result.hash;
}

async function buildPaymentTransaction(source, destination, amount) {
  const account = await server.loadAccount(source);
  const usdcAsset = new StellarSdk.Asset('USDC', USDC_ISSUER);
  
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination,
        asset: usdcAsset,
        amount,
      })
    )
    .setTimeout(180)
    .build();
  
  return tx.toXDR();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
testMultisigFlow();
