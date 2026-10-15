import { GdProvider } from './providers/gd.provider';
import { NeteaseProvider } from './providers/netease.provider';
import { DemoProvider } from './providers/demo.provider';
import { KuwoProvider } from './providers/kuwo.provider';
import { Provider, SourceMeta } from './provider.interface';

/** 音源注册表：新增音源 = 实例化 Provider 并加入数组 */
export function createRegistry(): Map<string, Provider> {
  const list: Provider[] = [
    new NeteaseProvider(),
    // Listen1 同款酷我直连（r.s 搜索 + antiserver 直链，快且稳）
    new KuwoProvider(),
    // GD 聚合：网易云镜像（可解析 VIP/灰色歌直链，ID 与网易云一致）+ B站
    new GdProvider('netease-gd', '网易云聚合', 'netease'),
    new GdProvider('bilibili', 'B站', 'bilibili'),
    new DemoProvider(),
  ];
  return new Map(list.map((p) => [p.key, p]));
}

export function sourcesMeta(registry: Map<string, Provider>): SourceMeta[] {
  return [...registry.values()].map((p) => ({
    key: p.key,
    label: p.label,
    available: p.healthy.available,
    score: p.healthy.score,
    supportsPlaylist: p.supportsPlaylist,
  }));
}
