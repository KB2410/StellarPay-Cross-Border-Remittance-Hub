import { NextResponse } from 'next/server';

export async function GET() {
  const checks: Record<string, string> = {};

  // Check Horizon connectivity
  try {
    const horizonUrl =
      process.env.NEXT_PUBLIC_HORIZON_URL ||
      'https://horizon-testnet.stellar.org';
    const res = await fetch(horizonUrl, { cache: 'no-store' });
    checks.horizon = res.ok ? 'connected' : 'error';
  } catch {
    checks.horizon = 'error';
  }

  // Check Supabase connectivity
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && supabaseUrl !== 'xxx') {
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`,
        },
        cache: 'no-store',
      });
      checks.supabase = res.ok ? 'connected' : 'error';
    } else {
      checks.supabase = 'not_configured';
    }
  } catch {
    checks.supabase = 'error';
  }

  const allHealthy = Object.values(checks).every(
    (v) => v === 'connected' || v === 'not_configured'
  );

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
