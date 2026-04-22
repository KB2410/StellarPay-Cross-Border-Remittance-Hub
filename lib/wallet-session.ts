import { network } from '@/lib/stellar';

interface WalletVerifyResponse {
  authenticated: boolean;
  walletAddress?: string;
}

async function verifyWalletSession(): Promise<WalletVerifyResponse> {
  try {
    const response = await fetch('/api/wallet/verify', {
      credentials: 'same-origin',
      method: 'GET',
    });

    if (!response.ok) {
      return { authenticated: false };
    }

    return (await response.json()) as WalletVerifyResponse;
  } catch {
    return { authenticated: false };
  }
}

export async function establishWalletSession(
  walletAddress: string
): Promise<boolean> {
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  const existingSession = await verifyWalletSession();

  if (
    existingSession.authenticated &&
    existingSession.walletAddress === walletAddress
  ) {
    return true;
  }

  const challengeResponse = await fetch(
    `/api/wallet/challenge?walletAddress=${encodeURIComponent(walletAddress)}`,
    {
      credentials: 'same-origin',
      method: 'GET',
    }
  );

  if (!challengeResponse.ok) {
    return false;
  }

  const { challengeXdr } = await challengeResponse.json();
  const freighterApi = await import('@stellar/freighter-api');
  const signedXdr = await freighterApi.signTransaction(challengeXdr, {
    accountToSign: walletAddress,
    networkPassphrase: network,
  });
  const authResponse = await fetch('/api/wallet/auth', {
    body: JSON.stringify({ signedXdr }),
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });

  return authResponse.ok;
}

export async function logoutWalletSession(): Promise<void> {
  try {
    await fetch('/api/wallet/logout', {
      credentials: 'same-origin',
      method: 'POST',
    });
  } catch {
    // best-effort cleanup only
  }
}
