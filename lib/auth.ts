import crypto from 'crypto';
import * as StellarSdk from '@stellar/stellar-sdk';
import { network, server } from '@/lib/stellar';

export const ADMIN_SESSION_COOKIE = 'stellarpay_admin_session';
export const WALLET_SESSION_COOKIE = 'stellarpay_wallet_session';
export const ADMIN_CHALLENGE_COOKIE = 'stellarpay_admin_challenge';
export const WALLET_CHALLENGE_COOKIE = 'stellarpay_wallet_challenge';

export const CHALLENGE_TTL_MS = 5 * 60 * 1000;
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

type AuthRole = 'admin' | 'wallet';

interface TokenPayload {
  exp: number;
  iat: number;
  role: AuthRole;
  txHash?: string;
  walletAddress: string;
}

interface ChallengeResult {
  challengeToken: string;
  challengeXdr: string;
  expiresAt: number;
}

function getAdminWalletAddress(): string {
  const adminWalletAddress = process.env.ADMIN_WALLET_ADDRESS;

  if (!adminWalletAddress) {
    throw new Error('ADMIN_WALLET_ADDRESS is not configured');
  }

  StellarSdk.StrKey.decodeEd25519PublicKey(adminWalletAddress);
  return adminWalletAddress;
}

function getAdminPortalPassword(): string {
  const adminPortalPassword =
    process.env.ADMIN_PORTAL_PASSWORD || process.env.ADMIN_AUTH_SECRET;

  if (!adminPortalPassword) {
    throw new Error(
      'ADMIN_PORTAL_PASSWORD or ADMIN_AUTH_SECRET is not configured'
    );
  }

  return adminPortalPassword;
}

function getAdminPortalPasswordHash(): string | null {
  const adminPortalPasswordHash = process.env.ADMIN_PORTAL_PASSWORD_HASH?.trim();

  if (!adminPortalPasswordHash) {
    return null;
  }

  if (!/^[a-f0-9]{64}$/i.test(adminPortalPasswordHash)) {
    throw new Error(
      'ADMIN_PORTAL_PASSWORD_HASH must be a 64-character SHA-256 hex hash'
    );
  }

  return adminPortalPasswordHash.toLowerCase();
}

function getChallengeSourcePublicKey(): string {
  const challengeSource =
    process.env.AUTH_CHALLENGE_SOURCE_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_USDC_ISSUER ||
    process.env.ADMIN_WALLET_ADDRESS;

  if (!challengeSource) {
    throw new Error(
      'AUTH_CHALLENGE_SOURCE_PUBLIC_KEY or NEXT_PUBLIC_USDC_ISSUER must be configured'
    );
  }

  StellarSdk.StrKey.decodeEd25519PublicKey(challengeSource);
  return challengeSource;
}

function getAuthSecret(): string {
  const authSecret =
    process.env.ADMIN_AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!authSecret) {
    throw new Error(
      'ADMIN_AUTH_SECRET or SUPABASE_SERVICE_ROLE_KEY must be configured'
    );
  }

  return authSecret;
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password, 'utf8').digest('hex');
}

function signPayload(payload: TokenPayload): string {
  const serializedPayload = Buffer.from(JSON.stringify(payload)).toString(
    'base64url'
  );
  const signature = crypto
    .createHmac('sha256', getAuthSecret())
    .update(serializedPayload)
    .digest('base64url');

  return `${serializedPayload}.${signature}`;
}

function verifyToken(token: string, expectedRole: AuthRole): TokenPayload | null {
  const [serializedPayload, signature] = token.split('.');

  if (!serializedPayload || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac('sha256', getAuthSecret())
    .update(serializedPayload)
    .digest('base64url');

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(serializedPayload, 'base64url').toString('utf8')
    ) as TokenPayload;

    if (payload.role !== expectedRole) {
      return null;
    }

    if (Date.now() > payload.exp) {
      return null;
    }

    StellarSdk.StrKey.decodeEd25519PublicKey(payload.walletAddress);

    if (
      expectedRole === 'admin' &&
      payload.walletAddress !== getAdminWalletAddress()
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function hasWalletSignature(
  tx: StellarSdk.Transaction | StellarSdk.FeeBumpTransaction,
  walletAddress: string
): boolean {
  const keypair = StellarSdk.Keypair.fromPublicKey(walletAddress);
  const txHash = tx.hash();

  return tx.signatures.some((signature) =>
    keypair.verify(txHash, signature.signature())
  );
}

export async function createSignedChallenge(
  walletAddress: string,
  role: AuthRole
): Promise<ChallengeResult> {
  StellarSdk.StrKey.decodeEd25519PublicKey(walletAddress);

  if (role === 'admin' && walletAddress !== getAdminWalletAddress()) {
    throw new Error('Unauthorized wallet address');
  }

  const challengeSourcePublicKey = getChallengeSourcePublicKey();
  const sourceAccount = await server.loadAccount(challengeSourcePublicKey);
  const now = Date.now();
  const nonce = crypto.randomBytes(18).toString('hex');
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: network,
  })
    .addOperation(
      StellarSdk.Operation.manageData({
        name: 'stellarpay-auth',
        value: `${role}:${nonce}`,
        source: walletAddress,
      })
    )
    .setTimebounds(
      Math.floor((now - 30_000) / 1000),
      Math.floor((now + CHALLENGE_TTL_MS) / 1000)
    )
    .build();

  const challengeToken = signPayload({
    exp: now + CHALLENGE_TTL_MS,
    iat: now,
    role,
    txHash: tx.hash().toString('hex'),
    walletAddress,
  });

  return {
    challengeToken,
    challengeXdr: tx.toXDR(),
    expiresAt: now + CHALLENGE_TTL_MS,
  };
}

export function verifySignedChallenge(
  signedXdr: string,
  challengeToken: string,
  expectedRole: AuthRole
): TokenPayload | null {
  const payload = verifyToken(challengeToken, expectedRole);

  if (!payload?.txHash) {
    return null;
  }

  try {
    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      network
    );

    if (transaction.hash().toString('hex') !== payload.txHash) {
      return null;
    }

    if (!hasWalletSignature(transaction, payload.walletAddress)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function createSessionToken(
  walletAddress: string,
  role: AuthRole
): string {
  if (role === 'admin' && walletAddress !== getAdminWalletAddress()) {
    throw new Error('Unauthorized wallet address');
  }

  return signPayload({
    exp: Date.now() + SESSION_TTL_MS,
    iat: Date.now(),
    role,
    walletAddress,
  });
}

export function createAdminSessionToken(): string {
  return createSessionToken(getAdminWalletAddress(), 'admin');
}

export function verifyAdminSession(token: string): TokenPayload | null {
  return verifyToken(token, 'admin');
}

export function verifyWalletSession(token: string): TokenPayload | null {
  return verifyToken(token, 'wallet');
}

export function verifyAdminPortalPassword(password: string): boolean {
  const passwordHash = getAdminPortalPasswordHash();

  if (passwordHash) {
    return safeEqual(hashPassword(password), passwordHash);
  }

  return safeEqual(password, getAdminPortalPassword());
}
