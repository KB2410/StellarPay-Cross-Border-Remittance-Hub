import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { action, vaultPublicKey, xdrPayload, creatorPublicKey, txId } =
      await req.json();
    const supabase = createClient();

    if (action === 'create') {
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
      return NextResponse.json({ success: true, pendingTx: data[0] });
    }

    if (action === 'update') {
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
      return NextResponse.json({ success: true, pendingTx: data[0] });
    }

    if (action === 'reject') {
      const { data, error } = await supabase
        .from('pending_transactions')
        .update({ status: 'rejected' })
        .eq('id', txId)
        .select();

      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, pendingTx: data[0] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Multisig API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('pending_transactions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ pendingTransactions: data });
  } catch (err) {
    console.error('Multisig GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
