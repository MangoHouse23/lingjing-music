<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from './AppIcon.vue';
import CoverImage from './CoverImage.vue';
import { useLibraryStore } from '@/stores/library';
import { usePlayerStore } from '@/stores/player';
import type { PlaylistSummary, Song } from '@/types';

const props = defineProps<{ playlist: PlaylistSummary }>();
const router = useRouter();
const player = usePlayerStore();
const lib = useLibraryStore();

const firstSong = computed<Song | null>(() => null); // 播放全部由歌单详情页加载后触发

function open() {
  router.push(`/playlist/${props.playlist.id}`);
}

const tint = computed(
  () => props.playlist.tint || 'linear-gradient(135deg,#5B8A72,#33523F)',
);
</script>

<template>
  <a class="pl-card" @click="open">
    <div class="pl-cover" :style="{ background: tint }">
      <img v-if="playlist.cover" :src="`/api/music/proxy/image?url=${encodeURIComponent(playlist.cover)}`" :alt="playlist.name" loading="lazy" />
      <div v-else class="pl-fallback">{{ playlist.name.slice(0, 1) }}</div>
      <span class="pl-play" @click.prevent.stop="open"><AppIcon name="play" /></span>
    </div>
    <div class="pl-name">{{ playlist.name }}</div>
    <div class="pl-meta">{{ playlist._count?.tracks ?? 0 }} 首</div>
  </a>
</template>
