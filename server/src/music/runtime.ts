/** 每源节流：严格按 interval 步进放行（默认 500ms ≈ 2 QPS），队列最长等待 4s */
export class RateLimiter {
  private queue: { run: () => void }[] = [];
  private last = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private intervalMs = 500) {}

  private pump() {
    const now = Date.now();
    if (now - this.last >= this.intervalMs) {
      this.last = now;
      const next = this.queue.shift();
      if (next) next.run();
    }
    if (this.queue.length && !this.timer) {
      const wait = Math.max(30, this.intervalMs - (Date.now() - this.last));
      this.timer = setTimeout(() => {
        this.timer = null;
        this.pump();
      }, wait);
    }
  }

  acquire(timeoutMs = 4000): Promise<void> {
    return new Promise((resolve, reject) => {
      const item = { run: resolve };
      this.queue.push(item);
      setTimeout(() => {
        const idx = this.queue.indexOf(item);
        if (idx >= 0) {
          this.queue.splice(idx, 1);
          reject(new Error('请求过于频繁，已限流跳过'));
        }
      }, timeoutMs);
      this.pump();
    });
  }
}

/** 音源健康度：连续失败 3 次熔断 60s */
export class HealthTracker {
  private failStreak = 0;
  private lastFailAt = 0;
  private lastOkAt = 0;

  get available(): boolean {
    if (this.failStreak < 3) return true;
    return Date.now() - this.lastFailAt > 60_000;
  }

  get score(): number {
    if (!this.lastOkAt && !this.lastFailAt) return 100;
    const base = Math.max(0, 100 - this.failStreak * 25);
    const recency = Math.max(0, 1 - (Date.now() - Math.max(this.lastOkAt, this.lastFailAt)) / 3_600_000);
    return Math.round(base * (0.6 + 0.4 * recency));
  }

  ok() {
    this.failStreak = 0;
    this.lastOkAt = Date.now();
  }

  fail() {
    this.failStreak += 1;
    this.lastFailAt = Date.now();
  }
}

/** 简易 TTL 缓存（带条目上限） */
export class TtlCache {
  private map = new Map<string, { exp: number; value: any }>();
  constructor(private max = 300) {}

  get<T>(key: string): T | undefined {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.exp) {
      this.map.delete(key);
      return undefined;
    }
    return hit.value as T;
  }

  set(key: string, value: any, ttlSec: number) {
    if (this.map.size >= this.max) {
      const oldest = this.map.keys().next().value;
      if (oldest) this.map.delete(oldest);
    }
    this.map.set(key, { exp: Date.now() + ttlSec * 1000, value });
  }
}
