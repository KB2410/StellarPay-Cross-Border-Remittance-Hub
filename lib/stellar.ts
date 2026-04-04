import * as StellarSdk from '@stellar/stellar-sdk';
import type { Balance, HorizonOperation } from '@/types';

export const network =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'TESTNET'
    ? StellarSdk.Networks.TESTNET
    : StellarSdk.Networks.PUBLIC;

const horizonUrl =
  process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';

export const server = new StellarSdk.Horizon.Server(horizonUrl);

const USDC_ISSUER =
  process.env.NEXT_PUBLIC_USDC_ISSUER ||
  'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

/* ── helpers ────────────────────────────────────────── */

export function isValidAddress(address: string): boolean {
  try {
    StellarSdk.StrKey.decodeEd25519PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export async function getBalances(publicKey: string): Promise<Balance[]> {
  try {
    const account = await server.loadAccount(publicKey);
    return account.balances.map((b) => {
      if (b.asset_type === 'native') {
        return { asset: 'XLM', balance: b.balance };
      }
      return {
        asset: (b as StellarSdk.Horizon.HorizonApi.BalanceLineAsset).asset_code || 'Unknown',
        balance: b.balance,
        issuer: (b as StellarSdk.Horizon.HorizonApi.BalanceLineAsset).asset_issuer,
      };
    });
  } catch {
    return [];
  }
}

/* ── transaction building ───────────────────────────── */

export async function buildPaymentTransaction(
  senderPublicKey: string,
  recipientPublicKey: string,
  amount: string,
  memo?: string
): Promise<string> {
  const sourceAccount = await server.loadAccount(senderPublicKey);

  const usdcAsset = new StellarSdk.Asset('USDC', USDC_ISSUER);

  // Check if destination account exists and has USDC trustline
  try {
    const destAccount = await server.loadAccount(recipientPublicKey);
    const hasUSDCTrustline = destAccount.balances.some(
      (b) =>
        b.asset_type !== 'native' &&
        (b as StellarSdk.Horizon.HorizonApi.BalanceLineAsset).asset_code === 'USDC' &&
        (b as StellarSdk.Horizon.HorizonApi.BalanceLineAsset).asset_issuer === USDC_ISSUER
    );

    if (!hasUSDCTrustline) {
      throw new Error(
        'Recipient account exists but does not have a USDC trustline. They need to add USDC trust first.'
      );
    }
  } catch (err: unknown) {
    const error = err as { response?: { status?: number }; message?: string };
    if (error.response?.status === 404) {
      throw new Error(
        'Recipient account does not exist. They need to create their account first (get funded from Friendbot or receive XLM).'
      );
    }
    // Re-throw if it's our custom trustline error
    if (error.message?.includes('trustline')) {
      throw error;
    }
    throw new Error('Failed to verify recipient account');
  }

  const builder = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: network,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: recipientPublicKey,
        asset: usdcAsset,
        amount: amount,
      })
    )
    .setTimeout(180);

  if (memo) {
    builder.addMemo(StellarSdk.Memo.text(memo));
  }

  const tx = builder.build();
  return tx.toXDR();
}

export async function buildNativePaymentTransaction(
  senderPublicKey: string,
  recipientPublicKey: string,
  amount: string,
  memo?: string
): Promise<string> {
  const sourceAccount = await server.loadAccount(senderPublicKey);

  const builder = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: network,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: recipientPublicKey,
        asset: StellarSdk.Asset.native(),
        amount: amount,
      })
    )
    .setTimeout(180);

  if (memo) {
    builder.addMemo(StellarSdk.Memo.text(memo));
  }

  const tx = builder.build();
  return tx.toXDR();
}

/* ── transaction submission ─────────────────────────── */

export async function submitTransaction(
  signedXDR: string
): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    const tx = StellarSdk.TransactionBuilder.fromXDR(signedXDR, network);
    const result = await server.submitTransaction(tx);
    return { success: true, hash: result.hash };
  } catch (err: unknown) {
    const error = err as { response?: { data?: { extras?: { result_codes?: unknown } } } };
    return {
      success: false,
      error: JSON.stringify(
        error?.response?.data?.extras?.result_codes || 'Unknown error'
      ),
    };
  }
}

/* ── transaction history ────────────────────────────── */

export async function getTransactionHistory(
  publicKey: string
): Promise<HorizonOperation[]> {
  try {
    const operations = await server
      .operations()
      .forAccount(publicKey)
      .order('desc')
      .limit(20)
      .call();

    return operations.records.map((op) => {
      const payOp = op as unknown as {
        id: string;
        type: string;
        created_at: string;
        transaction_hash: string;
        source_account: string;
        amount?: string;
        asset_type?: string;
        asset_code?: string;
        from?: string;
        to?: string;
      };
      return {
        id: payOp.id,
        type: payOp.type,
        created_at: payOp.created_at,
        transaction_hash: payOp.transaction_hash,
        source_account: payOp.source_account,
        amount: payOp.amount,
        asset_type: payOp.asset_type,
        asset_code: payOp.asset_code,
        from: payOp.from,
        to: payOp.to,
      };
    });
  } catch {
    return [];
  }
}

/* ── account thresholds check ───────────────────────── */

export async function isMultisigAccount(publicKey: string): Promise<boolean> {
  try {
    const account = await server.loadAccount(publicKey);
    return account.thresholds.med_threshold > 1;
  } catch {
    return false;
  }
}
