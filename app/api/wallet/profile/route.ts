import { NextResponse } from 'next/server';
import { getWalletSession } from '@/lib/auth-session';
import { createAdminClient } from '@/lib/supabase';
import { enforceRateLimit, getRequestIpHash } from '@/lib/rate-limit';
import { logSecurityEvent } from '@/lib/security-audit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rateLimitResponse = enforceRateLimit(request, 'wallet-profile', {
      max: 20,
      windowMs: 60_000,
    });

    if (rateLimitResponse) {
      await logSecurityEvent({
        action: 'wallet_profile_rate_limited',
        metadata: { ipHash: getRequestIpHash(request) },
        outcome: 'failure',
        request,
        route: '/api/wallet/profile',
      });
      return rateLimitResponse;
    }

    const walletSession = await getWalletSession();

    if (!walletSession) {
      await logSecurityEvent({
        action: 'wallet_profile_unauthorized',
        metadata: { ipHash: getRequestIpHash(request) },
        outcome: 'failure',
        request,
        route: '/api/wallet/profile',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('users').upsert(
      {
        last_active_at: new Date().toISOString(),
        stellar_public_key: walletSession.walletAddress,
      },
      { onConflict: 'stellar_public_key' }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logSecurityEvent({
      action: 'wallet_profile_updated',
      actorPublicKey: walletSession.walletAddress,
      metadata: { ipHash: getRequestIpHash(request) },
      outcome: 'success',
      request,
      route: '/api/wallet/profile',
    });

    return NextResponse.json({ success: true });
  } catch {
    await logSecurityEvent({
      action: 'wallet_profile_update_failed',
      metadata: { ipHash: getRequestIpHash(request) },
      outcome: 'failure',
      request,
      route: '/api/wallet/profile',
    });
    return NextResponse.json(
      { error: 'Failed to save wallet profile' },
      { status: 500 }
    );
  }
}
