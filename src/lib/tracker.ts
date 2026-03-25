/**
 * tracker.ts — In-Memory Atomic Analytics
 *
 * Previous issue: readFile → modify → writeFile caused race conditions AND
 * crashes on Vercel (EROFS: read-only file system at /var/task).
 *
 * Solution:
 *   - Pure in-memory singleton for all mutations (sync, no race condition)
 *   - Disk I/O is completely DISABLED in production (Vercel / serverless)
 *   - In development, hydrates from / flushes to .analytics.json locally
 *   - If process restarts, counters reset (fine for a trend ticker)
 *
 * For cross-instance persistence → swap store with Upstash Redis:
 *   await redis.hincrby('analytics', genre, 1)
 */

import fs from 'fs';
import path from 'path';

interface AnalyticsStore {
  totalSearches: number;
  topMoods: Record<string, number>;
  topGenres: Record<string, number>;
}

// ── In-memory singleton ────────────────────────────────────────────────────
const store: AnalyticsStore = {
  totalSearches: 0,
  topMoods: {},
  topGenres: {},
};

// Disk I/O is only available in local development
const IS_PROD = process.env.NODE_ENV === 'production';
const analyticsPath = path.resolve(process.cwd(), '.analytics.json');

// Hydrate from disk once on startup — only in dev
if (!IS_PROD) {
  try {
    if (fs.existsSync(analyticsPath)) {
      const saved: AnalyticsStore = JSON.parse(fs.readFileSync(analyticsPath, 'utf8'));
      store.totalSearches = saved.totalSearches ?? 0;
      store.topMoods      = saved.topMoods      ?? {};
      store.topGenres     = saved.topGenres     ?? {};
    }
  } catch { /* fresh start is fine */ }
}

// ── Batched disk flush (dev only) ─────────────────────────────────────────
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (IS_PROD) return; // no-op in production
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    try {
      fs.writeFileSync(analyticsPath, JSON.stringify(store, null, 2));
    } catch { /* non-critical */ }
  }, 5_000);
}

// ── Public API ─────────────────────────────────────────────────────────────
export function trackSearch(genre?: string | null, mood?: string | null) {
  store.totalSearches += 1;
  if (genre) store.topGenres[genre] = (store.topGenres[genre] ?? 0) + 1;
  if (mood)  store.topMoods[mood]   = (store.topMoods[mood]   ?? 0) + 1;
  scheduleFlush();
}

export function getAnalytics(): Readonly<AnalyticsStore> {
  return store;
}
