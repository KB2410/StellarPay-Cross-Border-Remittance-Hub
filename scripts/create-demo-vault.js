const StellarSdk = require('@stellar/stellar-sdk');

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

async function createDemoVault() {
  console.log('🏗️  Creating Complete Demo Vault for Black Belt Submission\n');
  console.log('='.repeat(70));
  
  try {
    // Step 1: Generate vault account
    console.log('\n📝 Step 1: Generating Vault Account...');
    const vaultKeypair = StellarSdk.Keypair.random();
    console.log('✅ Vault Account Created');
    console.log('   Public Key:', vaultKeypair.publicKey());
    console.log('   Secret Key:', vaultKeypair.secret());
    
    // Step 2: Generate co-signer account
    console.log('\n📝 Step 2: Generating Co-Signer Account...');
    const coSignerKeypair = StellarSdk.Keypair.random();
    console.log('✅ Co-Signer Account Created');
    console.log('   Public Key:', coSignerKeypair.publicKey());
    console.log('   Secret Key:', coSignerKeypair.secret());
    
    // Step 3: Fund both accounts
    console.log('\n💰 Step 3: Funding Accounts...');
    await fundAccount(vaultKeypair.publicKey());
    await fundAccount(coSignerKeypair.publicKey());
    console.log('✅ Both accounts funded with 10,000 XLM');
    
    await sleep(3000);
    
    // Step 4: Add USDC trustline to vault
    console.log('\n🔗 Step 4: Adding USDC Trustline to Vault...');
    await addUSDCTrustline(vaultKeypair);
    console.log('✅ USDC trustline added');
    
    await sleep(2000);
    
    // Step 5: Send 100 USDC to vault (from test account)
    console.log('\n💸 Step 5: Sending 100 USDC to Vault...');
    // We'll skip this since we don't have USDC, but vault has XLM
    console.log('⚠️  Skipped - using XLM for demo instead');
    
    // Step 6: Convert to 2-of-2 multi-sig vault
    console.log('\n🔐 Step 6: Converting to 2-of-2 Multi-Sig Vault...');
    const setupTxHash = await setupVault(vaultKeypair, coSignerKeypair.publicKey());
    console.log('✅ Vault setup complete!');
    console.log('   Transaction:', `https://stellar.expert/explorer/testnet/tx/${setupTxHash}`);
    
    await sleep(2000);
    
    // Step 7: Verify configuration
    console.log('\n🔍 Step 7: Verifying Vault Configuration...');
    const vaultAccount = await server.loadAccount(vaultKeypair.publicKey());
    console.log('✅ Vault verified:');
    console.log('   Thresholds:', {
      low: vaultAccount.thresholds.low_threshold,
      medium: vaultAccount.thresholds.med_threshold,
      high: vaultAccount.thresholds.high_threshold,
    });
    console.log('   Signers:', vaultAccount.signers.length);
    
    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('🎉 DEMO VAULT READY FOR BLACK BELT SUBMISSION!\n');
    console.log('📋 Vault Details:');
    console.log('   Vault Address:', vaultKeypair.publicKey());
    console.log('   Vault Secret:', vaultKeypair.secret());
    console.log('   Co-Signer Address:', coSignerKeypair.publicKey());
    console.log('   Co-Signer Secret:', coSignerKeypair.secret());
    console.log('   Setup TX:', `https://stellar.expert/explorer/testnet/tx/${setupTxHash}`);
    console.log('   View Vault:', `https://stellar.expert/explorer/testnet/account/${vaultKeypair.publicKey()}`);
    console.log('\n📝 Save these credentials for your demo!');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Use vault secret key in your app to test payments');
    console.log('   2. Create a payment (will go to pending queue)');
    console.log('   3. Use co-signer secret key to approve');
    console.log('   4. Transaction executes with 2 signatures!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

createDemoVault();
