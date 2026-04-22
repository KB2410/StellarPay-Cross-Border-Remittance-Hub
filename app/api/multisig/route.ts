import { NextRequest, NextResponse } from 'next/server';
import * as StellarSdk from '@stellar/stellar-sdk';
import { getWalletSession } from '@/lib/auth-session';
import { createAdminClient } from '@/lib/supabase';
import { network, server } from '@/lib/stellar';
import { validatePublicKey } from '@/lib/validation';
import { enforceRateLimit, getRequestIpHash } from '@/lib/rate-limit';
import { logSecurityEvent } from '@/lib/security-audit';

export const dynamic = 'force-dynamic';

type PendingTransactionRecord = {
  created_at: string;
  creator_public_key: string;
  current_signatures: number;
  id: string;
  required_signatures: number;
  status: 'pending' | 'executed' | 'rejected';
  vault_public_key: string;
  xdr_payload: string;
};

function hasWalletSignature(xdrPayload: string, walletAddress: string): boolean {
  try {
    const tx = StellarSdk.TransactionBuilder.fromXDR(xdrPayload, network);
    const keypair = StellarSdk.Keypair.fromPublicKey(walletAddress);
    const txHash = tx.hash();

    return tx.signatures.some((signature) =>
      keypair.verify(txHash, signature.signature())
    );
  } catch {
    return false;
  }
}

function hasMatchingTransactionHash(
  originalXdr: string,
  signedXdr: string
): boolean {
  try {
    const originalTx = StellarSdk.TransactionBuilder.fromXDR(originalXdr, network);
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, network);

    return originalTx.hash().equals(signedTx.hash());
  } catch {
    return false;
  }
}

