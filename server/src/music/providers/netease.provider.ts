import { Provider, RawSong } from '../provider.interface';
import { HealthTracker, RateLimiter, TtlCache } from '../runtime';
import { httpJson, parseDuration, pick } from '../util';

/** 网易云直连源：搜索/歌词/歌单详情；播放直链仅在非 VIP 曲目下可用，失败自动走聚合 fallback */
export class NeteaseProvider implements Provider {
  readonly key = 'netease';
  readonly label = '网易云';
  readonly healthy = new HealthTracker();
  readonly supportsPlaylist = true;
  private limiter = new RateLimiter(500);
  private lyricCache = new TtlCache(120);
  private plCache = new TtlCache(60);
  /** 可选登录态：设置 NETEASE_MUSIC_U 后可读取隐私歌单、解锁更高音质 */
  private headers = {
    Referer: 'https://music.163.com',
    Cookie: process.env.NETEASE_MUSIC_U ? `MUSIC_U=${process.env.NETEASE_MUSIC_U}; appver=8.9.75;` : 'appver=8.9.75;',
  };

  async search(keyword: string, limit: number): Promise<RawSong[]> {
    await this.limiter.acquire();
    try {
      const body = new URLSearchParams({ s: keyword, type: '1', limit: String(limit), offset: '0' });
      const data = await httpJson<any>('https://music.163.com/api/search/get/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...this.headers },
        body: body.toString(),
      });
      this.healthy.ok();
      const songs = data?.result?.songs ?? [];
      return songs.map((o: any) => this.toRaw(o)).filter(Boolean) as RawSong[];
    } catch (e: any) {
      this.healthy.fail();
      throw e;
    }
  }

  private toRaw(o: any): RawSong | null {
    const id = o?.id ?? o?.songId;
    const title = o?.name ?? o?.title;
    if (!id || !title) return null;
    const artist = (o?.artists ?? o?.ar ?? [])
      .map((a: any) => a?.name)
      .filter(Boolean)
      .join(' / ');
    const rawCover = o?.album?.artist?.img1v1Url ?? o?.al?.picUrl ?? undefined;
    return {
      source: this.key,
      sourceId: String(id),
      title: String(title),
      artist: artist || '未知歌手',
      album: o?.album?.name ?? o?.al?.name ?? undefined,
      duration: Math.round((o?.duration ?? o?.dt ?? 0) / 1000),
      // 网易云搜索接口会返回通用占位图，交给惰性封面接口处理
      cover: rawCover && !rawCover.includes('5639395138885805') ? rawCover : undefined,
    };
  }

  async getSongUrl(sourceId: string, br: number): Promise<{ url: string; br?: number }> {
    await this.limiter.acquire();
    // 必须 POST ids 数组，GET 形式已返回"参数错误"
    const body = new URLSearchParams({ ids: `[${sourceId}]`, br: String(br * 1000) });
    const data = await httpJson<any>('https://music.163.com/api/song/enhance/player/url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...this.headers },
      body: body.toString(),
    });
    const url = data?.data?.[0]?.url;
    if (!url) throw new Error('网易云直链不可用（可能为 VIP/灰色歌曲）');
    return { url: String(url), br: Math.round((data?.data?.[0]?.br ?? br * 1000) / 1000) };
  }

  async getLyric(sourceId: string): Promise<{ lrc: string; tlrc?: string }> {
    const hit = this.lyricCache.get<{ lrc: string; tlrc?: string }>(sourceId);
    if (hit) return hit;
    await this.limiter.acquire();
    const data = await httpJson<any>(
      `https://music.163.com/api/song/lyric?id=${sourceId}&lv=1&kv=1&tv=-1`,
      { headers: this.headers },
    );
    const result = {
      lrc: String(data?.lrc?.lyric ?? ''),
      tlrc: data?.tlyric?.lyric ? String(data.tlyric.lyric) : undefined,
    };
    this.lyricCache.set(sourceId, result, 86400);
    return result;
  }

  /** 解析网易云歌单（v6 优先，回退 legacy 接口） */
  async fetchPlaylist(id: string): Promise<{ name: string; cover?: string; tracks: RawSong[] }> {
    const hit = this.plCache.get<{ name: string; cover?: string; tracks: RawSong[] }>(id);
    if (hit) return hit;
    await this.limiter.acquire(6000);

    let name = '';
    let cover: string | undefined;
    let tracks: any[] = [];
    try {
      const body = new URLSearchParams({ id, n: '300', s: '0' });
      const v6 = await httpJson<any>('https://music.163.com/api/v6/playlist/detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...this.headers },
        body: body.toString(),
      });
      const pl = v6?.playlist ?? (Array.isArray(v6?.playlists) ? v6.playlists[0] : null);
      name = pl?.name ?? '';
      cover = pl?.coverImgUrl ?? undefined;
      tracks = pl?.trackIds ?? [];
      if (pl?.tracks?.length) tracks = pl.tracks;
    } catch {
      /* 回退 legacy */
    }
    if (!tracks.length) {
      const legacy = await httpJson<any>(`https://music.163.com/api/playlist/detail?id=${id}`, {
        headers: this.headers,
      });
      const pl = legacy?.result?.playlist;
      name = pl?.name ?? name;
      cover = pl?.coverImgUrl ?? cover;
      tracks = pl?.tracks ?? [];
    }

    // v6 只返回 trackIds 时，需要补充歌曲详情
    if (tracks.length && !tracks[0]?.name) {
      const ids = tracks.map((t: any) => t.id ?? t).slice(0, 200);
      const detail = await httpJson<any>(
        `https://music.163.com/api/song/detail?ids=${encodeURIComponent(JSON.stringify(ids))}`,
        { headers: this.headers },
      );
      tracks = detail?.songs ?? [];
    }

    const result = {
      name: name || `网易云歌单 ${id}`,
      cover,
      tracks: tracks.map((o: any) => this.toRaw(o)).filter(Boolean) as RawSong[],
    };
    this.plCache.set(id, result, 3600);
    return result;
  }
}
