<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AddToPlaylistModal from './components/AddToPlaylistModal.vue';
import ImportModal from './components/ImportModal.vue';
import MiniPlayer from './components/MiniPlayer.vue';
import PlayerOverlay from './components/PlayerOverlay.vue';
import Sidebar from './components/Sidebar.vue';
import TabBar from './components/TabBar.vue';
import ToastHost from './components/ToastHost.vue';

const route = useRoute();
const isFlow = computed(() => route.path === '/flow');
const isLyric = computed(() => route.path === '/desktop-lyrics');
</script>

<template>
  <div class="app" :class="{ 'flow-page': isFlow }">
    <template v-if="!isLyric">
      <Sidebar v-if="!isFlow" />
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
      <MiniPlayer v-if="!isFlow" />
      <TabBar v-if="!isFlow" />
    </template>
    <RouterView v-else />
  </div>
  <PlayerOverlay v-if="!isLyric" />
  <ImportModal v-if="!isLyric" />
  <AddToPlaylistModal v-if="!isLyric" />
  <ToastHost v-if="!isLyric" />
</template>

<style>
.page-enter-active,.page-leave-active{transition:opacity .25s var(--ease),transform .25s var(--ease)}
.page-enter-from{opacity:0;transform:translateY(8px)}
.page-leave-to{opacity:0;transform:translateY(-4px)}
</style>
