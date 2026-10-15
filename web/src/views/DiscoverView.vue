<script setup lang="ts">
/** P1 发现：每日推荐 / 心流入口 / 情绪电台 / 我的歌单 / 新歌速递 */
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import EditorCard from '@/components/EditorCard.vue';
import PlaylistCard from '@/components/PlaylistCard.vue';
import SongRow from '@/components/SongRow.vue';
import StationCard, { type Station } from '@/components/StationCard.vue';
import { musicApi } from '@/api/music';
import { useLibraryStore } from '@/stores/library';
import { usePlayerStore } from '@/stores/player';
import { toast, useUiStore } from '@/stores/toast';
import type { Song } from '@/types';
import { fmtDuration, greeting, todayInfo } from '@/utils/format';

const router = useRouter();
const player = usePlayerStore();
const lib = useLibraryStore();
const ui = useUiStore();

const daily = ref<Song[]>([]);
const dailyLoading = ref(true);
const newSongs = ref<Song[]>([]);
const editor = ref<{ id: string; name: string; desc: string; tint: string; songCount: number }[]>([]);
const heroSong = computed(() => daily.value[0]);

const STATIONS: Station[] = [
  { mood: 'morning', name: '清晨咖啡', desc: '低苦艾与晨光，开启不慌张的一天', icon: 'coffee', tint: 'linear-gradient(135deg,#B08968,#6F4E37)' },
  { mood: 'night', name: '深夜写作', desc: '低落但清醒，适合与文字独处', icon: 'moon', tint: 'linear-gradient(135deg,#31415E,#141C2E)' },
  { mood: 'commute', name: '通勤路上', desc: '节奏刚好，地铁里的三十八分钟', icon: 'train-front', tint: 'linear-gradient(135deg,#2E4A52,#16303B)' },
  { mood: 'rain', name: '雨天书房', desc: '雨声打底，钢琴与木吉他', icon: 'cloud-rain', tint: 'linear-gradient(135deg,#54707E,#2C3A42)' },
  { mood: 'focus', name: '专注心流', desc: '无歌词后摇，打扰退散', icon: 'waves', tint: 'linear-gradient(135deg,#3F7A64,#1E4235)' },
  { mood: 'summer', name: '夏日野餐', desc: '汽水味吉他弹唱合集', icon: 'sun', tint: 'linear-gradient(135deg,#E8A87C,#D06A3F)' },
  { mood: 'winter', name: '冬夜炉火', desc: '民谣与热可可，轻微火焰声', icon: 'flame', tint: 'linear-gradient(135deg,#A65B3B,#5E2F1C)' },
  { mood: 'hiking', name: '山野徒步', desc: '风声、虫鸣与口琴', icon: 'leaf', tint: 'linear-gradient(135deg,#6B8F5E,#33512B)' },
];

async function load() {
  dailyLoading.value = true;
  try {
    const [d, n, e] = await Promise.all([
      musicApi.daily(useSettingsRatio(), 30),
      musicApi.newSongs(10),
      musicApi.editorList().catch(() => []),
    ]);
    daily.value = d.songs;
    newSongs.value = n.songs;
    editor.value = e;
  } catch {
    toast('推荐服务暂不可用，请确认服务端已启动');
  } finally {
    dailyLoading.value = false;
  }
}

function useSettingsRatio(): number {
  try {
    const raw = JSON.parse(localStorage.getItem('lj.settings') || '{}');
    return typeof raw.dailyRatio === 'number' ? raw.dailyRatio : 0.7;
  } catch {
    return 0.7;
  }
}

function playDaily(shuffle = false) {
  if (!daily.value.length) return;
  const idx = shuffle ? Math.floor(Math.random() * daily.value.length) : 0;
  player.play(daily.value, idx);
  player.showPlayer = true;
}

async function playStation(st: Station) {
  try {
    toast(`正在打开「${st.name}」电台…`);
    const r = await musicApi.radio(st.mood);
    if (r.songs.length) {
      await player.play(r.songs, 0);
      player.showPlayer = true;
    }
  } catch {
    toast('电台加载失败，请稍后再试');
  }
}

function totalTime(list: Song[]): number {
  return list.reduce((a, s) => a + (s.duration || 240), 0);
}

onMounted(() => {
  load();
  lib.load();
});
</script>

