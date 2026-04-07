// Admin authentication utility using server-side API
// This ensures the admin secret key is never exposed to the client

export interface AuthResult {
  success: boolean;
  error?: string;
}

export async function authenticateAdmin(adminKey: string): Promise<AuthResult> {
  try {
    const response = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey }),
    });

    if (response.ok) {
      return { success: true };
    }

    const data = await response.json();
    return { success: false, error: data.error || 'Authentication failed' };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function isAdmin(): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/verify', {
      method: 'GET',
      credentials: 'same-origin',
    });

    if (response.ok) {
      const data = await response.json();
      return data.authenticated === true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function logoutAdmin(): Promise<AuthResult> {
  try {
    const response = await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });

    if (response.ok) {
      return { success: true };
    }

    return { success: false, error: 'Logout failed' };
  } catch {
    return { success: false, error: 'Network error' };
  }
}
