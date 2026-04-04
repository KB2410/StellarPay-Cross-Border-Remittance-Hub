#!/usr/bin/env node

/**
 * Quick script to check StellarPay metrics from Supabase
 * Run with: node scripts/check-metrics.js
 */

const fs = require('fs');
const path = require('path');

// Load .env.local file
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!');
    console.error('Expected location:', envPath);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Make sure .env.local is present with:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function checkMetrics() {
  console.log('🔍 Checking StellarPay Metrics...\n');

  try {
    // Check users count
    const usersRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=count`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    
    const usersCount = usersRes.headers.get('content-range')?.split('/')[1] || '0';
    console.log(`👥 Total Users: ${usersCount}`);

    // Check transactions count
    const txRes = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=count`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    
    const txCount = txRes.headers.get('content-range')?.split('/')[1] || '0';
    console.log(`💸 Total Transactions: ${txCount}`);

    // Check pending transactions
    const pendingRes = await fetch(`${SUPABASE_URL}/rest/v1/pending_transactions?select=count&status=eq.pending`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    
    const pendingCount = pendingRes.headers.get('content-range')?.split('/')[1] || '0';
    console.log(`⏳ Pending Multisig Transactions: ${pendingCount}`);

    // Check recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?select=count&last_active_at=gte.${yesterday}`,
      {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Prefer': 'count=exact'
        }
      }
    );
    
    const dauCount = recentRes.headers.get('content-range')?.split('/')[1] || '0';
    console.log(`📊 Daily Active Users (24h): ${dauCount}`);

    console.log('\n✅ Metrics check complete!');
    
    // Submission readiness check
    console.log('\n📋 Submission Readiness:');
    const userNum = parseInt(usersCount);
    if (userNum >= 30) {
      console.log('  ✅ User count requirement met (30+)');
    } else {
      console.log(`  ⚠️  Need ${30 - userNum} more users (currently ${userNum}/30)`);
    }

  } catch (error) {
    console.error('❌ Error fetching metrics:', error.message);
    process.exit(1);
  }
}

checkMetrics();
