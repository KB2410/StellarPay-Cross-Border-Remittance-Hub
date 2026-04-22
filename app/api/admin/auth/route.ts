import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ADMIN_CHALLENGE_COOKIE,
  ADMIN_SESSION_COOKIE,
  SESSION_TTL_MS,
  createAdminSessionToken,
  verifySignedChallenge,
  verifyAdminPortalPassword,
} from '@/lib/auth';
import { enforceRateLimit, getRequestIpHash } from '@/lib/rate-limit';
import { logSecurityEvent } from '@/lib/security-audit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rateLimitResponse = enforceRateLimit(request, 'admin-auth', {
      max: 5,
      windowMs: 10 * 60_000,
    });

    if (rateLimitResponse) {
      await logSecurityEvent({
        action: 'admin_auth_rate_limited',
        metadata: { ipHash: getRequestIpHash(request) },
        outcome: 'failure',
        request,
        route: '/api/admin/auth',
      });
      return rateLimitResponse;
    }

    const body = await request.json();
    const cookieStore = await cookies();
    const challengeToken = cookieStore.get(ADMIN_CHALLENGE_COOKIE)?.value;
    const password = typeof body?.password === 'string' ? body.password : '';
    const signedXdr = typeof body?.signedXdr === 'string' ? body.signedXdr : '';

    if (password) {
      if (!verifyAdminPortalPassword(password)) {
        await logSecurityEvent({
          action: 'admin_auth_invalid_password',
          metadata: { ipHash: getRequestIpHash(request) },
          outcome: 'failure',
          request,
          route: '/api/admin/auth',
        });

        return NextResponse.json(
          { error: 'Invalid admin password' },
          { status: 401 }
        );
      }

      cookieStore.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
        httpOnly: true,
        maxAge: SESSION_TTL_MS / 1000,
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });
      cookieStore.delete(ADMIN_CHALLENGE_COOKIE);

      await logSecurityEvent({
        action: 'admin_auth_succeeded',
        metadata: { authMethod: 'password', ipHash: getRequestIpHash(request) },
        outcome: 'success',
        request,
        route: '/api/admin/auth',
      });

      return NextResponse.json({ success: true });
    }

    if (!signedXdr || !challengeToken) {
      await logSecurityEvent({
        action: 'admin_auth_missing_payload',
        metadata: { ipHash: getRequestIpHash(request) },
        outcome: 'failure',
        request,
        route: '/api/admin/auth',
      });
      return NextResponse.json(
        { error: 'Missing admin challenge or signed payload' },
        { status: 400 }
      );
    }

    const verifiedChallenge = verifySignedChallenge(
      signedXdr,
      challengeToken,
      'admin'
    );

    if (!verifiedChallenge) {
      cookieStore.delete(ADMIN_CHALLENGE_COOKIE);
      await logSecurityEvent({
        action: 'admin_auth_invalid_signature',
        metadata: { ipHash: getRequestIpHash(request) },
        outcome: 'failure',
        request,
        route: '/api/admin/auth',
      });

      return NextResponse.json(
        { error: 'Failed to verify admin signature' },
        { status: 401 }
      );
    }

    cookieStore.set(
      ADMIN_SESSION_COOKIE,
      createAdminSessionToken(),
      {
      httpOnly: true,
      maxAge: SESSION_TTL_MS / 1000,
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      }
    );
    cookieStore.delete(ADMIN_CHALLENGE_COOKIE);

    await logSecurityEvent({
      action: 'admin_auth_succeeded',
      actorPublicKey: verifiedChallenge.walletAddress,
      metadata: { ipHash: getRequestIpHash(request) },
      outcome: 'success',
      request,
      route: '/api/admin/auth',
    });

    return NextResponse.json({ success: true });
  } catch {
    await logSecurityEvent({
      action: 'admin_auth_failed',
      metadata: { ipHash: getRequestIpHash(request) },
      outcome: 'failure',
      request,
      route: '/api/admin/auth',
    });
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
