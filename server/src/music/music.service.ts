import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createRegistry, sourcesMeta } from './registry';
import { MergedSong, Provider, QUALITY_HINTS, RawSong, SourceMeta } from './provider.interface';
import { TtlCache } from './runtime';
import { fail, norm } from './util';
import { EDITOR_CATALOG } from './editor.catalog';

export interface SongSpec {
  source: string;
  sourceId: string;
  title?: string;
  artist?: string;
}

const RADIO_STATIONS: Record<string, { label: string; kw: string }> = {
  morning: { label: '清晨咖啡', kw: '清晨 民谣 咖啡' },
  night: { label: '深夜写作', kw: '深夜 钢琴 民谣' },
  commute: { label: '通勤路上', kw: '通勤 节奏 城市' },
  rain: { label: '雨天书房', kw: '雨天 钢琴' },
  focus: { label: '专注心流', kw: 'post-rock 纯音乐 后摇' },
  summer: { label: '夏日野餐', kw: '夏天 吉他 清新' },
  winter: { label: '冬夜炉火', kw: '冬夜 民谣 温暖' },
  hiking: { label: '山野徒步', kw: '自然 口琴 民谣' },
};

const EXPLORE_POOL = [
  '清新 民谣 推荐', '城市流行', 'chill 电子', '书店 爵士', '钢琴 轻音乐',
  'indie 唱作人', '国风 古风', 'city pop', '后摇 氛围', 'r&b 慵懒',
];

