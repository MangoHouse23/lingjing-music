<script setup lang="ts">
/** 编辑精选歌单卡（渐变封面 + 首字占位） */
import AppIcon from './AppIcon.vue';

defineProps<{
  id: string;
  name: string;
  desc: string;
  tint: string;
  count?: number;
}>();
const emit = defineEmits<{ (e: 'open'): void }>();
</script>

<template>
  <a class="pl-card" @click.prevent="emit('open')">
    <div class="pl-cover" :style="{ background: tint }">
      <div class="pl-fallback">{{ name.slice(0, 1) }}</div>
      <span class="pl-play"><AppIcon name="play" /></span>
    </div>
    <div class="pl-name">{{ name }}</div>
    <div class="pl-meta">聆境编辑 · {{ count ?? 26 }} 首</div>
  </a>
</template>
