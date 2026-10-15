import { Provider, RawSong } from '../provider.interface';
import { HealthTracker, RateLimiter, TtlCache } from '../runtime';
import { httpText, parseDuration } from '../util';

/** 酷我 r.s 接口返回"单引号伪 JSON"，此转换器将其转为合法 JSON（值内转义保持原样） */
export function fixKuwoQuotes(s: string): string {
  let out = '';
  let inStr = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr && c === '\\') {
      out += c + (s[i + 1] ?? '');
      i++;
      continue;
    }
    if (c === "'") {
      out += '"';
      inStr = !inStr;
      continue;
    }
    out += c;
  }
  return out;
}

function unescapeKuwo(v: string): string {
  try {
    return JSON.parse(`"${v.replace(/"/g, '\\"')}"`) as string;
  } catch {
    return v.replace(/\\u0026/g, '&').replace(/&nbsp;/g, ' ').trim();
  }
}

/** kuwo 会双重转义 \uXXXX（如 \\u0026），JSON.parse 后仍残留字面 \uXXXX，这里再解一层 */
function decodeUnicodeEscapes(v: string): string {
  return v.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function pickField(item: string, keys: string[]): string {
  for (const k of keys) {
    const m = item.match(new RegExp(`'${k}'\\s*:\\s*'((?:\\\\.|[^'\\\\])*)'`));
    if (m) return unescapeKuwo(m[1]);
  }
  return '';
}

/** 酷我音源（Listen1 同款链路）：r.s 搜索 + antiserver 直链，快且稳 */
export class KuwoProvider implements Provider {
  readonly key = 'kuwo';
  readonly label = '酷我';
  readonly healthy = new HealthTracker();
  readonly supportsPlaylist = false;
  private limiter = new RateLimiter(500);
  private urlCache = new TtlCache(240);

  async search(keyword: string, limit: number): Promise<RawSong[]> {
    await this.limiter.acquire();
    const qs = new URLSearchParams({
      all: keyword,
      ft: 'music',
      itemset: 'web_2016',
      client: 'mp',
      pn: '0',
      rn: String(limit),
      rformat: 'json',
      encoding: 'utf8',
    });
    const url = `http://search.kuwo.cn/r.s?${qs.toString()}`;
    try {
      const text = await httpText(url, {}, 7000);
      this.healthy.ok();
      return this.parse(text, limit);
    } catch (e: any) {
      this.healthy.fail();
      throw e;
    }
  }

  private parse(text: string, limit: number): RawSong[] {
    const out: RawSong[] = [];
    let items: any[] = [];
    const fixed = fixKuwoQuotes(text);
    try {
      const data = JSON.parse(fixed);
      items = Array.isArray(data?.abslist) ? data.abslist : [];
    } catch {
      /* 逐项降级解析 */
    }
    if (!items.length) {
      for (const frag of fixed.split(/\}\s*,\s*\{/)) {
        const s = frag.trim();
        const t = (s.startsWith('{') ? s : `{${s}`).replace(/\}\s*$/m, '}') + (s.endsWith('}') ? '' : '}');
        try {
          const o = JSON.parse(t);
          if (o && o.MUSICRID) items.push(o);
        } catch {
          /* 跳过解析失败片段 */
        }
      }
    }
    for (const o of items) {
      const sourceId = String(o.MUSICRID ?? '').replace(/^MUSIC_/, '');
      const title = String(o.NAME ?? o.SONGNAME ?? '')
        .replace(/&nbsp;/g, ' ')
        .replace(/<[^>]+>/g, '')
        .trim();
      if (!sourceId || !title) continue;
      out.push({
        source: this.key,
        sourceId,
        title: decodeUnicodeEscapes(title),
        artist: decodeUnicodeEscapes(String(o.ARTIST ?? '')) || '未知歌手',
        album: o.ALBUM ? decodeUnicodeEscapes(String(o.ALBUM)) : undefined,
        duration: parseDuration(String(o.DURATION ?? '0')),
        cover: undefined,
      });
      if (out.length >= limit) break;
    }
    return out;
  }

  async getSongUrl(sourceId: string, br: number): Promise<{ url: string; br?: number }> {
    const ck = `${sourceId}:${br}`;
    const hit = this.urlCache.get<{ url: string; br?: number }>(ck);
    if (hit) return hit;
    await this.limiter.acquire();
    const url = `http://antiserver.kuwo.cn/anti.s?type=convert_url&rid=MUSIC_${sourceId}&format=mp3&response=url&br=${br}k`;
    const text = (await httpText(url, {}, 7000)).trim();
    if (!/^https?:\/\//.test(text)) throw new Error('酷我直链不可用');
    const result = { url: text, br };
    this.urlCache.set(ck, result, 1200);
    return result;
  }

  async getLyric(_sourceId: string): Promise<{ lrc: string }> {
    // 酷我歌词接口不稳定，返回空由聚合层跨源兜底（默认用网易云歌词）
    return { lrc: '' };
  }
}
