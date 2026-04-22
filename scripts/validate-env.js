#!/usr/bin/env node

/**
 * Environment Validation Script for StellarPay
 * Validates all required environment variables and connections
 */

const https = require('https');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvVar(name, required = true) {
  const value = process.env[name];
  if (!value) {
    if (required) {
      log(`✗ ${name} is missing (required)`, 'red');
      return false;
    } else {
      log(`⚠ ${name} is missing (optional)`, 'yellow');
      return true;
    }
  }
  log(`✓ ${name} is set`, 'green');
  return true;
}

function checkPublicKey(name, value) {
  if (!value) {
    return false;
  }

  const looksValid = value.startsWith('G') && value.length === 56;

  if (!looksValid) {
    log(`✗ ${name} is not a valid Stellar public key`, 'red');
    return false;
  }

  log(`✓ ${name} format is valid`, 'green');
  return true;
}

function checkAdminPasswordConfig() {
  const password = process.env.ADMIN_PORTAL_PASSWORD;
  const passwordHash = process.env.ADMIN_PORTAL_PASSWORD_HASH;

  if (passwordHash) {
    const looksValid = /^[a-f0-9]{64}$/i.test(passwordHash.trim());

    if (!looksValid) {
      log(
        '✗ ADMIN_PORTAL_PASSWORD_HASH must be a 64-character SHA-256 hex hash',
        'red'
      );
      return false;
    }

    log('✓ ADMIN_PORTAL_PASSWORD_HASH is set', 'green');
    return true;
  }

  if (password) {
    if (password.length < 12) {
      log(
        '⚠ ADMIN_PORTAL_PASSWORD is set but is shorter than 12 characters',
        'yellow'
      );
    } else {
      log('✓ ADMIN_PORTAL_PASSWORD is set', 'green');
    }
    return true;
  }

  if (process.env.ADMIN_AUTH_SECRET) {
    log(
      '⚠ ADMIN_PORTAL_PASSWORD is not set. The portal will fall back to ADMIN_AUTH_SECRET.',
      'yellow'
    );
    return true;
  }

  log(
    '✗ ADMIN_PORTAL_PASSWORD, ADMIN_PORTAL_PASSWORD_HASH, or ADMIN_AUTH_SECRET is missing (required)',
    'red'
  );
  return false;
}

async function testHorizonConnection(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        log(`✓ Horizon connection successful (${url})`, 'green');
        resolve(true);
      } else {
        log(`✗ Horizon connection failed (status: ${res.statusCode})`, 'red');
        resolve(false);
      }
    }).on('error', (err) => {
      log(`✗ Horizon connection error: ${err.message}`, 'red');
      resolve(false);
    });
  });
}

async function testSupabaseConnection(url, serviceKey) {
  return new Promise((resolve) => {
    const options = {
      method: 'GET',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    };

    https.get(`${url}/rest/v1/`, options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        log(`✓ Supabase connection successful (service role)`, 'green');
        resolve(true);
      } else {
        log(
          `✗ Supabase connection failed (status: ${res.statusCode})`,
          'red'
        );
        resolve(false);
      }
    }).on('error', (err) => {
      log(`✗ Supabase connection error: ${err.message}`, 'red');
      resolve(false);
    });
  });
}

async function main() {
  log('\n🔍 StellarPay Environment Validation\n', 'cyan');

  // Load .env.local if it exists
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch {
    // dotenv not installed, continue with process.env
  }

  let allValid = true;

  // Check required environment variables
  log('📋 Checking Environment Variables:\n', 'blue');
  
  allValid &= checkEnvVar('NEXT_PUBLIC_STELLAR_NETWORK');
  allValid &= checkEnvVar('NEXT_PUBLIC_HORIZON_URL');
  allValid &= checkEnvVar('NEXT_PUBLIC_USDC_ISSUER');
  allValid &= checkEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  allValid &= checkEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  allValid &= checkEnvVar('SUPABASE_SERVICE_ROLE_KEY');
  allValid &= checkEnvVar('ADMIN_WALLET_ADDRESS');
  allValid &= checkEnvVar('ADMIN_AUTH_SECRET');
  allValid &= checkEnvVar('AUTH_CHALLENGE_SOURCE_PUBLIC_KEY');
  allValid &= checkAdminPasswordConfig();
  
  // Optional variables
  checkEnvVar('NEXT_PUBLIC_SENTRY_DSN', false);

  // Test connections
  log('\n🌐 Testing Connections:\n', 'blue');

  const horizonUrl = process.env.NEXT_PUBLIC_HORIZON_URL;
  if (horizonUrl) {
    allValid &= await testHorizonConnection(horizonUrl);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseServiceKey) {
    allValid &= await testSupabaseConnection(supabaseUrl, supabaseServiceKey);
  }

  // Validate Stellar network
  log('\n⚙️  Validating Configuration:\n', 'blue');
  
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK;
  if (network === 'TESTNET' || network === 'PUBLIC') {
    log(`✓ Stellar network is valid: ${network}`, 'green');
  } else {
    log(`✗ Invalid Stellar network: ${network} (must be TESTNET or PUBLIC)`, 'red');
    allValid = false;
  }

  // Validate USDC issuer format
  const usdcIssuer = process.env.NEXT_PUBLIC_USDC_ISSUER;
  allValid &= checkPublicKey('NEXT_PUBLIC_USDC_ISSUER', usdcIssuer);
  allValid &= checkPublicKey(
    'AUTH_CHALLENGE_SOURCE_PUBLIC_KEY',
    process.env.AUTH_CHALLENGE_SOURCE_PUBLIC_KEY
  );
  allValid &= checkPublicKey(
    'ADMIN_WALLET_ADDRESS',
    process.env.ADMIN_WALLET_ADDRESS
  );

  if (
    process.env.ADMIN_AUTH_SECRET &&
    process.env.ADMIN_AUTH_SECRET === process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    log(
      '⚠ ADMIN_AUTH_SECRET matches SUPABASE_SERVICE_ROLE_KEY. Use a dedicated auth secret in production.',
      'yellow'
    );
  }

  // Final result
  log('\n' + '='.repeat(50) + '\n', 'cyan');
  
  if (allValid) {
    log('✅ All checks passed! Environment is ready.\n', 'green');
    process.exit(0);
  } else {
    log('❌ Some checks failed. Please fix the issues above.\n', 'red');
    process.exit(1);
  }
}

main().catch((err) => {
  log(`\n❌ Validation script error: ${err.message}\n`, 'red');
  process.exit(1);
});
