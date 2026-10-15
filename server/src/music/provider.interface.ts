/** 音源适配器统一接口：新增源 = 实现本接口 + 在 registry 注册 */
export interface RawSong {
  source: string;
  sourceId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number; // 秒
  cover?: string;
}

/** 聚合合并后的歌曲（跨源同曲合一） */
export interface MergedSong {
  key: string; // title|artist 归一化匹配键
  title: string;
  artist: string;
  album?: string;
  duration: number; // 秒
  cover?: string;
  qualities: string[];
  sources: { source: string; sourceId: string; label: string }[];
}

export interface SourceMeta {
  key: string;
  label: string;
  available: boolean;
  score: number;
  supportsPlaylist: boolean;
}

export interface Provider {
  readonly key: string;
  readonly label: string;
  readonly supportsPlaylist: boolean;
  readonly healthy: Health;
  search(keyword: string, limit: number): Promise<RawSong[]>;
  getSongUrl(sourceId: string, br: number): Promise<{ url: string; br?: number }>;
  getLyric(sourceId: string): Promise<{ lrc: string; tlrc?: string }>;
  getPic?(sourceId: string, size: number): Promise<string | undefined>;
  fetchPlaylist?(id: string): Promise<{ name: string; cover?: string; tracks: RawSong[] }>;
}

export interface Health {
  available: boolean;
  score: number;
  ok?(): void;
  fail?(): void;
}

/** 各源音质能力提示（用于列表徽标展示） */
export const QUALITY_HINTS: Record<string, string[]> = {
  netease: ['无损'],
  kuwo: ['无损'],
  'netease-gd': ['无损'],
  bilibili: ['SQ'],
  demo: ['SQ'],
};

export const SOURCE_LABELS: Record<string, string> = {
  netease: '网易云',
  kuwo: '酷我',
  'netease-gd': '网易云聚合',
  bilibili: 'B站',
  demo: '演示',
};
