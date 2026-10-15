<script setup lang="ts">
/** P2 心流模式：全屏单曲流，滚轮/滑动切歌（借鉴汽水音乐） */
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import CoverImage from '@/components/CoverImage.vue';
import { musicApi } from '@/api/music';
import { useLibraryStore } from '@/stores/library';
import { usePlayerStore } from '@/stores/player';
import { toast } from '@/stores/toast';
import { proxyImage } from '@/api/client';

const router = useRouter();
const player = usePlayerStore();
const lib = useLibraryStore();
const loading = ref(true);

const song = computed(() => player.current);
const liked = computed(() => (song.value ? lib.isLiked(song.value.key) : false));
const bg = computed(() => (song.value?.cover ? proxyImage(song.value.cover) : undefined));

async function init() {
  loading.value = true;
  try {
    if (!player.hasQueue) {
      const r = await musicApi.daily(0.6, 20);
      if (r.songs.length) await player.play(r.songs, 0);
    }
  } catch {
    toast('心流加载失败，请确认服务端已启动');
  } finally {
    loading.value = false;
  }
}

/* 滚轮 / 触摸滑动切歌 */
let lock = false;
let touchY = 0;
function onWheel(e: WheelEvent) {
  if (lock || Math.abs(e.deltaY) < 24) return;
  lock = true;
  e.deltaY > 0 ? player.next() : player.prev();
  setTimeout(() => (lock = false), 700);
}
function onTouchStart(e: TouchEvent) {
  touchY = e.touches[0].clientY;
}
function onTouchEnd(e: TouchEvent) {
  const dy = e.changedTouches[0].clientY - touchY;
  if (Math.abs(dy) > 70) {
    lock = true;
    dy < 0 ? player.next() : player.prev();
    setTimeout(() => (lock = false), 700);
  }
}

onMounted(init);
</script>

<template>
  <div class="flow" @wheel.passive="onWheel" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
    <div class="flow-bg">
      <img v-if="bg" :src="bg" alt="" />
    </div>

    <header class="flow-top">
      <button class="fg" @click="router.back()" aria-label="退出心流"><AppIcon name="chevron-down" /></button>
      <div class="flow-title">心流 · 上滑换一首</div>
      <button class="fg" @click="router.push('/')" aria-label="回首页"><AppIcon name="compass" /></button>
    </header>

    <div v-if="loading" class="flow-loading">正在准备心流…</div>

    <div v-else-if="song" class="flow-body" @dblclick="player.toggle()">
      <div class="flow-cover" :class="{ playing: player.playing }" @click="player.showPlayer = true">
        <CoverImage :song="song" :alt="song.title" />
        <span class="flow-open-hint"><AppIcon name="arrow-up-right" />沉浸播放页</span>
      </div>
      <div class="flow-info">
        <h1>{{ song.title }}</h1>
        <p>{{ song.artist }}<template v-if="song.album"> · {{ song.album }}</template></p>
      </div>
      <div class="flow-progress">
        <div class="bar" :style="{ width: `${player.progress * 100}%` }"></div>
      </div>
      <div class="flow-ops">
        <button class="fg" :class="{ on: liked }" @click="lib.toggleLike(song)" aria-label="喜欢"><AppIcon name="heart" /></button>
        <button class="flow-play" @click="player.toggle()" aria-label="播放/暂停">
          <AppIcon :name="player.playing ? 'pause' : 'play'" />
        </button>
        <button class="fg" @click="player.next()" aria-label="下一首"><AppIcon name="skip-forward" /></button>
      </div>
    </div>

    <div v-else class="flow-loading">队列是空的，回首页开始聆听吧</div>
  </div>
</template>

<style>
.flow{
  position:fixed;inset:0;z-index:30;overflow:hidden;color:#fff;
  background:#101214;display:flex;flex-direction:column;align-items:center;
  animation:pg-in .5s var(--ease) both;
}
.flow-bg{position:absolute;inset:-10%;filter:blur(70px) brightness(.5);transition:background-image .5s}
.flow-bg img{width:100%;height:100%;object-fit:cover}
.flow-bg::after{content:"";position:absolute;inset:0;background:rgba(10,13,12,.55)}
.flow-top{
  position:relative;z-index:2;width:100%;max-width:900px;
  display:flex;align-items:center;justify-content:space-between;
  padding:22px clamp(18px,4vw,40px) 0;
}
.flow-title{font-family:var(--f-display);font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:rgba(255,255,255,.6)}
.fg{
  width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-size:19px;
  color:rgba(255,255,255,.75);background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);
  backdrop-filter:blur(8px);cursor:pointer;transition:all .2s;
}
.fg:hover{background:rgba(255,255,255,.16);color:#fff}
.fg.on{color:var(--accent)}
.flow-loading{flex:1;display:grid;place-items:center;color:rgba(255,255,255,.5);font-size:14px;position:relative;z-index:2}
.flow-body{
  position:relative;z-index:2;flex:1;min-height:0;width:100%;max-width:900px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;
  padding:20px clamp(18px,4vw,40px) calc(30px + env(safe-area-inset-bottom));
}
.flow-cover{
  width:min(58vh,78vw);aspect-ratio:1;border-radius:var(--r-xl);overflow:hidden;
  box-shadow:0 30px 90px rgba(0,0,0,.55);cursor:pointer;position:relative;
  transition:transform .35s var(--ease);
}
.flow-cover:active{transform:scale(.98)}
.flow-cover.playing{animation:flow-float 6s ease-in-out infinite}
@keyframes flow-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.flow-open-hint{
  position:absolute;left:0;right:0;bottom:0;padding:26px 16px 12px;text-align:right;
  font-size:12px;color:rgba(255,255,255,.85);display:flex;align-items:center;justify-content:flex-end;gap:5px;
  background:linear-gradient(transparent,rgba(0,0,0,.4));opacity:0;transition:opacity .3s;
}
.flow-cover:hover .flow-open-hint{opacity:1}
.flow-info{text-align:center}
.flow-info h1{font-family:var(--f-display);font-size:28px;font-weight:600}
.flow-info p{margin-top:6px;color:rgba(255,255,255,.65);font-size:14.5px}
.flow-progress{width:min(420px,80vw);height:3.5px;border-radius:2px;background:rgba(255,255,255,.16);overflow:hidden}
.flow-progress .bar{height:100%;background:linear-gradient(90deg,#8FBC8F,#E8C9A0);transition:width .25s linear}
.flow-ops{display:flex;align-items:center;gap:22px}
.flow-play{
  width:60px;height:60px;border-radius:50%;display:grid;place-items:center;font-size:23px;color:#0B0F0E;
  background:linear-gradient(135deg,#FFF,#DCE8DF);
  box-shadow:0 10px 34px rgba(143,188,143,.35);cursor:pointer;transition:transform .25s var(--ease);
}
.flow-play:hover{transform:scale(1.06)}
.flow-play .app-icon{margin-left:2px}
@media (max-width:900px){
  .flow-info h1{font-size:23px}
}
</style>