@Injectable()
export class MusicService implements OnModuleInit {
  private registry = createRegistry();
  private urlCache = new TtlCache(200);
  private mergeCache = new TtlCache(120);
  private dailyCache = new TtlCache(24);
  private editorCache = new TtlCache(60);
  private picCache = new TtlCache(60);
  /** source:sourceId → 歌名/歌手（供歌词跨源兜底匹配） */
  private titleMap = new TtlCache(600);
  private lyricCrossCache = new TtlCache(120);
  private imgCache = new Map<string, { exp: number; buf: Buffer; ct: string }>();

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    // 预热演示源健康度
    this.registry.get('demo')?.healthy.ok?.();
  }

  sources(): SourceMeta[] {
    return sourcesMeta(this.registry);
  }

  private providerOf(key: string): Provider | undefined {
    return this.registry.get(key);
  }

  /** 健康源优先链（用于推荐类搜索） */
  private healthyChain(prefer: string[] = ['netease', 'kuwo', 'netease-gd', 'bilibili', 'demo']): Provider[] {
    return prefer
      .map((k) => this.providerOf(k))
      .filter((p): p is Provider => !!p && p.healthy.available)
      .sort((a, b) => b.healthy.score - a.healthy.score);
  }

  /** 并行全量搜索（带截止时间）：慢源超时不拖累整体，先到的先合并 */
  private async allSearch(kws: string[], limit: number, deadlineMs = 3500): Promise<RawSong[]> {
    const ps = this.healthyChain().filter((p) => p.key !== 'demo');
    if (!ps.length) return [];
    const out: RawSong[] = [];
    let pending = kws.length * ps.length;
    return new Promise((resolve) => {
      const finish = () => resolve(out);
      const timer = setTimeout(finish, deadlineMs);
      for (const kw of kws) {
        for (const p of ps) {
          p.search(kw, limit)
            .then((raws) => out.push(...raws))
            .catch(() => {})
            .finally(() => {
              pending -= 1;
              if (pending === 0) {
                clearTimeout(timer);
                finish();
              }
            });
        }
      }
    });
  }

  /** 并行竞速搜索：任一真实源先返回非空结果即胜出（演示源不参与竞速，仅作兜底） */
  private anySearch(kw: string, limit: number): Promise<RawSong[]> {
    const ps = this.healthyChain().filter((p) => p.key !== 'demo');
    return new Promise((resolve) => {
      if (!ps.length) return resolve([]);
      let pending = ps.length;
      let settled = false;
      ps.forEach((p) => {
        p.search(kw, limit)
          .then((raws) => {
            if (!settled && raws.length) {
              settled = true;
              resolve(raws);
            }
          })
          .catch(() => {})
          .finally(() => {
            pending -= 1;
            if (pending === 0 && !settled) resolve([]);
          });
      });
    });
  }

  /** 聚合搜索：并发多源 → 归一化 → 去重合并 */
  async search(keyword: string, sources?: string[], limit = 20): Promise<{ songs: MergedSong[]; sources: SourceMeta[] }> {
    const kw = (keyword || '').trim();
    if (!kw) return { songs: [], sources: this.sources() };
    const cacheKey = `s:${kw}:${(sources || []).join(',')}:${limit}`;
    const hit = this.mergeCache.get<{ songs: MergedSong[] }>(cacheKey);
    if (hit) return { songs: hit.songs, sources: this.sources() };

    const selected = (sources?.length ? sources : ['netease', 'kuwo', 'netease-gd', 'bilibili', 'demo'])
      .map((k) => this.providerOf(k))
      .filter((p): p is Provider => !!p && p.healthy.available);

    const settled = await Promise.allSettled(selected.map((p) => p.search(kw, limit)));
    const raws: RawSong[] = [];
    settled.forEach((r, i) => {
      if (r.status === 'fulfilled') raws.push(...r.value);
      else console.warn(`[search] ${selected[i].key} 失败: ${r.reason?.message}`);
    });

    const songs = this.mergeRaws(raws).slice(0, limit);
    this.mergeCache.set(cacheKey, { songs }, 120);
    return { songs, sources: this.sources() };
  }

  /** 归一化合并：同名同歌手聚合为一个结果，保留全部可用来源 */
  private mergeRaws(raws: RawSong[]): MergedSong[] {
    const map = new Map<string, MergedSong>();
    for (const r of raws) {
      if (!r.title || !r.sourceId) continue;
      this.titleMap.set(`${r.source}:${r.sourceId}`, { title: r.title, artist: r.artist }, 86400);
      const key = `${norm(r.title)}|${norm(r.artist).split('|')[0]}`;
      let item = map.get(key);
      if (!item) {
        item = {
          key,
          title: r.title,
          artist: r.artist,
          album: r.album,
          duration: r.duration || 0,
          cover: r.cover,
          qualities: [],
          sources: [],
        };
        map.set(key, item);
      }
      if (!item.sources.some((s) => s.source === r.source)) {
        item.sources.push({ source: r.source, sourceId: r.sourceId, label: this.providerOf(r.source)?.label ?? r.source });
        for (const q of QUALITY_HINTS[r.source] ?? []) {
          if (!item.qualities.includes(q)) item.qualities.push(q);
        }
      }
      if (!item.cover && r.cover) item.cover = r.cover;
      if (!item.duration && r.duration) item.duration = r.duration;
      if (!item.album && r.album) item.album = r.album;
    }
    return [...map.values()];
  }

  /**
   * 获取播放直链（提速版）：
   * 1) 命中缓存直接返回
   * 2) 所有来源「并行竞速」，最先成功的直接采用（而不是串行等待）
   * 3) 全部失败才跨源搜索同曲（同样并行竞速）
   */
  async getUrl(specs: SongSpec[], br = 320): Promise<{ url: string; br: number; source: string; sourceId: string; matched?: RawSong }> {
    for (const s of specs) {
      const hit = this.urlCache.get<{ url: string; br: number }>(`${s.source}:${s.sourceId}:${br}`);
      if (hit) return { ...hit, source: s.source, sourceId: s.sourceId };
    }

    /* 2) 并行直取 */
    const attempts = specs
      .map((s) => ({ s, p: this.providerOf(s.source) }))
      .filter(({ p }) => p && p.healthy.available)
      .map(({ s, p }) =>
        p!.getSongUrl(s.sourceId, br).then((r) => {
          if (!r?.url) throw new Error('空链接');
          const out = { url: r.url, br: r.br ?? br, source: s.source, sourceId: s.sourceId };
          this.urlCache.set(`${s.source}:${s.sourceId}:${br}`, { url: out.url, br: out.br }, 1200);
          return out;
        }),
      );
    if (attempts.length) {
      try {
        return await Promise.any(attempts);
      } catch {
        /* 全部失败，进入跨源匹配 */
      }
    }

    /* 3) 并行跨源搜索同曲 */
    const first = specs.find((s) => s.title);
    if (first?.title) {
      const kw = `${first.title} ${first.artist ?? ''}`.trim();
      const tried = new Set(specs.map((s) => s.source));
      const target = norm(first.title);
      const artistN = norm(first.artist ?? '');
      const matchers = this.healthyChain(['netease-gd', 'bilibili', 'netease', 'demo'])
        .filter((p) => !tried.has(p.key))
        .map(async (p) => {
          const found = await p.search(kw, 5);
          const cand =
            found.find((f) => norm(f.title).includes(target) || target.includes(norm(f.title))) ??
            (artistN ? found.find((f) => norm(f.artist).includes(artistN)) : undefined);
          if (!cand) throw new Error('无匹配');
          const r = await p.getSongUrl(cand.sourceId, br);
          if (!r?.url) throw new Error('空链接');
          const out = { url: r.url, br: r.br ?? br, source: p.key, sourceId: cand.sourceId, matched: cand };
          this.urlCache.set(`${p.key}:${cand.sourceId}:${br}`, { url: out.url, br: out.br }, 1200);
          return out;
        });
      if (matchers.length) {
        try {
          return await Promise.any(matchers);
        } catch {
          /* 继续 */
        }
      }
    }
    throw fail(404, '所有音源均未取到播放链接，可稍后重试或切换音质');
  }

  async getLyric(source: string, sourceId: string): Promise<{ lrc: string; tlrc?: string; source: string }> {
    const ck = `${source}:${sourceId}`;
    const hit = this.lyricCrossCache.get<{ lrc: string; tlrc?: string }>(ck);
    if (hit) return { ...hit, source };
    const p = this.providerOf(source);
    if (!p) return { lrc: '', source };
    try {
      const r = await p.getLyric(sourceId);
      if (r.lrc?.trim()) {
        this.lyricCrossCache.set(ck, r, 86400);
        return { ...r, source };
      }
    } catch {
      /* 进入跨源兜底 */
    }
    // 跨源歌词兜底：用歌名+歌手在网易云搜索同名曲并取其歌词（酷我/酷狗等无歌词接口时）
    const meta = this.titleMap.get<{ title: string; artist: string }>(ck);
    if (meta && source !== 'netease' && source !== 'netease-gd') {
      try {
        const kw = `${meta.title} ${meta.artist}`.trim();
        const found = await this.providerOf('netease')!.search(kw, 3);
        const target = norm(meta.title);
        const cand = found.find((f) => norm(f.title).includes(target) || target.includes(norm(f.title)));
        console.log(`[歌词兜底] ${ck} → netease 搜「${kw}」${found.length} 条, cand=${cand ? cand.sourceId : '无'}`);
        if (cand) {
          const r = await this.providerOf('netease')!.getLyric(cand.sourceId);
          if (r.lrc?.trim()) {
            const out = { lrc: r.lrc, tlrc: r.tlrc };
            this.lyricCrossCache.set(ck, out, 86400);
            return { ...out, source: 'netease' };
          }
        }
      } catch (e: any) {
        console.warn(`[歌词兜底] ${ck} 失败: ${e?.message}`);
      }
    } else if (!meta) {
      console.warn(`[歌词兜底] ${ck} 无标题元数据（未经过搜索流程）`);
    }
    return { lrc: '', source };
  }

  async getPic(source: string, sourceId: string, size = 300): Promise<{ url?: string }> {
    const p = this.providerOf(source);
    if (!p?.getPic) return {};
    const ck = `${source}:${sourceId}:${size}`;
    const hit = this.picCache.get<{ url?: string }>(ck);
    if (hit) return hit;
    try {
      const url = await p.getPic(sourceId, size);
      const out = { url };
      this.picCache.set(ck, out, 3600);
      return out;
    } catch {
      return {};
    }
  }

  /** 封面代理（带内存缓存，解决外链图 CORS，使前端可取色） */
  async proxyImage(url: string): Promise<{ buf: Buffer; ct: string } | null> {
    if (!/^https?:\/\//.test(url)) return null;
    const hit = this.imgCache.get(url);
    if (hit && hit.exp > Date.now()) return { buf: hit.buf, ct: hit.ct };
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get('content-type') || 'image/jpeg';
      if (this.imgCache.size >= 100) {
        const oldest = this.imgCache.keys().next().value;
        if (oldest) this.imgCache.delete(oldest);
      }
      this.imgCache.set(url, { exp: Date.now() + 7 * 86400_000, buf, ct });
      return { buf, ct };
    } catch {
      return null;
    }
  }

  /** 音频直链代理（流式透传，带 Range 支持，使前端 Web Audio 频谱可跨域） */
  async proxyAudio(url: string, range?: string): Promise<{ buf: ArrayBuffer; status: number; headers: Record<string, string> } | null> {
    if (!/^https?:\/\//.test(url)) return null;
    try {
      const headers: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      };
      if (range) headers['Range'] = range;
      const res = await fetch(url, { headers });
      if (!res.ok && res.status !== 206) return null;
      const out: Record<string, string> = {
        'Content-Type': res.headers.get('content-type') || 'audio/mpeg',
        'Accept-Ranges': res.headers.get('accept-ranges') || 'bytes',
      };
      const cr = res.headers.get('content-range');
      if (cr) out['Content-Range'] = cr;
      const cl = res.headers.get('content-length');
      if (cl) out['Content-Length'] = cl;
      return { buf: await res.arrayBuffer(), status: res.status, headers: out };
    } catch {
      return null;
    }
  }

  /** 每日推荐：本地画像（喜欢+历史）作种子，熟悉:探索按比例混合（种子/探索全部并行） */
  async daily(ratio = 0.7, count = 24): Promise<{ songs: MergedSong[]; date: string }> {
    const date = new Date().toISOString().slice(0, 10);
    const ck = `daily:${date}:${ratio}:${count}`;
    const hit = this.dailyCache.get<{ songs: MergedSong[]; date: string }>(ck);
    if (hit) return hit;

    const [liked, history] = await Promise.all([
      this.prisma.likedSong.findMany({ take: 60, orderBy: { addedAt: 'desc' } }),
      this.prisma.playHistory.findMany({ take: 60, orderBy: { playedAt: 'desc' } }),
    ]);
    const known = new Set([...liked, ...history].map((s) => `${norm(s.title)}|${norm(s.artist)}`));

    const artistCount = new Map<string, number>();
    for (const s of [...liked, ...history]) {
      if (!s.artist || s.artist === '未知歌手') continue;
      artistCount.set(s.artist, (artistCount.get(s.artist) ?? 0) + 1);
    }
    const seeds = [...artistCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([a]) => a);

    const collected: RawSong[] = [];
    const seen = new Set<string>();
    const pushAll = (raws: RawSong[], cap: number) => {
      for (const r of raws) {
        const key = `${norm(r.title)}|${norm(r.artist)}`;
        if (known.has(key) || seen.has(key)) continue;
        seen.add(key);
        collected.push(r);
        if (collected.length >= cap) break;
      }
    };

    // 熟悉部分：基于种子歌手并行搜索
    const familiarCap = Math.round(count * ratio);
    const famRes = await Promise.allSettled(seeds.map((a) => this.anySearch(a, 10)));
    for (const r of famRes) {
      if (collected.length >= familiarCap) break;
      if (r.status === 'fulfilled') pushAll(r.value, familiarCap);
    }

    // 探索部分：关键词池按日期轮换（并行）
    const dayNum = Number(date.replace(/-/g, '')) % EXPLORE_POOL.length;
    const exploreKws = [EXPLORE_POOL[dayNum], EXPLORE_POOL[(dayNum + 3) % EXPLORE_POOL.length], EXPLORE_POOL[(dayNum + 6) % EXPLORE_POOL.length]];
    const expRes = await Promise.allSettled(exploreKws.map((kw) => this.anySearch(kw, 12)));
    for (const r of expRes) {
      if (collected.length >= count) break;
      if (r.status === 'fulfilled') pushAll(r.value, count);
    }

    let songs = this.mergeRaws(collected);
    if (!songs.length) {
      // 完全降级：演示曲库
      const demo = this.providerOf('demo')!;
      songs = this.mergeRaws(await demo.search('', count));
    }
    songs = songs.slice(0, count);
    const out = { songs, date };
    this.dailyCache.set(ck, out, 3600);
    return out;
  }

  /** 情绪电台（并行竞速搜索） */
  async radio(mood: string, limit = 25): Promise<{ label: string; songs: MergedSong[] }> {
    const st = RADIO_STATIONS[mood];
    if (!st) throw fail(404, `未知电台: ${mood}`);
    const ck = `radio:${mood}`;
    const hit = this.mergeCache.get<{ label: string; songs: MergedSong[] }>(ck);
    if (hit) return hit;
    const raws = await this.allSearch([st.kw, st.kw.split(/\s+/)[0]], limit);
    const songs = raws.length ? this.mergeRaws(raws).slice(0, limit) : this.mergeRaws(await this.providerOf('demo')!.search('', limit));
    const out = { label: st.label, songs };
    this.mergeCache.set(ck, out, 1800);
    return out;
  }

  /** 新歌速递（并行竞速搜索） */
  async newSongs(limit = 12): Promise<{ songs: MergedSong[] }> {
    const ck = 'new';
    const hit = this.mergeCache.get<{ songs: MergedSong[] }>(ck);
    if (hit) return hit;
    const raws = await this.allSearch(['新歌 推荐', '新歌 2026'], 12);
    const songs = raws.length ? this.mergeRaws(raws).slice(0, limit) : this.mergeRaws((await this.providerOf('demo')!.search('', limit)).slice(0, limit));
    const out = { songs };
    this.mergeCache.set(ck, out, 1800);
    return out;
  }

  /* ---------------- 编辑精选歌单库（参考竞品官方歌单结构） ---------------- */

  editorList() {
    return EDITOR_CATALOG.map(({ id, name, desc, tint }) => ({ id, name, desc, tint, songCount: 26 }));
  }

  async editorDetail(id: string): Promise<{ id: string; name: string; desc: string; tint: string; songs: MergedSong[] }> {
    const item = EDITOR_CATALOG.find((x) => x.id === id);
    if (!item) throw fail(404, `未知编辑歌单: ${id}`);
    const date = new Date().toISOString().slice(0, 10);
    const ck = `editor:${id}:${date}`;
    const hit = this.editorCache.get<MergedSong[]>(ck);
    const songs = hit ?? (await this.buildEditorSongs(item.kws));
    this.editorCache.set(ck, { songs }, 3600);
    return { id: item.id, name: item.name, desc: item.desc, tint: item.tint, songs };
  }

  private async buildEditorSongs(kws: string[]): Promise<MergedSong[]> {
    const raws = await this.allSearch(kws, 12);
    let songs = this.mergeRaws(raws);
    if (!songs.length) {
      songs = this.mergeRaws(await this.providerOf('demo')!.search('', 26));
    }
    return songs.slice(0, 26);
  }

  /** 导入向导：解析分享链接 → 歌单曲目（网易云源） */
  async resolvePlaylist(link: string): Promise<{ name: string; cover?: string; source: string; sourceId: string; trackCount: number; tracks: RawSong[] }> {
    const m = link.match(/(?:id=|playlist\/)(\d+)/);
    const id = m?.[1] ?? (/^\d+$/.test(link.trim()) ? link.trim() : null);
    if (!id) throw fail(400, '无法从链接中解析歌单 ID，请粘贴网易云歌单分享链接');
    const p = this.providerOf('netease')!;
    if (!p.healthy.available) throw fail(503, '网易云音源暂时不可用，请稍后再试');
    const pl = await p.fetchPlaylist!(id);
    return { name: pl.name, cover: pl.cover, source: 'netease', sourceId: id, trackCount: pl.tracks.length, tracks: pl.tracks.slice(0, 200) };
  }
}
