<script setup lang="ts">
/** 编辑精选歌单详情：取色 Hero + 关键词聚合曲目 */
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import SongRow from '@/components/SongRow.vue';
import { musicApi } from '@/api/music';
import { usePlayerStore } from '@/stores/player';
import { toast } from '@/stores/toast';
import type { Song } from '@/types';
import { fmtDuration } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const player = usePlayerStore();

const meta = ref<{ id: string; name: string; desc: string; tint: string } | null>(null);
const songs = ref<Song[]>([]);
const loading = ref(true);
const failed = ref(false);

const totalDur = computed(() => songs.value.reduce((a, s) => a + (s.duration || 240), 0));

async function load() {
  loading.value = true;
  failed.value = false;
  try {
    const r = await musicApi.editorDetail(String(route.params.id));
    meta.value = { id: r.id, name: r.name, desc: r.desc, tint: r.tint };
    songs.value = r.songs;
  } catch (e: any) {
    failed.value = true;
    toast(e?.message || '歌单加载失败');
  } finally {
    loading.value = false;
  }
}

function playAll(shuffle = false) {
  if (!songs.value.length) return;
  const idx = shuffle ? Math.floor(Math.random() * songs.value.length) : 0;
  player.play(songs.value, idx);
  player.showPlayer = true;
}

onMounted(load);
</script>

<template>
  <main class="app-content">
    <div v-if="loading" class="pg-sub" style="padding: 40px 0">正在为你聚合歌单曲目…（首次约需几秒）</div>
    <template v-else-if="meta && !failed">
      <section class="pl-hero" :style="{ background: `linear-gradient(150deg, rgba(16,18,20,.28), rgba(16,18,20,.55)), ${meta.tint}` }">
        <div class="pl-hero-cover ed-cover" :style="{ background: meta.tint }">
          <span>{{ meta.name.slice(0, 1) }}</span>
        </div>
        <div class="pl-hero-info">
          <div class="pg-kicker">编辑精选 · PLAYLIST</div>
          <h1 class="pl-hero-name">{{ meta.name }}</h1>
          <div class="pl-hero-meta">{{ songs.length }} 首 · 约 {{ fmtDuration(totalDur) }} · 聆境编辑</div>
          <p class="pl-hero-desc">{{ meta.desc }}</p>
          <div class="pl-hero-ops">
            <button class="btn btn-primary" @click="playAll()"><AppIcon name="play" />播放全部</button>
            <button class="btn btn-ghost" @click="playAll(true)"><AppIcon name="shuffle" />随机播放</button>
          </div>
        </div>
      </section>

      <div v-if="songs.length" class="song-list">
        <SongRow v-for="(s, i) in songs" :key="s.key" :song="s" :index="i" :queue="songs" :delay="Math.min(i, 12) * 35" />
      </div>
      <div v-else class="empty">
        <AppIcon name="alert-circle" />
        <p>这首歌单暂时没有聚合到曲目，试试其他歌单吧</p>
      </div>
      <p class="ed-note">内容由音源实时聚合，每次打开都会刷新 · 喜欢哪首就点红心收进「我喜欢的音乐」</p>
    </template>
    <div v-else class="empty">
      <AppIcon name="alert-circle" />
      <p>歌单加载失败</p>
      <button class="btn btn-ghost" style="margin-top: 14px" @click="load">重试</button>
    </div>
  </main>
</template>

<style scoped>
.pl-hero{
  position:relative;overflow:hidden;border-radius:var(--r-xl);
  display:flex;gap:32px;align-items:flex-end;
  padding:40px;margin-bottom:30px;color:#fff;
}
.pl-hero::before{
  content:"";position:absolute;width:340px;height:340px;border-radius:50%;
  right:-80px;top:-120px;filter:blur(70px);background:rgba(255,255,255,.16);
}
.pl-hero-cover{
  width:200px;height:200px;border-radius:var(--r-xl);overflow:hidden;flex:none;
  box-shadow:0 20px 56px rgba(0,0,0,.4);transform:rotate(-2deg);
  transition:transform .4s var(--ease);position:relative;z-index:1;
  display:grid;place-items:center;
}
.pl-hero:hover .pl-hero-cover{transform:rotate(0) scale(1.02)}
.pl-hero-cover span{font-family:var(--f-display);font-size:64px;color:rgba(255,255,255,.9)}
.pl-hero-info{position:relative;z-index:1;min-width:0;padding-bottom:4px}
.pl-hero-info .pg-kicker{color:rgba(255,255,255,.72)}
.pl-hero-name{font-family:var(--f-display);font-size:34px;font-weight:600;line-height:1.25;margin:6px 0 8px}
.pl-hero-meta{font-size:13px;color:rgba(255,255,255,.82)}
.pl-hero-desc{font-size:13px;color:rgba(255,255,255,.66);margin-top:8px;max-width:520px}
.pl-hero-ops{display:flex;align-items:center;gap:12px;margin-top:22px;flex-wrap:wrap}
.pl-hero .btn-primary{background:#fff;color:var(--ink);box-shadow:0 8px 24px rgba(0,0,0,.26)}
.pl-hero .btn-primary:hover{background:rgba(255,255,255,.92)}
.pl-hero .btn-ghost{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.35);color:#fff;backdrop-filter:blur(8px)}
.pl-hero .btn-ghost:hover{background:rgba(255,255,255,.24);color:#fff;border-color:rgba(255,255,255,.5)}
.ed-note{font-size:12px;color:var(--faint);text-align:center;margin-top:22px}
@media (max-width:900px){
  .pl-hero{flex-direction:column;align-items:flex-start;gap:20px;padding:26px 22px}
  .pl-hero-cover{width:132px;height:132px}
  .pl-hero-name{font-size:26px}
}
</style>
