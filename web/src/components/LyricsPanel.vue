<script setup lang="ts">
/** 逐句卡拉OK歌词：当前行渐变高亮 + 自动居中滚动 + 点击跳转 */
import { computed, nextTick, ref, watch } from 'vue';
import AppIcon from './AppIcon.vue';
import { usePlayerStore } from '@/stores/player';
import { useSettingsStore } from '@/stores/settings';
import { toast } from '@/stores/toast';

const player = usePlayerStore();
const settings = useSettingsStore();
const boxRef = ref<HTMLElement | null>(null);
const scrollRef = ref<HTMLElement | null>(null);

const curIdx = computed(() => {
  const t = player.curTime;
  const ls = player.lyrics;
  let idx = -1;
  for (let i = 0; i < ls.length; i++) if (t >= ls[i].t) idx = i;
  return idx;
});

watch(curIdx, async (idx) => {
  if (idx < 0 || !boxRef.value || !scrollRef.value) return;
  await nextTick();
  const line = scrollRef.value.children[idx] as HTMLElement | undefined;
  if (!line) return;
  const target = line.offsetTop - boxRef.value.clientHeight / 2 + line.offsetHeight / 2;
  scrollRef.value.style.transform = `translateY(${-Math.max(0, target)}px)`;
});

function seekTo(i: number) {
  const line = player.lyrics[i];
  if (!line) return;
  // 按秒精确跳转
  const a = (player as any)._audio as HTMLAudioElement | null;
  if (a && player.duration) a.currentTime = Math.min(line.t, player.duration - 0.5);
  toast('已跳转到该句');
}
</script>

<template>
  <div ref="boxRef" class="lyrics-box" :class="{ dim: !settings.s.showTranslation }">
    <div v-if="!player.lyrics.length && !player.lyricsLoading" class="lyrics-empty">
      <AppIcon name="mic" />
      <p>这首歌暂时没有歌词<br />安静地听吧</p>
    </div>
    <div v-else-if="player.lyricsLoading" class="lyrics-empty"><p>歌词加载中…</p></div>
    <div v-else ref="scrollRef" class="lyr-scroll">
      <div
        v-for="(l, i) in player.lyrics"
        :key="i"
        class="lyr-line"
        :class="{ on: i === curIdx }"
        @click="seekTo(i)"
      >
        <div class="lyr-cn">{{ l.cn }}</div>
        <div v-if="l.en && settings.s.showTranslation" class="lyr-en">{{ l.en }}</div>
      </div>
      <div class="lyr-tail">— 聆境 · 尽情享受 —</div>
    </div>
  </div>
</template>

<style>
.lyrics-box{
  position:relative;height:100%;max-height:470px;overflow:hidden;
  mask-image:linear-gradient(transparent,#000 16%,#000 84%,transparent);
  -webkit-mask-image:linear-gradient(transparent,#000 16%,#000 84%,transparent);
}
.lyr-scroll{transition:transform .55s var(--ease);will-change:transform}
.lyr-line{padding:11px 4px;cursor:pointer;border-radius:var(--r-md);transition:transform .35s var(--ease)}
.lyr-cn{
  font-size:22px;font-weight:600;line-height:1.5;color:rgba(255,255,255,.36);
  transition:all .35s var(--ease);font-family:var(--f-display);letter-spacing:.01em;
}
.lyr-en{font-size:12.5px;color:rgba(255,255,255,.2);margin-top:3px;transition:color .35s}
.lyr-line:hover .lyr-cn{color:rgba(255,255,255,.62)}
.lyr-line.on{transform:translateX(6px)}
.lyr-line.on .lyr-cn{
  background:linear-gradient(92deg,#FFF 30%,#CDE7D8 75%,#F4D9BC);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
  font-size:26px;text-shadow:0 0 42px rgba(143,188,143,.22);
}
.lyr-line.on .lyr-en{color:rgba(255,255,255,.45)}
.lyr-tail{text-align:center;font-size:12px;color:rgba(255,255,255,.22);padding:22px 0 8px;letter-spacing:.2em}
.lyrics-empty{height:100%;display:grid;place-items:center;text-align:center;color:rgba(255,255,255,.4);font-size:13.5px;line-height:2}
.lyrics-empty svg{width:30px;height:30px;margin:0 auto 8px;opacity:.6}
</style>
