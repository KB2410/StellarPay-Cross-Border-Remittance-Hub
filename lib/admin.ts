// Admin authentication utility
// Admin access is controlled by a secret key stored in localStorage
// The admin key is set via an environment variable and checked on the client

const ADMIN_KEY_STORAGE = 'stellarPay_adminKey';

export function isAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  const storedKey = localStorage.getItem(ADMIN_KEY_STORAGE);
  const expectedKey = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY;
  return storedKey === expectedKey && !!expectedKey;
}

export function setAdminKey(key: string): boolean {
  if (typeof window === 'undefined') return false;
  const expectedKey = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY;
  if (key === expectedKey) {
    localStorage.setItem(ADMIN_KEY_STORAGE, key);
    return true;
  }
  return false;
}

export function clearAdminKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_KEY_STORAGE);
}
