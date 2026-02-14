type BucketRecord = {
  timestamps: number[];
};

const store = new Map<string, BucketRecord>();

export type RateLimitRule = {
  keyPrefix: string;
  windowMs: number;
  max: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

function prune(now: number, windowMs: number, timestamps: number[]) {
  const threshold = now - windowMs;
  while (timestamps.length > 0 && timestamps[0] < threshold) {
    timestamps.shift();
  }
}

export function checkSlidingWindow(rule: RateLimitRule, key: string): RateLimitResult {
  const now = Date.now();
  const compoundKey = `${rule.keyPrefix}:${key}`;
  const bucket = store.get(compoundKey) ?? { timestamps: [] };

  prune(now, rule.windowMs, bucket.timestamps);

  if (bucket.timestamps.length >= rule.max) {
    const retryAfterMs = Math.max(0, rule.windowMs - (now - bucket.timestamps[0]));
    store.set(compoundKey, bucket);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
    };
  }

  bucket.timestamps.push(now);
  store.set(compoundKey, bucket);

  return {
    allowed: true,
    remaining: Math.max(0, rule.max - bucket.timestamps.length),
    retryAfterMs: 0,
  };
}

export function clientIpFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}
