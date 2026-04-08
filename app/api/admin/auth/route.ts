import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const ADMIN_WALLET_ADDRESS = process.env.ADMIN_WALLET_ADDRESS;
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json();

    if (!ADMIN_WALLET_ADDRESS) {
      return NextResponse.json(
        { error: 'Admin wallet not configured' },
        { status: 500 }
      );
    }

    if (!walletAddress || walletAddress !== ADMIN_WALLET_ADDRESS) {
      return NextResponse.json(
        { error: 'Unauthorized wallet address' },
        { status: 401 }
      );
    }

    // Generate session token
    const token = generateToken();
    const expiresAt = Date.now() + TOKEN_EXPIRY;

    // Set http-only cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY / 1000,
      path: '/',
    });

    // Store token with wallet address for validation
    cookieStore.set('admin_token', `${token}:${expiresAt}:${walletAddress}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY / 1000,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
