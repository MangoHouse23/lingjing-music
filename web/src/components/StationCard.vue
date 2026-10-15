<script setup lang="ts">
import AppIcon from './AppIcon.vue';

export interface Station {
  mood: string;
  name: string;
  desc: string;
  icon: string;
  tint: string;
}

withDefaults(defineProps<{ station: Station }>(), {});

const emit = defineEmits<{ (e: 'play', mood: string): void }>();
</script>

<template>
  <button class="st-card" :style="{ background: station.tint }" @click="emit('play', station.mood)">
    <span class="st-ic"><AppIcon :name="station.icon" /></span>
    <span class="st-go"><AppIcon name="arrow-up-right" /></span>
    <div class="st-name">{{ station.name }}</div>
    <div class="st-desc">{{ station.desc }}</div>
  </button>
</template>
