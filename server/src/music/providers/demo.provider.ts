import { Provider, RawSong } from '../provider.interface';
import { HealthTracker, TtlCache } from '../runtime';

/** 免费示例音频（SoundHelix 公开测试曲，可正常播放） */
const AUDIO = (n: number) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;

interface DemoSong extends RawSong {
  audio: string;
  lrc?: string;
}

/** 内置演示歌词（海雾来信 · 虚构） */
const DEMO_LRC: string = [
  '[ti:海雾来信]',
  '[ar:陈屿]',
  '[by:聆境演示]',
  '[00:08.50]海雾漫过七点的堤岸',
  '[00:15.20]邮筒吞下最后一封信',
  '[00:22.00]灯塔把光调得很轻',
  '[00:28.80]怕惊醒睡着的船鸣',
  '[00:36.50]你说过风有形状',
  '[00:43.20]是邮票背面那种微凉',
  '[00:51.00]我把潮汐写进备忘录',
  '[00:58.40]涨落之间都是回信',
  '[01:07.00]海雾来信 没有署名',
  '[01:14.60]落款是一整片黎明',
  '[01:22.30]我把耳朵借给灯塔',
  '[01:30.10]听光走完最后一厘米',
  '[01:39.50]若明天雾还没散',
  '[01:46.80]就让船替我向你靠岸',
  '[01:56.00]海雾来信 慢慢地读',
  '[02:04.20]每一行都通向你的天气',
].join('\n');

/** 内置演示曲库（虚构曲目，与 UI 设计稿一致） */
const DEMO_SONGS: DemoSong[] = [
  demo(1, '海雾来信', '陈屿', '海雾来信', 252, 1, DEMO_LRC),
  demo(2, '二十二点的月台', '陈屿', '月台手记', 228, 2),
  demo(3, '晚风邮局', '雾岛电台', '晚风邮局', 275, 3),
  demo(4, '南方公园的长椅', '山鹿', '长椅上的四点半', 206, 4),
  demo(5, '云的收件箱', '白噪合唱团', '云的收件箱', 302, 5),
  demo(6, '骑车穿过梧桐巷', '山鹿', '梧桐巷以南', 238, 6),
  demo(7, '雨停之前', '苏芮拉', '雨停之前', 261, 7),
  demo(8, '六月的风筝线', '陆一舟', '风筝线', 213, 8),
  demo(9, '潮汐备忘录', '雾岛电台', '潮汐备忘录', 287, 9),
  demo(10, '银河便利店', '白噪合唱团', '银河便利店', 224, 10),
  demo(11, '初雪的信号', '陈屿', '初雪信号', 258, 11),
  demo(12, '沙洲慢邮', '陆一舟', '沙洲慢邮', 316, 12),
  demo(13, '唱片行的下午', '苏芮拉', '唱片行的下午', 231, 13),
  demo(14, '十四楼的星空', '白噪合唱团', '十四楼的星空', 245, 14),
  demo(15, '野莓汽水', '糖刺梨', '野莓汽水', 188, 15),
  demo(16, '通勤宇宙', '雾岛电台', '通勤宇宙', 219, 16),
];

function demo(i: number, title: string, artist: string, album: string, dur: number, audioN: number, lrc?: string): DemoSong {
  return {
    source: 'demo',
    sourceId: `d${i}`,
    title,
    artist,
    album,
    duration: dur,
    cover: undefined,
    audio: AUDIO(audioN),
    lrc,
  };
}

const TRANSLATION: Record<string, string> = {
  '海雾漫过七点的堤岸': 'The sea fog rolls over the seven o’clock shore',
  '邮筒吞下最后一封信': 'The postbox swallows the final letter',
  '灯塔把光调得很轻': 'The lighthouse turns its light down soft',
  '怕惊醒睡着的船鸣': 'Afraid to wake the sleeping ship horns',
  '你说过风有形状': 'You once said the wind has a shape',
  '是邮票背面那种微凉': 'Cool like the back of a postage stamp',
  '我把潮汐写进备忘录': 'I write the tides into my notes',
  '涨落之间都是回信': 'Between rise and fall, all of it your reply',
  '海雾来信 没有署名': 'Letters from the sea fog, unsigned',
  '落款是一整片黎明': 'Signed with a whole stretch of dawn',
  '我把耳朵借给灯塔': 'I lend my ears to the lighthouse',
  '听光走完最后一厘米': 'Listening to light finish its last centimeter',
  '若明天雾还没散': 'If tomorrow the fog still hangs',
  '就让船替我向你靠岸': 'Let the boat drift me toward your shore',
  '海雾来信 慢慢地读': 'Letters from the sea fog, read slowly',
  '每一行都通向你的天气': 'Each line leading to your weather',
};

/** 演示音源：本地虚构曲库 + 免费示例音频，保证任何网络环境下可播 */
export class DemoProvider implements Provider {
  readonly key = 'demo';
  readonly label = '演示';
  readonly healthy = new HealthTracker();
  readonly supportsPlaylist = false;
  private lyricCache = new TtlCache(120);

  async search(keyword: string, limit: number): Promise<RawSong[]> {
    const kw = keyword.trim().toLowerCase();
    if (!kw) {
      // 仅空关键词时输出全量（供推荐降级使用）
      return DEMO_SONGS.slice(0, limit).map(({ audio, lrc, ...raw }) => raw);
    }
    // 有关键词时只返回真实匹配，宁缺毋滥（避免在竞速中抢占真实音源）
    return DEMO_SONGS.filter(
      (s) => s.title.toLowerCase().includes(kw) || s.artist.toLowerCase().includes(kw) || s.album!.toLowerCase().includes(kw),
    )
      .slice(0, limit)
      .map(({ audio, lrc, ...raw }) => raw);
  }

  async getSongUrl(sourceId: string): Promise<{ url: string }> {
    const song = DEMO_SONGS.find((s) => s.sourceId === sourceId);
    if (!song) throw new Error('演示曲库中未找到该歌曲');
    return { url: song.audio };
  }

  async getLyric(sourceId: string): Promise<{ lrc: string; tlrc?: string }> {
    const hit = this.lyricCache.get<{ lrc: string; tlrc?: string }>(sourceId);
    if (hit) return hit;
    const song = DEMO_SONGS.find((s) => s.sourceId === sourceId);
    if (!song?.lrc) return { lrc: '' };
    // 生成双语：在原歌词行后插入翻译行
    const lines = song.lrc.split('\n').map((line) => {
      const m = line.match(/^\[(\d+:\d+\.\d+)\](.+)$/);
      if (!m) return line;
      const trans = TRANSLATION[m[2].trim()];
      return trans ? `${line}\n[${m[1]}]${trans}` : line;
    });
    const result = { lrc: song.lrc, tlrc: lines.join('\n') };
    this.lyricCache.set(sourceId, result, 86400);
    return result;
  }
}

export const DEMO_SEEDS = DEMO_SONGS;
