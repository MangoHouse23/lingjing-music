<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';
import CoverImage from './CoverImage.vue';
import { useLibraryStore } from '@/stores/library';
import { usePlayerStore } from '@/stores/player';

const player = usePlayerStore();
const lib = useLibraryStore();

const song = computed(() => player.current);
const liked = computed(() => (song.value ? lib.isLiked(song.value.key) : false));
const srcLabel = computed(() => player.activeSource?.label ?? song.value?.sources[0]?.label ?? '');
</script>

<template>
  <div v-if="song" class="mini-player" :class="{ playing: player.playing, loading: player.loading }" @click="player.showPlayer = true">
    <div class="mini-cover">
      <CoverImage :song="song" :alt="song.album || song.title" />
      <span v-if="player.loading" class="mini-spin"></span>
      <span class="mini-eq"><b></b><b></b><b></b><b></b></span>
    </div>
    <div class="mini-info">
      <div class="mini-title">{{ song.title }}</div>
      <div class="mini-artist">{{ song.artist }}<template v-if="srcLabel"> · {{ srcLabel }}</template></div>
      <div class="mini-progress"><i :style="{ right: `${(1 - player.progress) * 100}%` }" /></div>
    </div>
    <div class="mini-ctrl">
      <button class="btn-icon mini-like" :class="{ on: liked }" @click.stop="lib.toggleLike(song)" aria-label="喜欢"><AppIcon name="heart" /></button>
      <button class="btn-icon" @click.stop="player.toggle()" aria-label="播放/暂停">
        <AppIcon :name="player.playing ? 'pause' : 'play'" />
      </button>
      <button class="btn-icon" @click.stop="player.next()" aria-label="下一首"><AppIcon name="skip-forward" /></button>
    </div>
  </div>
</template>

<style>
.mini-player{
  position:fixed;right:20px;bottom:20px;z-index:50;
  width:min(560px,calc(100vw - var(--sidebar-w) - 40px));
  display:flex;align-items:center;gap:14px;
  padding:10px 14px;border-radius:var(--r-xl);
  background:rgba(255,255,255,.86);
  backdrop-filter:blur(24px) saturate(1.5);-webkit-backdrop-filter:blur(24px) saturate(1.5);
  border:1px solid rgba(236,236,231,.9);
  box-shadow:var(--sh-lg);cursor:pointer;
  transition:transform .3s var(--ease),box-shadow .3s var(--ease);
}
.mini-player:hover{transform:translateY(-2px)}
.mini-cover{position:relative;width:44px;height:44px;border-radius:var(--r-md);overflow:hidden;flex:none;box-shadow:var(--sh-sm)}
.mini-spin{
  position:absolute;inset:0;z-index:2;display:grid;place-items:center;
  background:rgba(16,18,20,.35);backdrop-filter:blur(2px);
}
.mini-spin::after{
  content:"";width:18px;height:18px;border-radius:50%;
  border:2px solid rgba(255,255,255,.35);border-top-color:#fff;
  animation:spin .7s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}
.mini-eq{position:absolute;left:0;right:0;bottom:0;height:16px;display:none;align-items:flex-end;justify-content:center;gap:2px;padding:2px;background:linear-gradient(transparent,rgba(16,18,20,.55))}
.playing .mini-eq{display:flex}
.mini-eq b{width:2.5px;border-radius:1px;background:rgba(255,255,255,.95);animation:eq 1s ease-in-out infinite}
.mini-eq b:nth-child(1){height:6px}.mini-eq b:nth-child(2){height:11px;animation-delay:.15s}
.mini-eq b:nth-child(3){height:8px;animation-delay:.3s}.mini-eq b:nth-child(4){height:12px;animation-delay:.45s}
.mini-info{flex:1;min-width:0}
.mini-title{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mini-artist{font-size:12px;color:var(--sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mini-progress{position:relative;height:3px;border-radius:2px;background:var(--line);margin-top:7px;overflow:hidden}
.mini-progress i{position:absolute;top:0;bottom:0;left:0;background:var(--primary);border-radius:2px}
.mini-ctrl{display:flex;align-items:center;gap:2px;flex:none;color:var(--sub)}
.mini-ctrl .btn-icon{width:32px;height:32px;font-size:17px}
.mini-ctrl .btn-icon:hover{background:var(--wash);color:var(--ink)}
.mini-like.on{color:var(--accent)}
@media (max-width:900px){
  .mini-player{left:12px;right:12px;bottom:calc(58px + env(safe-area-inset-bottom) + 10px);width:auto}
}
</style>
