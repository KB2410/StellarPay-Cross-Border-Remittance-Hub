import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  CHALLENGE_TTL_MS,
  WALLET_CHALLENGE_COOKIE,
  createSignedChallenge,
} from '@/lib/auth';
import { enforceRateLimit, getRequestIpHash } from '@/lib/rate-limit';
import { logSecurityEvent } from '@/lib/security-audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, 'wallet-challenge', {
      max: 10,
      windowMs: 60_000,
    });

    if (rateLimitResponse) {
      await logSecurityEvent({
        action: 'wallet_challenge_rate_limited',
        metadata: { ipHash: getRequestIpHash(request) },
        outcome: 'failure',
        request,
        route: '/api/wallet/challenge',
      });
      return rateLimitResponse;
    }

    const walletAddress = request.nextUrl.searchParams.get('walletAddress');

    if (!walletAddress) {
      await logSecurityEvent({
        action: 'wallet_challenge_missing_wallet',
        metadata: { ipHash: getRequestIpHash(request) },
        outcome: 'failure',
        request,
        route: '/api/wallet/challenge',
      });
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const challenge = await createSignedChallenge(walletAddress, 'wallet');
    const cookieStore = await cookies();

    cookieStore.set(WALLET_CHALLENGE_COOKIE, challenge.challengeToken, {
      httpOnly: true,
      maxAge: CHALLENGE_TTL_MS / 1000,
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return NextResponse.json({
      challengeXdr: challenge.challengeXdr,
      expiresAt: challenge.expiresAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create challenge';

    await logSecurityEvent({
      action: 'wallet_challenge_failed',
      actorPublicKey: request.nextUrl.searchParams.get('walletAddress'),
      metadata: { error: message, ipHash: getRequestIpHash(request) },
      outcome: 'failure',
      request,
      route: '/api/wallet/challenge',
    });

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
