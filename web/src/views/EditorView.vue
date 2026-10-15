<script setup lang="ts">
/** 编辑精选：全部歌单浏览 */
import { onMounted, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import EditorCard from '@/components/EditorCard.vue';
import { musicApi } from '@/api/music';

const list = ref<{ id: string; name: string; desc: string; tint: string; songCount: number }[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    list.value = await musicApi.editorList();
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main class="app-content">
    <div class="pg-head">
      <div class="pg-kicker">EDITOR'S PICKS · 编辑精选</div>
      <h1 class="pg-title">编辑精选</h1>
      <p class="pg-sub">参考主流音乐平台的官方歌单结构，由关键词实时聚合生成 · 每天刷新</p>
    </div>
    <div v-if="loading" class="pg-sub" style="padding: 30px 0">歌单加载中…</div>
    <div v-else class="pl-grid">
      <EditorCard v-for="p in list" :key="p.id" :id="p.id" :name="p.name" :desc="p.desc" :tint="p.tint" :count="p.songCount" @open="$router.push(`/editor/${p.id}`)" />
    </div>
    <div v-if="!loading && !list.length" class="empty">
      <AppIcon name="disc-3" />
      <p>精选歌单获取失败，请确认服务端已启动</p>
    </div>
  </main>
</template>
