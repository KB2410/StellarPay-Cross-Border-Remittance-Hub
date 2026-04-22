import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { WALLET_SESSION_COOKIE, verifyWalletSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const walletSession = cookieStore.get(WALLET_SESSION_COOKIE)?.value;

  if (!walletSession) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const session = verifyWalletSession(walletSession);

  if (!session) {
    cookieStore.delete(WALLET_SESSION_COOKIE);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    walletAddress: session.walletAddress,
  });
}