async function canAccessPendingTransaction(
  walletAddress: string,
  transaction: PendingTransactionRecord
): Promise<boolean> {
  if (
    walletAddress === transaction.vault_public_key ||
    walletAddress === transaction.creator_public_key
  ) {
    return true;
  }

  try {
    const vaultAccount = await server.loadAccount(transaction.vault_public_key);
    return vaultAccount.signers.some((signer) => signer.key === walletAddress);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(req, 'multisig-post', {
      max: 30,
      windowMs: 60_000,
    });

    if (rateLimitResponse) {
      await logSecurityEvent({
        action: 'multisig_rate_limited',
        metadata: { ipHash: getRequestIpHash(req), method: 'POST' },
        outcome: 'failure',
        request: req,
        route: '/api/multisig',
      });
      return rateLimitResponse;
    }

    const walletSession = await getWalletSession();

    if (!walletSession) {
      await logSecurityEvent({
        action: 'multisig_unauthorized',
        metadata: { ipHash: getRequestIpHash(req), method: 'POST' },
        outcome: 'failure',
        request: req,
        route: '/api/multisig',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, vaultPublicKey, xdrPayload, creatorPublicKey, txId } =
      await req.json();
    const supabase = createAdminClient();

    if (action === 'create') {
      const creatorValidation = validatePublicKey(creatorPublicKey);
      const vaultValidation = validatePublicKey(vaultPublicKey);

      if (!creatorValidation.valid || !vaultValidation.valid) {
        await logSecurityEvent({
          action: 'multisig_create_invalid_keys',
          actorPublicKey: walletSession.walletAddress,
          metadata: { ipHash: getRequestIpHash(req) },
          outcome: 'failure',
          request: req,
          route: '/api/multisig',
          targetPublicKey: vaultPublicKey,
        });
        return NextResponse.json(
          { error: creatorValidation.error || vaultValidation.error },
          { status: 400 }
        );
      }

      if (
        walletSession.walletAddress !== creatorPublicKey ||
        walletSession.walletAddress !== vaultPublicKey
      ) {
        await logSecurityEvent({
          action: 'multisig_create_forbidden',
          actorPublicKey: walletSession.walletAddress,
          metadata: { creatorPublicKey, ipHash: getRequestIpHash(req) },
          outcome: 'failure',
          request: req,
          route: '/api/multisig',
          targetPublicKey: vaultPublicKey,
        });
        return NextResponse.json(
          { error: 'Vault transactions can only be created by the vault owner' },
          { status: 403 }
        );
      }

      if (!hasWalletSignature(xdrPayload, walletSession.walletAddress)) {
        await logSecurityEvent({
          action: 'multisig_create_missing_signature',
          actorPublicKey: walletSession.walletAddress,
          metadata: { ipHash: getRequestIpHash(req) },
          outcome: 'failure',
          request: req,
          route: '/api/multisig',
          targetPublicKey: vaultPublicKey,
        });
        return NextResponse.json(
          { error: 'Creator signature is required for multisig transactions' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('pending_transactions')
        .insert([
          {
            vault_public_key: vaultPublicKey,
            creator_public_key: creatorPublicKey,
            xdr_payload: xdrPayload,
          },
        ])
        .select();

      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      await logSecurityEvent({
        action: 'multisig_created',
        actorPublicKey: walletSession.walletAddress,
        metadata: { ipHash: getRequestIpHash(req), pendingTransactionId: data[0]?.id },
        outcome: 'success',
        request: req,
        route: '/api/multisig',
        targetPublicKey: vaultPublicKey,
      });
      return NextResponse.json({ success: true, pendingTx: data[0] });
    }

    if (action === 'update') {
      const { data: pendingTx, error: pendingTxError } = await supabase
        .from('pending_transactions')
        .select('*')
        .eq('id', txId)
        .maybeSingle<PendingTransactionRecord>();

      if (pendingTxError || !pendingTx) {
        return NextResponse.json(
          { error: pendingTxError?.message || 'Pending transaction not found' },
          { status: 404 }
        );
      }

      const authorized = await canAccessPendingTransaction(
        walletSession.walletAddress,
        pendingTx
      );

      if (!authorized) {
        await logSecurityEvent({
          action: 'multisig_update_forbidden',
          actorPublicKey: walletSession.walletAddress,
          metadata: { ipHash: getRequestIpHash(req), txId },
          outcome: 'failure',
          request: req,
          route: '/api/multisig',
          targetPublicKey: pendingTx.vault_public_key,
        });
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (!hasMatchingTransactionHash(pendingTx.xdr_payload, xdrPayload)) {
        await logSecurityEvent({
          action: 'multisig_update_hash_mismatch',
          actorPublicKey: walletSession.walletAddress,
          metadata: { ipHash: getRequestIpHash(req), txId },
          outcome: 'failure',
          request: req,
          route: '/api/multisig',
          targetPublicKey: pendingTx.vault_public_key,
        });
        return NextResponse.json(
          { error: 'Signed transaction does not match the original request' },
          { status: 400 }
        );
      }

      if (!hasWalletSignature(xdrPayload, walletSession.walletAddress)) {
        await logSecurityEvent({
          action: 'multisig_update_missing_signature',
          actorPublicKey: walletSession.walletAddress,
          metadata: { ipHash: getRequestIpHash(req), txId },
          outcome: 'failure',
          request: req,
          route: '/api/multisig',
          targetPublicKey: pendingTx.vault_public_key,
        });
        return NextResponse.json(
          { error: 'Authorized signer signature is required' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from('pending_transactions')
        .update({
          xdr_payload: xdrPayload,
          current_signatures: 2,
          status: 'executed',
        })
        .eq('id', txId)
        .select();

      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      await logSecurityEvent({
        action: 'multisig_executed',
        actorPublicKey: walletSession.walletAddress,
        metadata: { ipHash: getRequestIpHash(req), txId },
        outcome: 'success',
        request: req,
        route: '/api/multisig',
        targetPublicKey: pendingTx.vault_public_key,
      });
      return NextResponse.json({ success: true, pendingTx: data[0] });
    }

    if (action === 'reject') {
      const { data: pendingTx, error: pendingTxError } = await supabase
        .from('pending_transactions')
        .select('*')
        .eq('id', txId)
        .maybeSingle<PendingTransactionRecord>();

      if (pendingTxError || !pendingTx) {
        return NextResponse.json(
          { error: pendingTxError?.message || 'Pending transaction not found' },
          { status: 404 }
        );
      }

      const authorized = await canAccessPendingTransaction(
        walletSession.walletAddress,
        pendingTx
      );

      if (!authorized) {
        await logSecurityEvent({
          action: 'multisig_reject_forbidden',
          actorPublicKey: walletSession.walletAddress,
          metadata: { ipHash: getRequestIpHash(req), txId },
          outcome: 'failure',
          request: req,
          route: '/api/multisig',
          targetPublicKey: pendingTx.vault_public_key,
        });
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data, error } = await supabase
        .from('pending_transactions')
        .update({ status: 'rejected' })
        .eq('id', txId)
        .select();

      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      await logSecurityEvent({
        action: 'multisig_rejected',
        actorPublicKey: walletSession.walletAddress,
        metadata: { ipHash: getRequestIpHash(req), txId },
        outcome: 'success',
        request: req,
        route: '/api/multisig',
        targetPublicKey: pendingTx.vault_public_key,
      });
      return NextResponse.json({ success: true, pendingTx: data[0] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    await logSecurityEvent({
      action: 'multisig_post_failed',
      metadata: { ipHash: getRequestIpHash(req) },
      outcome: 'failure',
      request: req,
      route: '/api/multisig',
    });
    console.error('Multisig API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(req, 'multisig-get', {
      max: 60,
      windowMs: 60_000,
    });

    if (rateLimitResponse) {
      await logSecurityEvent({
        action: 'multisig_rate_limited',
        metadata: { ipHash: getRequestIpHash(req), method: 'GET' },
        outcome: 'failure',
        request: req,
        route: '/api/multisig',
      });
      return rateLimitResponse;
    }

    const walletSession = await getWalletSession();

    if (!walletSession) {
      await logSecurityEvent({
        action: 'multisig_unauthorized',
        metadata: { ipHash: getRequestIpHash(req), method: 'GET' },
        outcome: 'failure',
        request: req,
        route: '/api/multisig',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('pending_transactions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    const authorizedTransactions = (
      await Promise.all(
        (data || []).map(async (transaction) => {
          const authorized = await canAccessPendingTransaction(
            walletSession.walletAddress,
            transaction as PendingTransactionRecord
          );

          return authorized ? transaction : null;
        })
      )
    ).filter(Boolean);

    return NextResponse.json({ pendingTransactions: authorizedTransactions });
  } catch (err) {
    await logSecurityEvent({
      action: 'multisig_get_failed',
      metadata: { ipHash: getRequestIpHash(req) },
      outcome: 'failure',
      request: req,
      route: '/api/multisig',
    });
    console.error('Multisig GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
