import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

    if (!adminSession) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = verifyAdminSession(adminSession);

    if (!session) {
      cookieStore.delete(ADMIN_SESSION_COOKIE);
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      walletAddress: session.walletAddress,
    });
  } catch {
    return NextResponse.json(
      { authenticated: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
