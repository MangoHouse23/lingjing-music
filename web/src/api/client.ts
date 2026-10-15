/** 统一 API 客户端：/api 前缀走 vite 代理 */
const BASE = '/api';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
      ...init,
    });
  } catch {
    throw new ApiError('无法连接到聆境服务，请确认服务端已启动', 0);
  }
  if (!res.ok) {
    let msg = `请求失败 (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data?.message === 'string') msg = data.message;
    } catch { /* ignore */ }
    throw new ApiError(msg, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const get = <T>(path: string) => request<T>(path);
export const post = <T>(path: string, body?: any) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
export const put = <T>(path: string, body?: any) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) });
export const patch = <T>(path: string, body?: any) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) });
export const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

/** 外链封面 → 服务端代理（解决 CORS，供取色） */
export function proxyImage(url?: string): string | undefined {
  return url ? `/api/music/proxy/image?url=${encodeURIComponent(url)}` : undefined;
}
