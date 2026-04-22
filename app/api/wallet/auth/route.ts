import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  SESSION_TTL_MS,
  WALLET_CHALLENGE_COOKIE,
  WALLET_SESSION_COOKIE,
  createSessionToken,
  verifySignedChallenge,
} from '@/lib/auth';
import { enforceRateLimit, getRequestIpHash } from '@/lib/rate-limit';
import { logSecurityEvent } from '@/lib/security-audit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rateLimitResponse = enforceRateLimit(request, 'wallet-auth', {
      max: 10,
      windowMs: 10 * 60_000,
    });

    if (rateLimitResponse) {
      await logSecurityEvent({
        action: 'wallet_auth_rate_limited',
        metadata: { ipHash: getRequestIpHash(request) },
        outcome: 'failure',
        request,
        route: '/api/wallet/auth',
      });
      return rateLimitResponse;
    }

    const { signedXdr } = await request.json();
    const cookieStore = await cookies();
    const challengeToken = cookieStore.get(WALLET_CHALLENGE_COOKIE)?.value;

    if (!signedXdr || !challengeToken) {
      await logSecurityEvent({
        action: 'wallet_auth_missing_payload',
        metadata: { ipHash: getRequestIpHash(request) },
        outcome: 'failure',
        request,
        route: '/api/wallet/auth',
      });
      return NextResponse.json(
        { error: 'Missing wallet challenge or signed payload' },
        { status: 400 }
      );
    }

    const verifiedChallenge = verifySignedChallenge(
      signedXdr,
      challengeToken,
      'wallet'
    );

    if (!verifiedChallenge) {
      cookieStore.delete(WALLET_CHALLENGE_COOKIE);
      await logSecurityEvent({
        action: 'wallet_auth_invalid_signature',
        metadata: { ipHash: getRequestIpHash(request) },
        outcome: 'failure',
        request,
        route: '/api/wallet/auth',
      });

      return NextResponse.json(
        { error: 'Failed to verify wallet signature' },
        { status: 401 }
      );
    }

    cookieStore.set(
      WALLET_SESSION_COOKIE,
      createSessionToken(verifiedChallenge.walletAddress, 'wallet'),
      {
        httpOnly: true,
        maxAge: SESSION_TTL_MS / 1000,
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      }
    );
    cookieStore.delete(WALLET_CHALLENGE_COOKIE);

    await logSecurityEvent({
      action: 'wallet_auth_succeeded',
      actorPublicKey: verifiedChallenge.walletAddress,
      metadata: { ipHash: getRequestIpHash(request) },
      outcome: 'success',
      request,
      route: '/api/wallet/auth',
    });

    return NextResponse.json({ success: true });
  } catch {
    await logSecurityEvent({
      action: 'wallet_auth_failed',
      metadata: { ipHash: getRequestIpHash(request) },
      outcome: 'failure',
      request,
      route: '/api/wallet/auth',
    });
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
