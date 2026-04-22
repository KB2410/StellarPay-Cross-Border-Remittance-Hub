import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { WALLET_CHALLENGE_COOKIE, WALLET_SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(WALLET_SESSION_COOKIE);
  cookieStore.delete(WALLET_CHALLENGE_COOKIE);

  return NextResponse.json({ success: true });
}
