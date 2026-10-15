/** 静态演示模式内置数据（与 UI 设计稿一致的虚构曲库 + 免费示例音频） */
import type { LikedRow, Song } from '@/types';
import { sourceLabel } from '@/types';

const IMG = (p: string) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(p)}&image_size=square_hd`;

const C: Record<string, string> = {
  c1: IMG('Minimalist album cover art, morning mist over pine forest, sage green monochrome tones, soft gradient sky, zen nature photography, film grain'),
  c2: IMG('Minimalist album cover art, calm ocean waves at dusk, soft blue and cream palette, serene Japanese aesthetic photography, grainy texture'),
  c3: IMG('Album cover art, quiet city street at night after rain, warm streetlight bokeh, teal and amber cinematic tones, minimal composition'),
  c4: IMG('Album cover art, window seat of a moving bus, blurred countryside passing by, warm 35mm film photography, nostalgic pastel tones'),
  c5: IMG('Album cover art, pressed botanical leaves on cream paper, elegant flat lay, soft natural light, minimalist vintage botanical style'),
  c6: IMG('Album cover art, layered mountain ridges at sunrise, peach and lilac gradient sky, minimal landscape photography, grainy film look'),
  c7: IMG('Album cover art, abstract geometric shapes in soft pastel palette, paper texture, bauhaus inspired minimal poster design'),
  c8: IMG('Album cover art, rain drops on window with blurred warm cafe lights behind, moody cinematic, muted teal tones'),
  c9: IMG('Album cover art, minimal desert dunes under vast sky, warm sand tones, a tiny lone tree, premium minimal photography'),
  c10: IMG('Album cover art, close-up of vinyl record needle spinning on record player, warm afternoon light, nostalgic film photography'),
  c11: IMG('Album cover art, polaroid photo of quiet beach with pastel sunset, white sand, minimal composition, summer nostalgia'),
  c12: IMG('Album cover art, crescent moon over calm night sea, deep indigo and silver palette, minimal dreamy photography'),
  c13: IMG('Album cover art, cozy cafe table by window with latte and open notebook, warm morning light, soft focus lifestyle photography'),
  c14: IMG('Album cover art, quiet snow field with single footprints leading to distant trees, soft grey blue palette, minimal winter photography'),
};

const AUDIO = (n: number) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;

interface DemoSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  dur: number;
  cover: string;
  audio: string;
  tags: string[];
}

export const DEMO_SONGS: DemoSong[] = [
  { id: 'd1', title: '海雾来信', artist: '陈屿', album: '海雾来信', dur: 252, cover: C.c1, audio: AUDIO(1), tags: ['民谣', '深夜', '华语'] },
  { id: 'd2', title: '二十二点的月台', artist: '陈屿', album: '月台手记', dur: 228, cover: C.c3, audio: AUDIO(2), tags: ['民谣', '深夜', '通勤'] },
  { id: 'd3', title: '晚风邮局', artist: '雾岛电台', album: '晚风邮局', dur: 275, cover: C.c2, audio: AUDIO(3), tags: ['流行', '通勤', '夏日'] },
  { id: 'd4', title: '南方公园的长椅', artist: '山鹿', album: '长椅上的四点半', dur: 206, cover: C.c5, audio: AUDIO(4), tags: ['民谣', '午后'] },
  { id: 'd5', title: '云的收件箱', artist: '白噪合唱团', album: '云的收件箱', dur: 302, cover: C.c7, audio: AUDIO(5), tags: ['电子', '专注', '学习'] },
  { id: 'd6', title: '骑车穿过梧桐巷', artist: '山鹿', album: '梧桐巷以南', dur: 238, cover: C.c6, audio: AUDIO(6), tags: ['民谣', '清晨', '夏日'] },
  { id: 'd7', title: '雨停之前', artist: '苏芮拉', album: '雨停之前', dur: 261, cover: C.c8, audio: AUDIO(7), tags: ['流行', '雨天', '深夜'] },
  { id: 'd8', title: '六月的风筝线', artist: '陆一舟', album: '风筝线', dur: 213, cover: C.c11, audio: AUDIO(8), tags: ['民谣', '夏日', '校园'] },
  { id: 'd9', title: '潮汐备忘录', artist: '雾岛电台', album: '潮汐备忘录', dur: 287, cover: C.c12, audio: AUDIO(9), tags: ['电子', '深夜', '雨天'] },
  { id: 'd10', title: '银河便利店', artist: '白噪合唱团', album: '银河便利店', dur: 224, cover: C.c13, audio: AUDIO(10), tags: ['电子', '通勤', '爵士'] },
  { id: 'd11', title: '初雪的信号', artist: '陈屿', album: '初雪信号', dur: 258, cover: C.c14, audio: AUDIO(11), tags: ['民谣', '冬天'] },
  { id: 'd12', title: '沙洲慢邮', artist: '陆一舟', album: '沙洲慢邮', dur: 316, cover: C.c9, audio: AUDIO(12), tags: ['民谣', '午后', '自然'] },
  { id: 'd13', title: '唱片行的下午', artist: '苏芮拉', album: '唱片行的下午', dur: 231, cover: C.c10, audio: AUDIO(13), tags: ['爵士', '午后', '咖啡'] },
  { id: 'd14', title: '十四楼的星空', artist: '白噪合唱团', album: '十四楼的星空', dur: 245, cover: C.c4, audio: AUDIO(14), tags: ['流行', '深夜', '校园'] },
  { id: 'd15', title: '野莓汽水', artist: '糖刺梨', album: '野莓汽水', dur: 188, cover: C.c5, audio: AUDIO(15), tags: ['流行', '夏日', '清晨'] },
  { id: 'd16', title: '通勤宇宙', artist: '雾岛电台', album: '通勤宇宙', dur: 219, cover: C.c7, audio: AUDIO(16), tags: ['电子', '通勤', '专注'] },
];

export function demoSongToSong(s: DemoSong): Song {
  return {
    key: `demo:${s.id}`,
    title: s.title,
    artist: s.artist,
    album: s.album,
    duration: s.dur,
    cover: s.cover,
    qualities: ['SQ'],
    sources: [{ source: 'demo', sourceId: s.id, label: sourceLabel('demo') }],
  };
}

export const DEMO_LYRIC = {
  lrc: [
    '[ti:海雾来信]', '[ar:陈屿]', '[by:聆境演示]',
    '[00:08.50]海雾漫过七点的堤岸', '[00:15.20]邮筒吞下最后一封信',
    '[00:22.00]灯塔把光调得很轻', '[00:28.80]怕惊醒睡着的船鸣',
    '[00:36.50]你说过风有形状', '[00:43.20]是邮票背面那种微凉',
    '[00:51.00]我把潮汐写进备忘录', '[00:58.40]涨落之间都是回信',
    '[01:07.00]海雾来信 没有署名', '[01:14.60]落款是一整片黎明',
    '[01:22.30]我把耳朵借给灯塔', '[01:30.10]听光走完最后一厘米',
    '[01:39.50]若明天雾还没散', '[01:46.80]就让船替我向你靠岸',
    '[01:56.00]海雾来信 慢慢地读', '[02:04.20]每一行都通向你的天气',
  ].join('\n'),
  tlrc: [
    '[00:08.50]The sea fog rolls over the seven o’clock shore', '[00:15.20]The postbox swallows the final letter',
    '[00:22.00]The lighthouse turns its light down soft', '[00:28.80]Afraid to wake the sleeping ship horns',
    '[00:36.50]You once said the wind has a shape', '[00:43.20]Cool like the back of a postage stamp',
    '[00:51.00]I write the tides into my notes', '[00:58.40]Between rise and fall, all of it your reply',
    '[01:07.00]Letters from the sea fog, unsigned', '[01:14.60]Signed with a whole stretch of dawn',
    '[01:22.30]I lend my ears to the lighthouse', '[01:30.10]Listening to light finish its last centimeter',
    '[01:39.50]If tomorrow the fog still hangs', '[01:46.80]Let the boat drift me toward your shore',
    '[01:56.00]Letters from the sea fog, read slowly', '[02:04.20]Each line leading to your weather',
  ].join('\n'),
};

export const DEMO_EDITOR = [
  { id: 'e1', name: '华语流行风向标', desc: '每周更新的热门华语新歌与热单', tint: 'linear-gradient(135deg,#E8A87C,#C97B4E)', tags: ['流行'] },
  { id: 'e3', name: '深夜情绪收容所', desc: '低落但清醒，给夜里睡不着的人', tint: 'linear-gradient(135deg,#31415E,#1B2438)', tags: ['深夜'] },
  { id: 'e5', name: '民谣小镇漫游指南', desc: '从南山到北方小城，木吉他不停站', tint: 'linear-gradient(135deg,#6B8F5E,#33512B)', tags: ['民谣'] },
  { id: 'e6', name: '电子律动实验室', desc: 'Synthwave 与极简节拍，戴上耳机起飞', tint: 'linear-gradient(135deg,#8A7BB8,#4F4370)', tags: ['电子'] },
  { id: 'e7', name: '学习专注 · 无歌词', desc: '后摇与轻音乐，打扰退散', tint: 'linear-gradient(135deg,#5B8A72,#33523F)', tags: ['专注', '学习'] },
  { id: 'e4', name: '咖啡馆爵士时光', desc: 'Bossa Nova 与慵懒人声，适合午后', tint: 'linear-gradient(135deg,#B08968,#6F4E37)', tags: ['爵士', '咖啡'] },
  { id: 'e9', name: '雨天阅读伴侣', desc: '雨声打底，钢琴与弦乐不抢戏', tint: 'linear-gradient(135deg,#4E6470,#2C3A42)', tags: ['雨天'] },
  { id: 'e21', name: '清晨唤醒计划', desc: '从被窝到清醒只差一首歌', tint: 'linear-gradient(135deg,#E8A87C,#C97B4E)', tags: ['清晨'] },
];

export const DEMO_STATION_TAGS: Record<string, string[]> = {
  morning: ['清晨'], night: ['深夜'], commute: ['通勤'], rain: ['雨天'],
  focus: ['专注', '学习'], summer: ['夏日'], winter: ['冬天'], hiking: ['自然'],
};

/* ---------- 本地音乐库（localStorage 持久化） ---------- */
const LS_KEY = 'lj.mock.library';

interface MockLibrary {
  playlists: { id: number; name: string; desc?: string; cover?: string; tint?: string; createdAt: string; tracks: { id: number; title: string; artist: string; source: string; sourceId: string; cover?: string; duration: number }[] }[];
  liked: LikedRow[];
  history: LikedRow[];
  settings: any;
}

function seedLibrary(): MockLibrary {
  return {
    playlists: [
      { id: 1, name: '我喜欢的音乐', tint: 'linear-gradient(135deg,#5B8A72,#33523F)', createdAt: new Date().toISOString(), tracks: [] },
      { id: 2, name: '深夜写作（演示）', tint: 'linear-gradient(135deg,#31415E,#1B2438)', createdAt: new Date().toISOString(), tracks: [] },
    ],
    liked: [],
    history: [],
    settings: null,
  };
}

export function loadMockLibrary(): MockLibrary {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...seedLibrary(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return seedLibrary();
}

export function saveMockLibrary(lib: MockLibrary) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(lib));
  } catch { /* ignore */ }
}
