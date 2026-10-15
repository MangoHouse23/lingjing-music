/* ============================================================
   聆境 Lingjing · Mock Data（唯一数据源，页面禁止散落硬编码）
   封面图来自文生图 API（在线查看）；曲目/歌单均为演示用虚构内容
   ============================================================ */

const IMG = (p, s = 'square_hd') =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(p)}&image_size=${s}`;

const DB = window.DB = {
  /* ---------- 封面图库 ---------- */
  covers: {
    hero: IMG('Serene minimalist cinematic scene, a lone figure wearing headphones sitting on a misty green hill at dawn, soft sage green and cream palette, gentle fog layers, premium album artwork aesthetic, film grain', 'landscape_16_9'),
    c1: IMG('Minimalist album cover art, morning mist over pine forest, sage green monochrome tones, soft gradient sky, zen nature photography, film grain, premium aesthetic'),
    c2: IMG('Minimalist album cover art, calm ocean waves at dusk, soft blue and cream palette, serene Japanese aesthetic photography, grainy texture'),
    c3: IMG('Album cover art, quiet city street at night after rain, warm streetlight bokeh, teal and amber cinematic tones, minimal composition'),
    c4: IMG('Album cover art, window seat of a moving bus, blurred countryside passing by, warm 35mm film photography, nostalgic pastel tones, grain'),
    c5: IMG('Album cover art, pressed botanical leaves on cream paper, elegant flat lay, soft natural light, minimalist vintage botanical style'),
    c6: IMG('Album cover art, layered mountain ridges at sunrise, peach and lilac gradient sky, minimal landscape photography, grainy film look'),
    c7: IMG('Album cover art, abstract geometric shapes in soft pastel palette, paper texture, bauhaus inspired minimal poster design'),
    c8: IMG('Album cover art, rain drops on window with blurred warm cafe lights behind, moody cinematic, muted teal tones, shallow depth of field'),
    c9: IMG('Album cover art, minimal desert dunes under vast sky, warm sand tones, a tiny lone tree, premium minimal photography, grain'),
    c10: IMG('Album cover art, close-up of vinyl record needle spinning on record player, warm afternoon light, nostalgic film photography, cream and brown palette'),
    c11: IMG('Album cover art, polaroid photo of quiet beach with pastel sunset, white sand, minimal composition, summer nostalgia, film grain'),
    c12: IMG('Album cover art, crescent moon over calm night sea, deep indigo and silver palette, minimal dreamy photography, grain'),
    c13: IMG('Album cover art, cozy cafe table by window with latte and open notebook, warm morning light, soft focus lifestyle photography, cream tones'),
    c14: IMG('Album cover art, quiet snow field with single footprints leading to distant trees, soft grey blue palette, minimal winter photography'),
  },

  /* ---------- 音源 ---------- */
  sources: [
    { key: 'netease', name: '网易云' },
    { key: 'kugou', name: '酷狗' },
    { key: 'kuwo', name: '酷我' },
    { key: 'bili', name: 'B站' },
    { key: 'gd', name: 'GD音乐台' },
  ],

  /* ---------- 曲目（虚构演示曲库）---------- */
  songs: [
    { id: 's1', title: '海雾来信', artist: '陈屿', album: '海雾来信', dur: '4:12', cover: 'c1', quality: ['无损'], src: { netease: 1, kuwo: 1, bili: 1, gd: 1 } },
    { id: 's2', title: '二十二点的月台', artist: '陈屿', album: '月台手记', dur: '3:48', cover: 'c3', quality: ['Hi-Res', '无损'], src: { netease: 1, kugou: 1, kuwo: 1, gd: 1 } },
    { id: 's3', title: '晚风邮局', artist: '雾岛电台', album: '晚风邮局', dur: '4:35', cover: 'c2', quality: ['无损'], src: { netease: 1, kuwo: 1, gd: 1 } },
    { id: 's4', title: '南方公园的长椅', artist: '山鹿', album: '长椅上的四点半', dur: '3:26', cover: 'c5', quality: [], src: { kuwo: 1, bili: 1 } },
    { id: 's5', title: '云的收件箱', artist: '白噪合唱团', album: '云的收件箱', dur: '5:02', cover: 'c7', quality: ['无损'], src: { netease: 1, kugou: 1, gd: 1 } },
    { id: 's6', title: '骑车穿过梧桐巷', artist: '山鹿', album: '梧桐巷以南', dur: '3:58', cover: 'c6', quality: ['无损'], src: { netease: 1, kuwo: 1, bili: 1 } },
    { id: 's7', title: '雨停之前', artist: '苏芮拉', album: '雨停之前', dur: '4:21', cover: 'c8', quality: ['Hi-Res', '无损'], src: { netease: 1, kuwo: 1, gd: 1 } },
    { id: 's8', title: '六月的风筝线', artist: '陆一舟', album: '风筝线', dur: '3:33', cover: 'c11', quality: ['SQ'], src: { kugou: 1, kuwo: 1 } },
    { id: 's9', title: '潮汐备忘录', artist: '雾岛电台', album: '潮汐备忘录', dur: '4:47', cover: 'c12', quality: ['无损'], src: { netease: 1, bili: 1, gd: 1 } },
    { id: 's10', title: '银河便利店', artist: '白噪合唱团', album: '银河便利店', dur: '3:44', cover: 'c13', quality: ['无损'], src: { netease: 1, kugou: 1, kuwo: 1 } },
    { id: 's11', title: '初雪的信号', artist: '陈屿', album: '初雪信号', dur: '4:18', cover: 'c14', quality: ['无损'], src: { netease: 1, kuwo: 1, gd: 1 } },
    { id: 's12', title: '沙洲慢邮', artist: '陆一舟', album: '沙洲慢邮', dur: '5:16', cover: 'c9', quality: ['Hi-Res', '无损'], src: { netease: 1, kuwo: 1, bili: 1, gd: 1 } },
    { id: 's13', title: '唱片行的下午', artist: '苏芮拉', album: '唱片行的下午', dur: '3:51', cover: 'c10', quality: ['无损'], src: { netease: 1, kugou: 1, gd: 1 } },
    { id: 's14', title: '十四楼的星空', artist: '白噪合唱团', album: '十四楼的星空', dur: '4:05', cover: 'c4', quality: [], src: { kuwo: 1, bili: 1 } },
    { id: 's15', title: '野莓汽水', artist: '糖刺梨', album: '野莓汽水', dur: '3:08', cover: 'c5', quality: ['SQ'], src: { netease: 1, kuwo: 1 } },
    { id: 's16', title: '无风的下午三点', artist: '糖刺梨', album: '三点，无风', dur: '4:02', cover: 'c13', quality: ['无损'], src: { netease: 1, kugou: 1, gd: 1 } },
    { id: 's17', title: '通勤宇宙', artist: '雾岛电台', album: '通勤宇宙', dur: '3:39', cover: 'c7', quality: ['无损'], src: { netease: 1, kuwo: 1, bili: 1 } },
    { id: 's18', title: '蒲公英航线', artist: '山鹿', album: '蒲公英航线', dur: '4:26', cover: 'c9', quality: ['无损'], src: { netease: 1, kuwo: 1, gd: 1 } },
    { id: 's19', title: '夜航西飞', artist: '陆一舟', album: '夜航西飞', dur: '5:41', cover: 'c12', quality: ['Hi-Res', '无损'], src: { kugou: 1, kuwo: 1, gd: 1 } },
    { id: 's20', title: '台风天的信箱', artist: '苏芮拉', album: '台风天的信箱', dur: '4:14', cover: 'c8', quality: ['无损'], src: { netease: 1, kuwo: 1, bili: 1 } },
    { id: 's21', title: '木星旅馆', artist: '白噪合唱团', album: '木星旅馆', dur: '4:52', cover: 'c4', quality: ['无损'], src: { netease: 1, kugou: 1, gd: 1 } },
    { id: 's22', title: '落日收音机', artist: '糖刺梨', album: '落日收音机', dur: '3:27', cover: 'c2', quality: ['SQ'], src: { kuwo: 1, bili: 1 } },
  ],

  /* ---------- 我的歌单（侧栏 + 音乐库）---------- */
  playlists: [
    { id: 'p1', name: '我喜欢的音乐', curator: '我', count: 128, cover: 'c1', tint: 'linear-gradient(135deg,#5B8A72,#33523F)' },
    { id: 'p2', name: '深夜写作', curator: '我', count: 36, cover: 'c12', tint: 'linear-gradient(135deg,#31415E,#1B2438)' },
    { id: 'p3', name: '通勤降噪', curator: '我', count: 52, cover: 'c3', tint: 'linear-gradient(135deg,#2E4A52,#182B31)' },
    { id: 'p4', name: '夏天没有结束', curator: '我', count: 28, cover: 'c11', tint: 'linear-gradient(135deg,#E8A87C,#C97B4E)' },
    { id: 'p5', name: '雨天书房', curator: '我', count: 43, cover: 'c8', tint: 'linear-gradient(135deg,#4E6470,#2C3A42)' },
    { id: 'p6', name: '民谣巡游', curator: '我', count: 61, cover: 'c4', tint: 'linear-gradient(135deg,#A98F6B,#6E5A3F)' },
    { id: 'p7', name: '电子漫游', curator: '我', count: 24, cover: 'c7', tint: 'linear-gradient(135deg,#8A7BB8,#4F4370)' },
    { id: 'p8', name: '咖啡馆常客', curator: '我', count: 39, cover: 'c13', tint: 'linear-gradient(135deg,#B99B7A,#7A6248)' },
  ],

  /* ---------- 编辑精选（发现页）---------- */
  recPlaylists: [
    { id: 'r1', name: '晨间小清新精选', curator: '聆境编辑', count: 30, cover: 'c6', tint: 'linear-gradient(135deg,#D9A47E,#8A5A3B)' },
    { id: 'r2', name: '城市夜航指南', curator: '聆境编辑', count: 25, cover: 'c3', tint: 'linear-gradient(135deg,#2E4A52,#182B31)' },
    { id: 'r3', name: '海边日落电台', curator: '聆境编辑', count: 18, cover: 'c2', tint: 'linear-gradient(135deg,#4A6E86,#253B4A)' },
    { id: 'r4', name: '山谷民谣收集', curator: '聆境编辑', count: 22, cover: 'c5', tint: 'linear-gradient(135deg,#6B8F5E,#33512B)' },
    { id: 'r5', name: '极简氛围电子', curator: '聆境编辑', count: 20, cover: 'c7', tint: 'linear-gradient(135deg,#8A7BB8,#4F4370)' },
    { id: 'r6', name: '胶片年代感', curator: '聆境编辑', count: 26, cover: 'c10', tint: 'linear-gradient(135deg,#A98F6B,#6E5A3F)' },
    { id: 'r7', name: '雨声与钢琴', curator: '聆境编辑', count: 21, cover: 'c8', tint: 'linear-gradient(135deg,#4E6470,#2C3A42)' },
    { id: 'r8', name: '银河系冷门佳作', curator: '聆境编辑', count: 19, cover: 'c12', tint: 'linear-gradient(135deg,#31415E,#1B2438)' },
  ],

  /* ---------- 流派 · 情绪电台 ---------- */
  stations: [
    { id: 'st1', name: '清晨咖啡', desc: '低苦艾与晨光，开启不慌张的一天', icon: 'coffee', tint: 'linear-gradient(135deg,#B08968,#6F4E37)' },
    { id: 'st2', name: '深夜写作', desc: '低落但清醒，适合与文字独处', icon: 'moon', tint: 'linear-gradient(135deg,#31415E,#141C2E)' },
    { id: 'st3', name: '通勤路上', desc: '节奏刚好，地铁里的三十八分钟', icon: 'train-front', tint: 'linear-gradient(135deg,#2E4A52,#16303B)' },
    { id: 'st4', name: '雨天书房', desc: '雨声打底，钢琴与木吉他', icon: 'cloud-rain', tint: 'linear-gradient(135deg,#54707E,#2C3A42)' },
    { id: 'st5', name: '专注心流', desc: '无歌词后摇，打扰退散', icon: 'waves', tint: 'linear-gradient(135deg,#3F7A64,#1E4235)' },
    { id: 'st6', name: '夏日野餐', desc: '汽水味吉他弹唱合集', icon: 'sun', tint: 'linear-gradient(135deg,#E8A87C,#D06A3F)' },
    { id: 'st7', name: '冬夜炉火', desc: '民谣与热可可，轻微 Electric 火焰声', icon: 'flame', tint: 'linear-gradient(135deg,#A65B3B,#5E2F1C)' },
    { id: 'st8', name: '山野徒步', desc: '风声、虫鸣与口琴', icon: 'leaf', tint: 'linear-gradient(135deg,#6B8F5E,#33512B)' },
  ],

  /* ---------- 推荐与榜单 ---------- */
  daily: ['s3', 's1', 's9', 's5', 's12', 's17', 's7', 's18', 's2', 's13', 's21', 's6', 's11', 's16', 's4', 's10', 's20', 's8', 's19', 's15', 's14', 's22'],
  newSongs: ['s17', 's18', 's19', 's20', 's21', 's22'],
  recent: ['s1', 's9', 's16', 's5', 's12', 's3', 's13', 's21', 's2', 's7'],
  liked: ['s1', 's3', 's5', 's9', 's12', 's13', 's18'],
  downloaded: ['s1', 's2', 's5', 's7', 's9'],

  hotSearch: [
    { term: '海雾来信', heat: '478万' }, { term: '陈屿 新专辑', heat: '392万', tag: '热' },
    { term: '雨停之前 Live', heat: '341万' }, { term: '通勤 民谣', heat: '298万', tag: '新' },
    { term: '白噪合唱团', heat: '261万' }, { term: '深夜 写作歌单', heat: '217万' },
    { term: '落日收音机', heat: '185万' }, { term: '城市夜航', heat: '152万' },
    { term: '木星旅馆 Remix', heat: '128万', tag: '新' }, { term: '初雪 信号', heat: '96万' },
  ],
  searchHistory: ['晚风邮局', '苏芮拉', '通勤降噪', '雨声钢琴', '陆一舟'],
  searchResult: ['s1', 's3', 's9', 's13', 's16', 's17', 's22'],

  /* ---------- 正在播放 ---------- */
  now: {
    songId: 's1',
    quality: '无损',
    queue: ['s3', 's1', 's9', 's5', 's12', 's17', 's7', 's18', 's2', 's13'],
  },

  /* ---------- 歌词（逐字演示 · 海雾来信）---------- */
  lyrics: [
    { t: 8.5, cn: '海雾漫过七点的堤岸', en: 'The sea fog rolls over the seven o\u2019clock shore' },
    { t: 15.2, cn: '邮筒吞下最后一封信', en: 'The postbox swallows the final letter' },
    { t: 22.0, cn: '灯塔把光调得很轻', en: 'The lighthouse turns its light down soft' },
    { t: 28.8, cn: '怕惊醒睡着的船鸣', en: 'Afraid to wake the sleeping ship horns' },
    { t: 36.5, cn: '你说过风有形状', en: 'You once said the wind has a shape' },
    { t: 43.2, cn: '是邮票背面那种微凉', en: 'Cool like the back of a postage stamp' },
    { t: 51.0, cn: '我把潮汐写进备忘录', en: 'I write the tides into my notes' },
    { t: 58.4, cn: '涨落之间都是回信', en: 'Between rise and fall, all of it your reply' },
    { t: 67.0, cn: '海雾来信 没有署名', en: 'Letters from the sea fog, unsigned' },
    { t: 74.6, cn: '落款是一整片黎明', en: 'Signed with a whole stretch of dawn' },
    { t: 82.3, cn: '我把耳朵借给灯塔', en: 'I lend my ears to the lighthouse' },
    { t: 90.1, cn: '听光走完最后一厘米', en: 'Listening to light finish its last centimeter' },
    { t: 99.5, cn: '若明天雾还没散', en: 'If tomorrow the fog still hangs' },
    { t: 106.8, cn: '就让船替我向你靠岸', en: 'Let the boat drift me toward your shore' },
    { t: 116.0, cn: '海雾来信 慢慢地读', en: 'Letters from the sea fog, read slowly' },
    { t: 124.2, cn: '每一行都通向你的天气', en: 'Each line leading to your weather' },
  ],

  /* ---------- 导入演示 ---------- */
  importDemo: {
    ok: [
      { title: '晚风邮局', artist: '雾岛电台', cover: 'c2' },
      { title: '沙洲慢邮', artist: '陆一舟', cover: 'c9' },
      { title: '雨停之前', artist: '苏芮拉', cover: 'c8' },
    ],
    pending: [
      { title: '未命名的 Demo（翻录）', artist: '未知艺人', cover: 'c7' },
    ],
  },
};
