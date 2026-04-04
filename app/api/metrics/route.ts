import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Daily active users (last 24h)
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const { count: dau } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_active_at', yesterday);

    // Total transactions
    const { count: totalTransactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    // Total volume
    const { data: volumeData } = await supabase
      .from('transactions')
      .select('amount');

    const totalVolume = (volumeData || []).reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0),
      0
    );

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      dau: dau || 0,
      totalTransactions: totalTransactions || 0,
      totalVolume,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Metrics error:', err);
    return NextResponse.json(
      {
        totalUsers: 0,
        dau: 0,
        totalTransactions: 0,
        totalVolume: 0,
        error: 'Failed to fetch metrics',
      },
      { status: 500 }
    );
  }
}
