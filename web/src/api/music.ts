import { get, post } from './client';
import type { LyricLine, Song, SourceMeta } from '@/types';

export interface SearchResult {
  songs: Song[];
  sources: SourceMeta[];
}

export const musicApi = {
  async search(keyword: string, sources?: string[], limit = 20): Promise<SearchResult> {
    const qs = new URLSearchParams({ keyword, limit: String(limit) });
    if (sources?.length) qs.set('sources', sources.join(','));
    return get(`/music/search?${qs}`);
  },

  async resolveUrl(sources: { source: string; sourceId: string }[], br: number, hint?: { title?: string; artist?: string }) {
    const songs = sources.map((s) => ({ ...s, title: hint?.title, artist: hint?.artist }));
    return get<{ url: string; br: number; source: string; sourceId: string; matched?: { source: string; sourceId: string } }>(
      `/music/url?songs=${encodeURIComponent(JSON.stringify(songs))}&br=${br}`,
    );
  },

  /** LRC → 行级歌词（含翻译合并） */
  async lyric(source: string, sourceId: string): Promise<LyricLine[]> {
    const r = await get<{ lrc: string; tlrc?: string }>(
      `/music/lyric?source=${encodeURIComponent(source)}&songId=${encodeURIComponent(sourceId)}`,
    );
    return parseLrc(r.lrc, r.tlrc);
  },

  async pic(source: string, sourceId: string, size = 300): Promise<string | undefined> {
    const r = await get<{ url?: string }>(
      `/music/pic?source=${encodeURIComponent(source)}&songId=${encodeURIComponent(sourceId)}&size=${size}`,
    );
    return r.url;
  },

  daily(ratio: number, count = 24) {
    return get<{ songs: Song[]; date: string }>(`/music/daily?ratio=${ratio}&count=${count}`);
  },

  radio(mood: string) {
    return get<{ label: string; songs: Song[] }>(`/music/radio/${mood}`);
  },

  editorList() {
    return get<{ id: string; name: string; desc: string; tint: string; songCount: number }[]>('/music/editor');
  },

  editorDetail(id: string) {
    return get<{ id: string; name: string; desc: string; tint: string; songs: Song[] }>(`/music/editor/${encodeURIComponent(id)}`);
  },

  newSongs(limit = 12) {
    return get<{ songs: Song[] }>(`/music/new?limit=${limit}`);
  },

  sources() {
    return get<SourceMeta[]>('/music/sources');
  },

  resolvePlaylist(link: string) {
    return post<{ name: string; cover?: string; source: string; sourceId: string; trackCount: number }>('/music/import/resolve', { link });
  },
};

/** LRC 解析：[mm:ss.xx] 行；翻译按时间戳就近合并 */
export function parseLrc(lrc?: string, tlrc?: string): LyricLine[] {
  const tag = /^\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\](.*)$/;
  const parse = (text?: string) => {
    const out: { t: number; text: string }[] = [];
    for (const raw of (text || '').split('\n')) {
      const m = raw.match(tag);
      if (!m) continue;
      const t = parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + (m[3] ? parseInt(m[3].padEnd(3, '0'), 10) / 1000 : 0);
      const line = m[4].trim();
      if (!line || /^\[[a-z]+:/i.test(line)) continue; // 跳过元数据
      out.push({ t, text: line });
    }
    return out.sort((a, b) => a.t - b.t);
  };
  const cn = parse(lrc);
  if (!cn.length) return [];
  const trans = parse(tlrc);
  return cn.map((l) => {
    const en = trans.find((x) => Math.abs(x.t - l.t) < 0.6 && x.text);
    return { t: l.t, cn: l.text, en: en?.text };
  });
}
