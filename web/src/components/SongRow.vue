<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';
import CoverImage from './CoverImage.vue';
import { useLibraryStore } from '@/stores/library';
import { usePlayerStore } from '@/stores/player';
import { useUiStore } from '@/stores/toast';
import { sourceLabel, type Song } from '@/types';

const props = withDefaults(
  defineProps<{ song: Song; index?: number; queue?: Song[]; delay?: number; removable?: boolean }>(),
  { index: -1, delay: 0 },
);

const emit = defineEmits<{ (e: 'remove'): void }>();

const player = usePlayerStore();
const lib = useLibraryStore();
const ui = useUiStore();

const isCur = computed(() => player.current?.key === props.song.key);
const liked = computed(() => lib.isLiked(props.song.key));
const srcBadges = computed(() => props.song.sources.slice(0, 3));

function play() {
  player.playSong(props.song, props.queue ?? [props.song]);
}
function heart() {
  lib.toggleLike(props.song);
}
function addTo() {
  ui.openAddTo({
    title: props.song.title,
    artist: props.song.artist,
    payload: {
      source: props.song.sources[0]?.source,
      sourceId: props.song.sources[0]?.sourceId,
      title: props.song.title,
      artist: props.song.artist,
      album: props.song.album,
      duration: props.song.duration,
      cover: props.song.cover,
      quality: JSON.stringify(props.song.qualities),
    },
  });
}
</script>

<template>
  <div class="song-row" :class="{ cur: isCur }" :style="{ animation: `row-in .45s var(--ease) ${delay}ms both` }" @click="play">
    <div class="song-idx">{{ index >= 0 ? String(index + 1).padStart(2, '0') : '' }}</div>
    <div class="song-cover">
      <CoverImage :song="song" :alt="song.album || song.title" />
      <span class="cov-play" @click.stop="play"><AppIcon name="play" /></span>
    </div>
    <div class="song-main">
      <div class="song-title">
        <span class="t">{{ song.title }}</span>
        <span v-for="q in song.qualities.slice(0, 2)" :key="q" class="q-badge" :class="q === '无损' ? 'lossless' : q === 'Hi-Res' ? 'hires' : 'sq'">{{ q }}</span>
      </div>
      <div class="song-artist">{{ song.artist }}</div>
    </div>
    <div class="song-album">{{ song.album || '—' }}</div>
    <div class="song-album">
      <span v-for="s in srcBadges" :key="s.source" class="src-badge ok" :title="sourceLabel(s.source)">{{ s.label }}</span>
      <span v-if="song.sources.length < 2" class="src-badge dim">源待测</span>
    </div>
    <div class="song-dur">{{ song.duration ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, '0')}` : '—' }}</div>
    <div class="song-ops">
      <button class="btn-icon op-heart" :class="{ on: liked }" @click.stop="heart" aria-label="喜欢"><AppIcon name="heart" /></button>
      <button v-if="removable" class="btn-icon" @click.stop="emit('remove')" aria-label="移除"><AppIcon name="trash" /></button>
      <button v-else class="btn-icon" @click.stop="addTo" aria-label="加入歌单"><AppIcon name="plus" /></button>
    </div>
    <div class="song-like-h5">
      <button class="btn-icon op-heart" :class="{ on: liked }" @click.stop="heart" aria-label="喜欢"><AppIcon name="heart" /></button>
    </div>
  </div>
</template>
