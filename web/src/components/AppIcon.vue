<script setup lang="ts">
import { computed } from 'vue';
import { icon } from './icons';

const props = defineProps<{ name: string }>();
const svg = computed(() => icon(props.name));
</script>

<template>
  <span class="app-icon" v-html="svg" />
</template>

<style>
.app-icon{display:inline-flex;width:1em;height:1em;flex:none}
.app-icon svg{width:100%;height:100%}
</style>
