import { NextResponse } from 'next/server';
import { getWalletSession } from '@/lib/auth-session';
import { createAdminClient } from '@/lib/supabase';
import {
  sanitizeInput,
  validateAmountForAsset,
  validateMemo,
  validatePublicKey,
} from '@/lib/validation';
import { enforceRateLimit, getRequestIpHash } from '@/lib/rate-limit';
import { logSecurityEvent } from '@/lib/security-audit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rateLimitResponse = enforceRateLimit(request, 'transactions-post', {
      max: 20,
      windowMs: 60_000,
    });

    if (rateLimitResponse) {
      await logSecurityEvent({
        action: 'transaction_log_rate_limited',
        metadata: { ipHash: getRequestIpHash(request) },
        outcome: 'failure',
        request,
        route: '/api/transactions',
      });
      return rateLimitResponse;
    }

    const walletSession = await getWalletSession();

    if (!walletSession) {
      await logSecurityEvent({
        action: 'transaction_log_unauthorized',
        metadata: { ipHash: getRequestIpHash(request) },
        outcome: 'failure',
        request,
        route: '/api/transactions',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const asset = body.asset === 'USDC' ? 'USDC' : 'XLM';
    const amount = sanitizeInput(String(body.amount ?? ''));
    const counterparty = sanitizeInput(String(body.counterparty ?? ''));
    const memo = sanitizeInput(String(body.memo ?? ''));
    const txHash = sanitizeInput(String(body.stellarTxHash ?? ''));

    const amountValidation = validateAmountForAsset(amount, asset);
    const counterpartyValidation = validatePublicKey(counterparty);
    const memoValidation = validateMemo(memo);

    if (!txHash) {
      await logSecurityEvent({
        action: 'transaction_log_missing_hash',
        actorPublicKey: walletSession.walletAddress,
        metadata: { ipHash: getRequestIpHash(request) },
        outcome: 'failure',
        request,
        route: '/api/transactions',
        targetPublicKey: counterparty,
      });
      return NextResponse.json(
        { error: 'Transaction hash is required' },
        { status: 400 }
      );
    }

    if (!amountValidation.valid) {
      await logSecurityEvent({
        action: 'transaction_log_invalid_amount',
        actorPublicKey: walletSession.walletAddress,
        metadata: { ipHash: getRequestIpHash(request), asset },
        outcome: 'failure',
        request,
        route: '/api/transactions',
        targetPublicKey: counterparty,
      });
      return NextResponse.json(
        { error: amountValidation.error },
        { status: 400 }
      );
    }

    if (!counterpartyValidation.valid) {
      await logSecurityEvent({
        action: 'transaction_log_invalid_counterparty',
        actorPublicKey: walletSession.walletAddress,
        metadata: { ipHash: getRequestIpHash(request) },
        outcome: 'failure',
        request,
        route: '/api/transactions',
      });
      return NextResponse.json(
        { error: counterpartyValidation.error },
        { status: 400 }
      );
    }

    if (!memoValidation.valid) {
      await logSecurityEvent({
        action: 'transaction_log_invalid_memo',
        actorPublicKey: walletSession.walletAddress,
        metadata: { ipHash: getRequestIpHash(request) },
        outcome: 'failure',
        request,
        route: '/api/transactions',
        targetPublicKey: counterparty,
      });
      return NextResponse.json({ error: memoValidation.error }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Ensure user exists (upsert on connect may have failed silently)
    await supabase.from('users').upsert(
      {
        last_active_at: new Date().toISOString(),
        stellar_public_key: walletSession.walletAddress,
      },
      { onConflict: 'stellar_public_key' }
    );

    const { error } = await supabase.from('transactions').insert([
      {
        amount: Number(amount),
        asset,
        counterparty,
        direction: 'sent',
        memo: memo || null,
        stellar_tx_hash: txHash,
        user_public_key: walletSession.walletAddress,
      },
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logSecurityEvent({
      action: 'transaction_logged',
      actorPublicKey: walletSession.walletAddress,
      metadata: { asset, ipHash: getRequestIpHash(request), stellarTxHash: txHash },
      outcome: 'success',
      request,
      route: '/api/transactions',
      targetPublicKey: counterparty,
    });

    return NextResponse.json({ success: true });
  } catch {
    await logSecurityEvent({
      action: 'transaction_log_failed',
      metadata: { ipHash: getRequestIpHash(request) },
      outcome: 'failure',
      request,
      route: '/api/transactions',
    });
    return NextResponse.json(
      { error: 'Failed to record transaction' },
      { status: 500 }
    );
  }
}
