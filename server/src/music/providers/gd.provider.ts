import { Provider, RawSong } from '../provider.interface';
import { HealthTracker, RateLimiter, TtlCache } from '../runtime';
import { httpJson, httpText, norm, parseDuration, pick } from '../util';

/**
 * GD 音乐台聚合音源（music-api.gdstudio.xyz）
 * 同一接口通过 source 参数覆盖网易云/酷我/酷狗/QQ/B站等多个平台，
 * 每个平台实例化一个 Provider 视图。
 */
export class GdProvider implements Provider {
  readonly healthy = new HealthTracker();
  readonly supportsPlaylist = false;
  private limiter = new RateLimiter(600);
  private urlCache = new TtlCache(240);
  private lyricCache = new TtlCache(240);
  private picCache = new TtlCache(120);

  private static BASE = 'https://music-api.gdstudio.xyz/api.php';

  constructor(
    readonly key: string,
    readonly label: string,
    private gdSource: string,
  ) {}

  private async call(params: Record<string, string | number>, timeoutMs = 7000): Promise<any> {
    await this.limiter.acquire();
    // 注意：GD 接口不认 + 号空格编码，必须使用 %20
    const qs = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');
    const url = `${GdProvider.BASE}?${qs}`;
    try {
      const text = await httpText(url, {}, timeoutMs);
      this.healthy.ok();
      const t = text.trim();
      if (t.startsWith('{') || t.startsWith('[')) return JSON.parse(t);
      return t; // pic 等接口直接返回字符串
    } catch (e: any) {
      this.healthy.fail();
      throw e;
    }
  }

  async search(keyword: string, limit: number): Promise<RawSong[]> {
    const data = await this.call({ types: 'search', source: this.gdSource, name: keyword, count: limit, pages: 1 });
    if (!Array.isArray(data)) return [];
    const out: RawSong[] = [];
    for (const o of data) {
      const sourceId = String(pick(o, 'id', 'sourceId', 'songId', 'hash') ?? '');
      const title = String(pick(o, 'name', 'title', 'song', 'songName') ?? '').trim();
      if (!sourceId || !title) continue;
      let artist = pick(o, 'artist', 'singer', 'artists', 'author');
      if (Array.isArray(artist)) artist = artist.map((a: any) => a?.name ?? a).join(' / ');
      const album = pick(o, 'album', 'albumName', 'album_title');
      out.push({
        source: this.key,
        sourceId,
        title,
        artist: String(artist ?? '未知歌手').trim(),
        album: album ? String(album) : undefined,
        duration: parseDuration(pick(o, 'duration', 'interval', 'timeLength')),
        cover: pick(o, 'pic', 'cover', 'album_pic'),
      });
    }
    return out;
  }

  async getSongUrl(sourceId: string, br: number): Promise<{ url: string; br?: number }> {
    const ck = `${this.key}:${sourceId}:${br}`;
    const hit = this.urlCache.get<{ url: string; br?: number }>(ck);
    if (hit) return hit;
    const data = await this.call({ types: 'url', source: this.gdSource, id: sourceId, br });
    const url = typeof data === 'string' ? data : pick(data ?? {}, 'url');
    if (!url) throw new Error('无可播放链接');
    const result = { url: String(url), br: Number(pick(data ?? {}, 'br')) || br };
    this.urlCache.set(ck, result, 1200);
    return result;
  }

  async getLyric(sourceId: string): Promise<{ lrc: string; tlrc?: string }> {
    const ck = `${this.key}:${sourceId}`;
    const hit = this.lyricCache.get<{ lrc: string; tlrc?: string }>(ck);
    if (hit) return hit;
    const data = await this.call({ types: 'lyric', source: this.gdSource, id: sourceId });
    let lrc = '';
    let tlrc: string | undefined;
    if (typeof data === 'string') {
      lrc = data;
    } else if (data && typeof data === 'object') {
      lrc = String(pick(data, 'lyric', 'lrc') ?? '');
      tlrc = pick(data, 'tlyric', 'trans', 'translation');
      if (tlrc) tlrc = String(tlrc);
    }
    const result = { lrc: lrc || '', tlrc: tlrc || undefined };
    this.lyricCache.set(ck, result, 86400);
    return result;
  }

  async getPic(sourceId: string, size: number): Promise<string | undefined> {
    const ck = `${this.key}:${sourceId}:${size}`;
    const hit = this.picCache.get<string>(ck);
    if (hit !== undefined) return hit;
    try {
      const data = await this.call({ types: 'pic', source: this.gdSource, id: sourceId, size });
      const url = typeof data === 'string' ? data : pick(data ?? {}, 'url', 'pic');
      const result = url ? String(url) : '';
      this.picCache.set(ck, result, 604800);
      return result || undefined;
    } catch {
      return undefined;
    }
  }
}

/** 兜底归一化导出（供聚合去重使用） */
export const normKey = norm;
