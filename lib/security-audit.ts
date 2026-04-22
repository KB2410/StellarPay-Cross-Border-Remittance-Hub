import { createAdminClient } from '@/lib/supabase';

type SecurityEvent = {
  action: string;
  actorPublicKey?: string | null;
  metadata?: Record<string, unknown>;
  outcome: 'success' | 'failure';
  request?: Request;
  route: string;
  targetPublicKey?: string | null;
};

function sanitizeValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value.slice(0, 512);
}

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const userAgent = sanitizeValue(event.request?.headers.get('user-agent'));
  const forwardedFor = event.request?.headers.get('x-forwarded-for');
  const realIp = event.request?.headers.get('x-real-ip');
  const ipAddress = sanitizeValue(
    forwardedFor?.split(',')[0]?.trim() || realIp || null
  );

  try {
    const supabase = createAdminClient();
    await supabase.from('security_events').insert([
      {
        action: event.action,
        actor_public_key: sanitizeValue(event.actorPublicKey),
        ip_address: ipAddress,
        metadata: event.metadata || {},
        outcome: event.outcome,
        route: event.route,
        target_public_key: sanitizeValue(event.targetPublicKey),
        user_agent: userAgent,
      },
    ]);
  } catch {
    console.info('[security-event]', {
      action: event.action,
      actorPublicKey: event.actorPublicKey,
      metadata: event.metadata,
      outcome: event.outcome,
      route: event.route,
      targetPublicKey: event.targetPublicKey,
    });
  }
}
