// Admin authentication utility using a password-protected portal session.

export interface AuthResult {
  success: boolean;
  error?: string;
}

export async function authenticateAdmin(password: string): Promise<AuthResult> {
  try {
    const response = await fetch('/api/admin/auth', {
      body: JSON.stringify({ password }),
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
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
