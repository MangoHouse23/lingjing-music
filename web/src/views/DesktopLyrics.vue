<script setup lang="ts">
/** 桌面歌词窗：透明置顶点击穿透，经 IPC 接收当前歌词行 */
import { onMounted, onUnmounted, ref } from 'vue';

const cn = ref('');
const en = ref('');
const has = ref(false);
const api = (window as any).electronAPI;

onMounted(() => {
  document.body.classList.add('lyric-mode');
  api?.onLyric?.((data: { cn?: string; en?: string } | null) => {
    if (!data?.cn) {
      has.value = false;
      return;
    }
    cn.value = data.cn;
    en.value = data.en ?? '';
    has.value = true;
  });
});
onUnmounted(() => document.body.classList.remove('lyric-mode'));
</script>

<template>
  <div class="dtl" :class="{ on: has }">
    <div class="dtl-cn">{{ has ? cn : '聆境 · 桌面歌词已开启' }}</div>
    <div v-if="has && en" class="dtl-en">{{ en }}</div>
  </div>
</template>

<style>
body.lyric-mode{background:transparent!important}
body.lyric-mode::before,body.lyric-mode::after{display:none!important}
.dtl{
  position:fixed;inset:6px 12px auto;display:flex;flex-direction:column;align-items:center;gap:2px;
  pointer-events:none;opacity:.35;transition:opacity .4s var(--ease);
  padding:10px 18px;border-radius:14px;
}
.dtl.on{opacity:1;background:rgba(16,20,18,.28);backdrop-filter:blur(6px)}
.dtl-cn{
  font-family:var(--f-display);font-size:21px;font-weight:600;color:#fff;text-align:center;
  text-shadow:0 1px 8px rgba(0,0,0,.75),0 0 2px rgba(0,0,0,.9);
  background:linear-gradient(92deg,#FFFFFF,#CDE7D8);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
  filter:drop-shadow(0 1px 6px rgba(0,0,0,.7));
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;
}
.dtl-en{
  font-size:12px;color:rgba(255,255,255,.85);text-align:center;
  text-shadow:0 1px 4px rgba(0,0,0,.8);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;
}
</style>
