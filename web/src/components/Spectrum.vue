<script setup lang="ts">
/** Web Audio 频谱可视化：真实 AnalyserNode，失败时静默隐藏 */
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { usePlayerStore } from '@/stores/player';
import { useSettingsStore } from '@/stores/settings';

const player = usePlayerStore();
const settings = useSettingsStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const visible = ref(false);

let raf = 0;
let dataArr: Uint8Array | null = null;

function draw() {
  raf = requestAnimationFrame(draw);
  const cv = canvasRef.value;
  const an = player.analyser();
  if (!cv || !an) return;
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  const w = (cv.width = cv.clientWidth * devicePixelRatio);
  const h = (cv.height = cv.clientHeight * devicePixelRatio);
  ctx.clearRect(0, 0, w, h);
  if (!dataArr || dataArr.length !== an.frequencyBinCount) {
    dataArr = new Uint8Array(an.frequencyBinCount);
  }
  an.getByteFrequencyData(dataArr as any);
  const bars = 28;
  const step = Math.floor(dataArr.length / bars);
  const bw = w / bars * 0.55;
  const gap = w / bars;
  ctx.fillStyle = 'rgba(143,188,143,.75)';
  for (let i = 0; i < bars; i++) {
    let sum = 0;
    for (let j = 0; j < step; j++) sum += dataArr[i * step + j];
    const v = sum / step / 255;
    const bh = Math.max(2 * devicePixelRatio, v * v * h);
    const x = i * gap + (gap - bw) / 2;
    const y = h - bh;
    ctx.beginPath();
    ctx.roundRect(x, y, bw, bh, bw / 2);
    ctx.fill();
  }
  visible.value = true;
}

onMounted(() => {
  if (settings.s.reduceMotion) return;
  draw();
});
onBeforeUnmount(() => cancelAnimationFrame(raf));
</script>

<template>
  <canvas ref="canvasRef" class="spectrum" :class="{ on: visible && player.playing }" />
</template>

<style>
.spectrum{
  display:block;width:100%;max-width:420px;height:34px;margin:0 auto;opacity:0;
  transition:opacity .6s var(--ease);
}
.spectrum.on{opacity:.55}
</style>
