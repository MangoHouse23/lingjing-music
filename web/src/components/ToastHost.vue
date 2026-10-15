<script setup lang="ts">
import { useToastStore } from '@/stores/toast';

const store = useToastStore();
</script>

<template>
  <transition name="toast-fade">
    <div v-if="store.items.length" class="toast show">{{ store.items[store.items.length - 1].text }}</div>
  </transition>
</template>

<style>
.toast-fade-leave-active{transition:all .3s var(--ease)}
.toast-fade-leave-to{opacity:0;transform:translate(-50%,16px)!important}
</style>
