import "server-only";

// A small in-memory rate limiter. It protects the login form from guessing
// and the Anthropic API key from runaway use. Counts are kept per server
// process, which is enough for a single instance; a shared store would be
// needed to enforce exact limits across several instances.

const buckets = new Map<string, number[]>();

export interface Limit {
  /** How many requests are allowed in the window. */
  max: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

export const LIMITS = {
  login: { max: 10, windowSeconds: 10 * 60 },
  // A whole class can sit behind one school IP address, so this is generous.
  register: { max: 60, windowSeconds: 60 * 60 },
  ai: { max: 40, windowSeconds: 5 * 60 },
  photo: { max: 8, windowSeconds: 10 * 60 },
  newJob: { max: 12, windowSeconds: 60 * 60 },
} satisfies Record<string, Limit>;

/** Returns true if the request is allowed, and records it. */
export function allow(key: string, limit: Limit, now = Date.now()): boolean {
  const cutoff = now - limit.windowSeconds * 1000;
  const recent = (buckets.get(key) ?? []).filter((time) => time > cutoff);
  if (recent.length >= limit.max) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);

  // Keep the map from growing without bound.
  if (buckets.size > 5000) {
    for (const [name, times] of buckets) {
      if (times.every((time) => time <= cutoff)) buckets.delete(name);
    }
  }
  return true;
}
