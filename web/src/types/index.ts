/** 聆境前端类型（与服务端 API 对齐） */

export interface SongSource {
  source: string;
  sourceId: string;
  label: string;
}

export interface Song {
  key: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // 秒
  cover?: string;
  qualities: string[];
  sources: SongSource[];
}

export interface SourceMeta {
  key: string;
  label: string;
  available: boolean;
  score: number;
  supportsPlaylist: boolean;
}

export interface LyricLine {
  t: number;
  cn: string;
  en?: string;
}

export interface PlaylistSummary {
  id: number;
  name: string;
  desc?: string;
  cover?: string;
  tint?: string;
  createdAt: string;
  _count: { tracks: number };
}

export interface Track {
  id: number;
  playlistId: number;
  songKey: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  cover?: string;
  source: string;
  sourceId: string;
  quality?: string;
  position: number;
}

export interface PlaylistDetail extends Omit<PlaylistSummary, '_count'> {
  tracks: Track[];
}

export interface LikedRow {
  key: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  cover?: string;
  source: string;
  sourceId: string;
  quality?: string;
  addedAt: string;
}

export interface HistoryRow extends Omit<LikedRow, 'addedAt'> {
  playedAt: string;
}

export interface SongPayload {
  source: string;
  sourceId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  cover?: string;
  quality?: string;
}

/** 歌单/曲目 → 可播放 Song */
export function trackToSong(t: Track | LikedRow | HistoryRow): Song {
  return {
    key: `${t.source}:${t.sourceId}`,
    title: t.title,
    artist: t.artist,
    album: t.album,
    duration: t.duration ?? 0,
    cover: t.cover,
    qualities: parseQuality(t.quality),
    sources: [{ source: t.source, sourceId: t.sourceId, label: sourceLabel(t.source) }],
  };
}

export function parseQuality(q?: string | null): string[] {
  try {
    const arr = q ? JSON.parse(q) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export const SOURCE_LABELS: Record<string, string> = {
  netease: '网易云',
  kuwo: '酷我',
  'netease-gd': '网易云聚合',
  bilibili: 'B站',
  demo: '演示',
};

export function sourceLabel(key: string): string {
  return SOURCE_LABELS[key] ?? key;
}

/** 歌曲 key = 源:源内ID */
export function songKey(s: { source: string; sourceId: string }): string {
  return `${s.source}:${s.sourceId}`;
}

/** 各源音质能力提示 */
export const QUALITY_HINTS: Record<string, string[]> = {
  netease: ['无损'],
  kuwo: ['无损'],
  'netease-gd': ['无损'],
  bilibili: ['SQ'],
  demo: ['SQ'],
};
