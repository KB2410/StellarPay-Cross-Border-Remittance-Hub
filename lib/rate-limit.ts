import crypto from 'crypto';
import { NextResponse } from 'next/server';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  max: number;
  windowMs: number;
};

const buckets = new Map<string, RateLimitBucket>();

function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent') || 'unknown-agent';
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown-ip';

  return `${ip}:${userAgent}`;
}

function cleanupExpiredBuckets(now: number) {
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  });
}

export function getRequestIpHash(request: Request): string {
  return crypto
    .createHash('sha256')
    .update(getClientIdentifier(request))
    .digest('hex')
    .slice(0, 24);
}

export function enforceRateLimit(
  request: Request,
  scope: string,
  options: RateLimitOptions
) {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const fingerprint = getClientIdentifier(request);
  const bucketKey = `${scope}:${fingerprint}`;
  const currentBucket = buckets.get(bucketKey);

  if (!currentBucket || currentBucket.resetAt <= now) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return null;
  }

  if (currentBucket.count >= options.max) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((currentBucket.resetAt - now) / 1000)
    );

    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
        },
      }
    );
  }

  currentBucket.count += 1;
  buckets.set(bucketKey, currentBucket);
  return null;
}
