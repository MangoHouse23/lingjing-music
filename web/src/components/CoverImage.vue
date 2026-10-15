<script setup lang="ts">
/** 封面图：外链 → 服务端代理；无图时惰性向音源要图；仍无 → 首字渐变占位 */
import { computed, onMounted, ref, watch } from 'vue';
import { musicApi } from '@/api/music';
import { proxyImage } from '@/api/client';
import type { Song } from '@/types';

const props = withDefaults(
  defineProps<{
    song?: Song;
    cover?: string;
    fallbackSource?: { source: string; sourceId: string };
    alt?: string;
  }>(),
  { alt: '封面' },
);

const lazyCover = ref<string | undefined>(undefined);
const failed = ref(false);

const direct = computed(() => props.cover ?? props.song?.cover);

const url = computed(() => {
  const c = direct.value ?? lazyCover.value;
  return c ? proxyImage(c) : undefined;
});

async function fetchLazy() {
  if (direct.value || lazyCover.value || !props.fallbackSource) return;
  try {
    const u = await musicApi.pic(props.fallbackSource.source, props.fallbackSource.sourceId, 300);
    if (u) lazyCover.value = u;
  } catch { /* 占位兜底 */ }
}

onMounted(fetchLazy);
watch(() => props.song, fetchLazy);
</script>

<template>
  <div class="cover-img">
    <img v-if="url && !failed" :src="url" :alt="alt" loading="lazy" @error="failed = true" />
    <div v-else class="cover-fallback">{{ (song?.title || alt || '聆').slice(0, 1) }}</div>
  </div>
</template>

<style>
.cover-img{position:relative;width:100%;height:100%;overflow:hidden}
.cover-img img{width:100%;height:100%;object-fit:cover}
.cover-fallback{
  width:100%;height:100%;display:grid;place-items:center;
  color:rgba(255,255,255,.9);font-family:var(--f-display);font-size:1.2em;
  background:linear-gradient(135deg,#6B9C82,#3A5A49);
}
</style>
