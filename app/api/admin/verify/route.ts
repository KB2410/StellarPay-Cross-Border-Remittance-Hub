import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_WALLET_ADDRESS = process.env.ADMIN_WALLET_ADDRESS;
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');

    if (!adminToken?.value) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Parse token, expiry, and wallet address
    const [token, expiresAt, walletAddress] = adminToken.value.split(':');

    if (!token || !expiresAt || !walletAddress) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    // Verify wallet address matches admin
    if (!ADMIN_WALLET_ADDRESS || walletAddress !== ADMIN_WALLET_ADDRESS) {
      // Clear invalid cookies
      cookieStore.delete('admin_session');
      cookieStore.delete('admin_token');

      return NextResponse.json(
        { authenticated: false, error: 'Unauthorized wallet' },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (Date.now() > parseInt(expiresAt, 10)) {
      // Clear expired cookies
      cookieStore.delete('admin_session');
      cookieStore.delete('admin_token');

      return NextResponse.json(
        { authenticated: false, error: 'Session expired' },
        { status: 401 }
      );
    }

    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json(
      { authenticated: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
