/**
 * Rate limit sederhana di memori (sliding window).
 * Tahap A: per IP. Tahap D: dipindah ke Postgres/Upstash per user_id
 * supaya tetap berlaku di Vercel yang punya banyak instance.
 */

const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (list.length >= limit) {
    const retryAfterMs = windowMs - (now - list[0]);
    hits.set(key, list);
    return { ok: false as const, retryAfterSec: Math.ceil(retryAfterMs / 1000) };
  }

  list.push(now);
  hits.set(key, list);
  return { ok: true as const, remaining: limit - list.length };
}
