/** 编辑精选歌单库（参考网易云官方歌单/Spotify editorial 的分类结构，关键词驱动聚合） */
export interface EditorPlaylist {
  id: string;
  name: string;
  desc: string;
  tint: string;
  kws: string[];
}

const T = {
  green: 'linear-gradient(135deg,#5B8A72,#33523F)',
  night: 'linear-gradient(135deg,#31415E,#1B2438)',
  teal: 'linear-gradient(135deg,#2E4A52,#182B31)',
  apricot: 'linear-gradient(135deg,#E8A87C,#C97B4E)',
  slate: 'linear-gradient(135deg,#4E6470,#2C3A42)',
  kraft: 'linear-gradient(135deg,#A98F6B,#6E5A3F)',
  violet: 'linear-gradient(135deg,#8A7BB8,#4F4370)',
  mocha: 'linear-gradient(135deg,#B08968,#6F4E37)',
  berry: 'linear-gradient(135deg,#B35B6B,#5E2F3B)',
  forest: 'linear-gradient(135deg,#6B8F5E,#33512B)',
  ocean: 'linear-gradient(135deg,#4A6E86,#253B4A)',
  plum: 'linear-gradient(135deg,#7A5B8A,#3F2F52)',
};

export const EDITOR_CATALOG: EditorPlaylist[] = [
  { id: 'e1', name: '华语流行风向标', desc: '每周更新的热门华语新歌与热单', tint: T.apricot, kws: ['华语 流行 热门', '华语 新歌'] },
  { id: 'e2', name: '私人雷达 · 通勤伴侣', desc: '节奏稳定的通勤向精选，通勤 38 分钟刚好', tint: T.teal, kws: ['通勤 节奏', '路上 城市 流行'] },
  { id: 'e3', name: '深夜情绪收容所', desc: '低落但清醒，给夜里睡不着的人', tint: T.night, kws: ['深夜 民谣', '失眠 钢琴'] },
  { id: 'e4', name: '咖啡馆爵士时光', desc: 'Bossa Nova 与慵懒人声，适合午后', tint: T.mocha, kws: ['爵士 咖啡', 'bossa nova'] },
  { id: 'e5', name: '民谣小镇漫游指南', desc: '从南山到北方小城，木吉他不停站', tint: T.forest, kws: ['民谣 吉他', '民谣 小城'] },
  { id: 'e6', name: '电子律动实验室', desc: 'Synthwave 与极简节拍，戴上耳机起飞', tint: T.violet, kws: ['电子 舞曲', 'synthwave'] },
  { id: 'e7', name: '学习专注 · 无歌词', desc: '后摇与轻音乐，打扰退散', tint: T.green, kws: ['专注 轻音乐', '学习 纯音乐'] },
  { id: 'e8', name: '健身燃脂节拍', desc: 'BPM 拉满，最后一组再来一遍', tint: T.berry, kws: ['健身 电音', '运动 节奏'] },
  { id: 'e9', name: '雨天阅读伴侣', desc: '雨声打底，钢琴与弦乐不抢戏', tint: T.slate, kws: ['雨天 钢琴', '雨声 轻音乐'] },
  { id: 'e10', name: '复古粤语金曲', desc: '狮子山下到千禧年代，时光机已就位', tint: T.kraft, kws: ['粤语 经典', '粤语 老歌'] },
  { id: 'e11', name: '日系城市巡航', desc: 'City Pop 与都市夜景更配', tint: T.ocean, kws: ['city pop', '日语 城市流行'] },
  { id: 'e12', name: '国风古韵', desc: '筝笛入耳，山河入梦', tint: T.green, kws: ['古风 国风', '中国风'] },
  { id: 'e13', name: '说唱新声代', desc: 'Flow 与 Punchline，说唱输入法', tint: T.night, kws: ['说唱 中文', 'hip hop'] },
  { id: 'e14', name: '轻音乐 · 缓解焦虑', desc: '低音量无害循环，情绪慢慢落下来', tint: T.slate, kws: ['放松 轻音乐', '治愈 钢琴'] },
  { id: 'e15', name: '校园青春回忆杀', desc: '毕业季、晚自习与操场的风', tint: T.forest, kws: ['校园 民谣', '青春 毕业'] },
  { id: 'e16', name: '星空 · 氛围后摇', desc: '三分钟铺垫，一分钟爆发', tint: T.plum, kws: ['post-rock 后摇', '氛围 器乐'] },
  { id: 'e17', name: '慵懒 R&B 时刻', desc: '下午四点的丝绒质感', tint: T.apricot, kws: ['r&b 慵懒', 'soul 节奏'] },
  { id: 'e18', name: '冬日暖阳民谣', desc: '围巾、热可可与轻微的炉火声', tint: T.kraft, kws: ['冬天 温暖 民谣', '炉火 民谣'] },
  { id: 'e19', name: '车载重低音', desc: '低频给足，隧道里开大点', tint: T.teal, kws: ['车载 节奏', '低音 电子'] },
  { id: 'e20', name: '睡前哄睡曲库', desc: '音量调小，世界调暗', tint: T.night, kws: ['助眠 轻音乐', '睡前 钢琴'] },
  { id: 'e21', name: '清晨唤醒计划', desc: '从被窝到清醒只差一首歌', tint: T.apricot, kws: ['清晨 活力', 'morning 流行'] },
  { id: 'e22', name: '90 后回忆杀', desc: '千禧年代的随身听回来了', tint: T.kraft, kws: ['90后 经典', '千禧 老歌'] },
  { id: 'e23', name: '演唱会大合唱', desc: 'Live 现场万人合唱的震撼', tint: T.berry, kws: ['live 现场', '演唱会 现场版'] },
  { id: 'e24', name: '世界音乐漫游', desc: '从安第斯到撒哈拉的声音明信片', tint: T.ocean, kws: ['世界音乐', '拉丁 民族'] },
];
