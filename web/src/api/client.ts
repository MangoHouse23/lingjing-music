/** 统一 API 客户端
 *  - BASE 可通过构建期环境变量 VITE_API_BASE 配置（如部署到 Render 的后端地址）
 *  - 默认 '/api'，本地开发走 vite 代理
 *  - 后端不可达（静态托管）时自动切换内置演示模式
 */
import { ref } from 'vue';
import { demoMode, setDemoMode } from './mode';
import { resolveMock } from '@/mock/mock-api';

export const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || '/api';

/** 正在探活真实后端（演示模式下每 60s 重试一次） */
const probing = ref(false);
let lastProbe = 0;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function rawFetch(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
}

function mockResponse(path: string, init: RequestInit): { status: number; data: any } | null {
  const method = (init.method || 'GET').toUpperCase();
  let body: any = undefined;
  try {
    body = init.body ? JSON.parse(init.body as string) : undefined;
  } catch { /* ignore */ }
  return resolveMock(method, path, body);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  /* 演示模式：优先本地数据，周期性探活真实后端 */
  if (demoMode.value) {
    const now = Date.now();
    if (!probing.value && now - lastProbe > 60_000) {
      probing.value = true;
      lastProbe = now;
      rawFetch('/music/sources', { method: 'HEAD' })
        .then((r) => {
          if (r.ok) demoMode.value = false; // 后端恢复了
        })
        .catch(() => {})
        .finally(() => (probing.value = false));
    }
    const m = mockResponse(path, init);
    if (m) {
      if (m.status >= 400) throw new ApiError(m.data?.message || `请求失败 (${m.status})`, m.status);
      return m.data as T;
    }
    throw new ApiError('演示模式不支持该操作', 501);
  }

  let res: Response;
  try {
    res = await rawFetch(path, init);
  } catch {
    /* 网络不通：静态托管场景 → 切演示模式并重放 */
    setDemoMode();
    return request<T>(path, init);
  }
  if (!res.ok) {
    if ([404, 502, 503, 504].includes(res.status)) {
      // Pages 上没有 /api → 进入演示模式并重放本次请求
      setDemoMode();
      return request<T>(path, init);
    }
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

/** 外链封面：演示模式直接用原链，否则走服务端代理（解决 CORS，供取色） */
export function proxyImage(url?: string): string | undefined {
  if (!url) return undefined;
  if (demoMode.value) return url;
  return `${BASE}/music/proxy/image?url=${encodeURIComponent(url)}`;
}
