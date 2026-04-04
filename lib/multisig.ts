import * as StellarSdk from '@stellar/stellar-sdk';
import { server, network } from './stellar';

/**
 * Configure an account to require multiple signatures (2-of-2 vault).
 * The vault keypair's master key + co-signer both get weight 1.
 * Medium & high thresholds are set to 2, so payments require both signatures.
 */
export async function setupVaultAccount(
  vaultKeypair: StellarSdk.Keypair,
  coSignerPublicKey: string
): Promise<string> {
  const sourceAccount = await server.loadAccount(vaultKeypair.publicKey());

  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: network,
  })
    .addOperation(
      StellarSdk.Operation.setOptions({
        signer: { ed25519PublicKey: coSignerPublicKey, weight: 1 },
        masterWeight: 1,
        lowThreshold: 1,
        medThreshold: 2,
        highThreshold: 2,
      })
    )
    .setTimeout(30)
    .build();

  tx.sign(vaultKeypair);
  const result = await server.submitTransaction(tx);
  return result.hash;
}

/**
 * Add a signature to an existing XDR payload.
 * Returns the updated XDR with the new signature included.
 */
export function signPendingTransaction(
  xdrPayload: string,
  signerKeypair: StellarSdk.Keypair
): string {
  const tx = new StellarSdk.Transaction(xdrPayload, network);
  tx.sign(signerKeypair);
  return tx.toXDR();
}

/**
 * Deserialize an XDR payload to inspect the transaction details.
 */
export function inspectTransaction(xdrPayload: string) {
  try {
    const tx = new StellarSdk.Transaction(xdrPayload, network);
    return {
      source: tx.source,
      fee: tx.fee,
      operations: tx.operations.map((op) => ({
        type: op.type,
        ...(op.type === 'payment'
          ? {
              destination: (op as StellarSdk.Operation.Payment).destination,
              amount: (op as StellarSdk.Operation.Payment).amount,
              asset: (op as StellarSdk.Operation.Payment).asset.code || 'XLM',
            }
          : {}),
      })),
      signatures: tx.signatures.length,
    };
  } catch {
    return null;
  }
}
