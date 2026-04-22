import { cookies } from 'next/headers';
import {
  ADMIN_SESSION_COOKIE,
  WALLET_SESSION_COOKIE,
  verifyAdminSession,
  verifyWalletSession,
} from '@/lib/auth';

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = verifyAdminSession(token);

  if (!session) {
    cookieStore.delete(ADMIN_SESSION_COOKIE);
    return null;
  }

  return session;
}

export async function getWalletSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(WALLET_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = verifyWalletSession(token);

  if (!session) {
    cookieStore.delete(WALLET_SESSION_COOKIE);
    return null;
  }

  return session;
}
