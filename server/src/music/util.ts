import { HttpException } from '@nestjs/common';

/** 带超时的 JSON 请求 */
export async function httpJson<T = any>(url: string, init: RequestInit = {}, timeoutMs = 6500): Promise<T> {
  const text = await httpText(url, init, timeoutMs);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`非 JSON 响应: ${String(text).slice(0, 120)}`);
  }
}

/** 带超时的文本/二进制请求 */
export async function httpText(url: string, init: RequestInit = {}, timeoutMs = 6500): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        ...(init.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export function fail(status: number, message: string): HttpException {
  return new HttpException(message, status);
}

/** 归一化（用于聚合去重匹配键） */
export function norm(s?: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/\s|'|·|–|—|-|（|）|\(|\)|，|,|。|\.|!|！|\?|？/g, '');
}

/** 解析时长：支持 "mm:ss" / "hh:mm:ss" / 秒数 / 毫秒数 */
export function parseDuration(v: any): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v > 100000 ? Math.round(v / 1000) : Math.round(v);
  const s = String(v).trim();
  const parts = s.split(':').map((x) => parseInt(x, 10));
  if (parts.length >= 2 && parts.every((n) => !isNaN(n))) {
    return parts.reduce((acc, n) => acc * 60 + n, 0);
  }
  const n = parseInt(s, 10);
  return isNaN(n) ? 0 : n > 100000 ? Math.round(n / 1000) : n;
}

/** 宽松取字段 */
export function pick(o: any, ...keys: string[]): any {
  for (const k of keys) {
    const v = o?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

export function fmtSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