<template>
  <main class="app-content">
    <div class="pg-head">
      <div class="pg-kicker">DISCOVER · 发现</div>
      <h1 class="pg-title">{{ greeting() }}</h1>
      <p class="pg-sub">五源聚合 · 全程零广告 · 失效自动换源，你的音乐安静地在这里</p>
    </div>

    <!-- 每日推荐 -->
    <section class="hero-daily" :class="{ skeleton: dailyLoading && !heroSong }">
      <div class="hero-bg">
        <img
          v-if="heroSong?.cover"
          :src="`/api/music/proxy/image?url=${encodeURIComponent(heroSong.cover)}`"
          alt="每日推荐"
        />
      </div>
      <div class="hero-date"><b>{{ todayInfo().day }}</b><span>{{ todayInfo().mon }} · {{ todayInfo().week }}</span></div>
      <div class="hero-inner">
        <div class="hero-kicker">每日推荐 · DAILY MIX</div>
        <h2 class="hero-title">每天 30 首，为你而变</h2>
        <p class="hero-desc">基于你的喜欢与最近聆听生成：70% 熟悉的好味道 + 30% 值得探索的新鲜感，每天 0 点刷新，可在设置中调节配比。</p>
        <div class="hero-ops">
          <button class="btn btn-primary" @click="playDaily()"><AppIcon name="play" />开始聆听</button>
          <button class="btn-play-circle" @click="playDaily(true)" aria-label="随机漫游"><AppIcon name="shuffle" /></button>
          <span class="hero-hint" v-if="daily.length">今日 {{ daily.length }} 首 · 约 {{ fmtDuration(totalTime(daily)) }}</span>
        </div>
      </div>
    </section>

    <!-- 心流 + 导入 -->
    <div class="duo">
      <button class="flow-card" @click="router.push('/flow')">
        <span class="flow-ic"><AppIcon name="zap" /></span>
        <div>
          <div class="flow-name">心流模式</div>
          <div class="flow-desc">全屏沉浸 · 上下滑动切歌，像刷短视频一样听歌</div>
        </div>
        <span class="flow-go"><AppIcon name="chevron-right" /></span>
      </button>
      <button class="import-card" @click="ui.openImport()">
        <span class="import-ic"><AppIcon name="download-cloud" /></span>
        <div>
          <div class="flow-name" style="color:var(--ink)">一键导入你的歌单</div>
          <div class="flow-desc" style="color:var(--sub)">粘贴网易云分享链接，自动聚合匹配</div>
        </div>
        <span class="flow-go" style="color:var(--faint)"><AppIcon name="arrow-up-right" /></span>
      </button>
    </div>

    <!-- 编辑精选 -->
    <div class="sec-head" v-if="editor.length">
      <h2>编辑精选<small>EDITOR'S PICKS</small></h2>
      <button class="link" @click="router.push('/editor')"><AppIcon name="chevron-right" />全部 {{ editor.length }} 张</button>
    </div>
    <div v-if="editor.length" class="pl-grid">
      <EditorCard
        v-for="p in editor.slice(0, 8)"
        :key="p.id"
        :id="p.id"
        :name="p.name"
        :desc="p.desc"
        :tint="p.tint"
        :count="p.songCount"
        @open="router.push(`/editor/${p.id}`)"
      />
    </div>

    <!-- 电台 -->
    <div class="sec-head">
      <h2>流派 · 情绪电台<small>MOOD RADIO</small></h2>
    </div>
    <div class="st-row">
      <StationCard v-for="st in STATIONS" :key="st.mood" :station="st" @play="playStation(st)" />
    </div>

    <!-- 我的歌单 -->
    <div class="sec-head">
      <h2>我的歌单<small>MY PLAYLISTS</small></h2>
      <button class="link" @click="router.push('/library')"><AppIcon name="chevron-right" />全部</button>
    </div>
    <div v-if="lib.playlists.length" class="pl-grid">
      <PlaylistCard v-for="p in lib.playlists.slice(0, 4)" :key="p.id" :playlist="p" />
    </div>
    <div v-else class="card empty-card">
      <AppIcon name="disc-3" />
      <p>还没有歌单，把喜欢的音乐导入进来吧</p>
      <button class="btn btn-ghost" @click="ui.openImport()"><AppIcon name="download-cloud" />导入歌单</button>
    </div>

    <!-- 每日推荐列表 -->
    <div class="sec-head" v-if="daily.length">
      <h2>今日推荐<small>DAILY 30</small></h2>
      <button class="link" @click="playDaily(true)"><AppIcon name="shuffle" />随机播放</button>
    </div>
    <div class="song-list">
      <SongRow v-for="(s, i) in daily.slice(0, 8)" :key="s.key" :song="s" :index="i" :queue="daily" :delay="i * 35" />
    </div>

    <!-- 新歌速递 -->
    <div class="sec-head" v-if="newSongs.length">
      <h2>新歌速递<small>NEW RELEASES</small></h2>
    </div>
    <div class="song-list">
      <SongRow v-for="(s, i) in newSongs" :key="s.key" :song="s" :index="i" :queue="newSongs" :delay="i * 35" />
    </div>
  </main>
</template>

<style scoped>
.duo{display:grid;grid-template-columns:1.1fr .9fr;gap:20px;margin-top:20px}
.import-card{
  display:flex;align-items:center;gap:18px;text-align:left;
  border-radius:var(--r-xl);padding:26px 28px;
  background:var(--surface);border:1px solid var(--line);
  box-shadow:var(--sh-sm);cursor:pointer;
  transition:transform .3s var(--ease),box-shadow .3s var(--ease),border-color .3s;
}
.import-card:hover{transform:translateY(-3px);box-shadow:var(--sh-md);border-color:rgba(91,138,114,.4)}
.import-ic{
  width:52px;height:52px;border-radius:16px;flex:none;
  display:grid;place-items:center;font-size:24px;
  color:var(--primary);background:var(--primary-soft);
}
.import-card .flow-name,.import-card .flow-desc{position:relative;color:var(--ink)}
.hero-hint{font-size:13px;opacity:.75}
.empty-card{padding:40px;text-align:center;color:var(--sub);font-size:13.5px}
.empty-card .app-icon{font-size:34px;color:var(--faint);margin-bottom:10px}
.empty-card p{margin-bottom:16px}
.empty-card .btn{margin:0 auto}
@media (max-width:900px){
  .duo{grid-template-columns:1fr;gap:14px}
  .import-card,.flow-card{padding:20px 22px}
}
</style>
