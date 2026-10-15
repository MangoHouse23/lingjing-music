<script setup lang="ts">
/** 沉浸播放页：动态取色背景 + 大封面 + 卡拉OK歌词 + 完整控制 */
import { computed, onMounted, onUnmounted, ref } from 'vue';
import AppIcon from './AppIcon.vue';
import CoverImage from './CoverImage.vue';
import LyricsPanel from './LyricsPanel.vue';
import Spectrum from './Spectrum.vue';
import { useLibraryStore } from '@/stores/library';
import { usePlayerStore } from '@/stores/player';
import { useSettingsStore } from '@/stores/settings';
import { toast } from '@/stores/toast';
import { fmtTime } from '@/utils/format';

const player = usePlayerStore();
const lib = useLibraryStore();
const settings = useSettingsStore();

function setBr(o: { br: number; label: string }) {
  settings.set('br', o.br);
  settings.set('brLabel', o.label);
  toast(`音质已切换为 ${o.label}，下一首歌生效`);
}

const queueOpen = ref(false);
const timerOpen = ref(false);
const qualityOpen = ref(false);
const barRef = ref<HTMLElement | null>(null);

/* 桌面歌词（仅 Electron） */
const isElectron = !!(window as any).electronAPI;
const lyricOn = ref(false);
(window as any).electronAPI?.onDesktopLyricState?.((v: boolean) => (lyricOn.value = v));
function toggleLyric() {
  (window as any).electronAPI?.toggleDesktopLyric();
  lyricOn.value = !lyricOn.value;
}

const song = computed(() => player.current);
const liked = computed(() => (song.value ? lib.isLiked(song.value.key) : false));

const bgStyle = computed(() => {
  const p = player.palette;
  if (!p) return {};
  return {
    '--pv-main': p.main,
    '--pv-glow': p.glow,
    '--pv-accent': p.accent,
  };
});

const sleepText = computed(() => {
  if (!player.sleepTimer) return '睡眠定时器';
  return `剩余 ${player.sleepTimer} 分钟`;
});

const brOptions = [
  { br: 128, label: '128k', desc: '流畅' },
  { br: 320, label: '320k', desc: '高品质' },
  { br: 999, label: '无损', desc: 'Lossless' },
];

/* 进度条拖拽 */
function barEvent(e: PointerEvent) {
  const r = barRef.value!.getBoundingClientRect();
  player.seek((e.clientX - r.left) / r.width);
}
function barDown(e: PointerEvent) {
  barEvent(e);
  const mv = (ev: PointerEvent) => barEvent(ev);
  const up = () => {
    window.removeEventListener('pointermove', mv);
    window.removeEventListener('pointerup', up);
  };
  window.addEventListener('pointermove', mv);
  window.addEventListener('pointerup', up);
}

/* H5 手势：下滑关闭 / 左右滑切歌 */
let touch = { x: 0, y: 0 };
function touchStart(e: TouchEvent) {
  touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}
function touchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touch.x;
  const dy = e.changedTouches[0].clientY - touch.y;
  if (dy > 90 && Math.abs(dx) < 60) player.showPlayer = false;
  else if (dx < -70 && Math.abs(dy) < 60) player.next();
  else if (dx > 70 && Math.abs(dy) < 60) player.prev();
}

onMounted(() => player.bindShortcuts());
onUnmounted(() => {});
</script>

<template>
  <Transition name="pv">
    <div
      v-if="player.showPlayer && song"
      class="pv"
      :style="bgStyle"
      @touchstart.passive="touchStart"
      @touchend.passive="touchEnd"
    >
      <div class="pv-bg" aria-hidden="true"></div>

      <header class="pv-top">
        <button class="pv-ghost" @click="player.showPlayer = false" aria-label="收起"><AppIcon name="chevron-down" /></button>
        <div class="pv-label">Now Playing · 聆境</div>
        <div class="pv-top-r">
          <button v-if="isElectron" class="pv-ghost" :class="{ on: lyricOn }" @click="toggleLyric" aria-label="桌面歌词"><AppIcon name="mic" /></button>
          <button class="pv-ghost" @click="timerOpen = !timerOpen" aria-label="睡眠定时器"><AppIcon name="timer" /></button>
          <button class="pv-ghost" @click="qualityOpen = !qualityOpen" aria-label="音质"><AppIcon name="audio-lines" /></button>
        </div>
        <div v-if="timerOpen" class="pv-pop">
          <button v-for="m in [0, 15, 30, 45, 60]" :key="m" @click="player.setSleepTimer(m); timerOpen = false">
            {{ m === 0 ? '关闭' : `${m} 分钟` }}
          </button>
        </div>
        <div v-if="qualityOpen" class="pv-pop">
          <button v-for="o in brOptions" :key="o.br" @click="setBr(o); qualityOpen = false">
            <b>{{ o.label }}</b><span>{{ o.desc }}</span>
          </button>
        </div>
      </header>

      <section class="pv-main">
        <div class="pv-stage">
          <div class="pv-cover" :class="{ playing: player.playing }">
            <CoverImage :song="song" :alt="song.album || song.title" />
          </div>
          <div class="pv-meta">
            <h1 class="pv-title">{{ song.title }}</h1>
            <div class="pv-artist">{{ song.artist }}<template v-if="song.album"> · 《{{ song.album }}》</template></div>
            <div class="pv-tags">
              <span class="pv-chip" :title="`可用音源 ${song.sources.length} 个`">
                {{ player.activeSource?.label ?? song.sources[0]?.label ?? '—' }} · 已聚合 {{ song.sources.length }} 源
              </span>
              <span class="pv-chip q">{{ player.loading ? '加载中…' : '播放中' }}</span>
              <button class="pv-like" :class="{ on: liked }" @click="lib.toggleLike(song)" aria-label="喜欢">
                <AppIcon name="heart" />
              </button>
            </div>
          </div>
        </div>

        <LyricsPanel class="pv-lyrics" />
      </section>

      <footer class="pv-bottom">
        <Spectrum />
        <div class="pv-progress">
          <span class="pv-time">{{ fmtTime(player.curTime) }}</span>
          <div ref="barRef" class="pv-bar" @pointerdown="barDown">
            <div class="rail"></div>
            <div class="fill" :style="{ width: `${player.progress * 100}%` }"></div>
          </div>
          <span class="pv-time right">{{ fmtTime(player.duration) }}</span>
        </div>
        <div class="pv-ctrl">
          <button class="pv-ctl" :class="{ on: player.mode === 'random' }" @click="player.setMode(player.mode === 'random' ? 'order' : 'random')" aria-label="随机"><AppIcon name="shuffle" /></button>
          <button class="pv-ctl big" @click="player.prev()" aria-label="上一首"><AppIcon name="skip-back" /></button>
          <button class="pv-play" @click="player.toggle()" aria-label="播放/暂停">
            <AppIcon :name="player.playing ? 'pause' : 'play'" />
          </button>
          <button class="pv-ctl big" @click="player.next()" aria-label="下一首"><AppIcon name="skip-forward" /></button>
          <button class="pv-ctl" :class="{ on: player.mode === 'repeat' }" @click="player.setMode(player.mode === 'repeat' ? 'order' : 'repeat')" aria-label="单曲循环"><AppIcon name="repeat" /></button>
        </div>
        <div class="pv-vol">
          <AppIcon name="volume-2" />
          <input type="range" min="0" max="1" step="0.01" :value="player.volume" @input="player.setVolume(Number(($event.target as HTMLInputElement).value))" />
        </div>
      </footer>

      <button class="pv-queue-btn" @click="queueOpen = true" aria-label="播放队列"><AppIcon name="list-music" /></button>

      <!-- 队列抽屉 -->
      <Teleport to="body">
        <div class="queue-mask" :class="{ open: queueOpen }" @click="queueOpen = false"></div>
        <aside class="queue" :class="{ open: queueOpen }">
          <div class="queue-head">
            <div><b>播放队列</b><span>{{ player.queue.length }} 首</span></div>
            <button class="pv-ghost" @click="queueOpen = false" aria-label="关闭"><AppIcon name="x" /></button>
          </div>
          <div class="queue-list">
            <div
              v-for="(s, i) in player.queue"
              :key="s.key + i"
              class="q-row"
              :class="{ cur: i === player.index }"
              @click="player.playFromQueue(i)"
            >
              <div class="q-cov"><CoverImage :song="s" :alt="s.title" /></div>
              <div class="qm">
                <div class="qt">{{ s.title }}</div>
                <div class="qa">{{ s.artist }}</div>
              </div>
              <span v-if="i === player.index && player.playing" class="q-eq"><b></b><b></b><b></b></span>
            </div>
          </div>
        </aside>
      </Teleport>
    </div>
  </Transition>
</template>

<style>
.pv{
  position:fixed;inset:0;z-index:80;color:var(--dk-ink);
  background:var(--pv-main, #17201B);
  display:flex;flex-direction:column;
  padding:22px clamp(18px,4vw,48px) calc(18px + env(safe-area-inset-bottom));
  max-width:100vw;
}
.pv-bg{
  position:absolute;inset:-20%;pointer-events:none;filter:blur(90px);
  background:
    radial-gradient(46% 42% at 22% 24%, var(--pv-glow, rgba(91,138,114,.5)), transparent 66%),
    radial-gradient(44% 40% at 62% 88%, var(--pv-accent, rgba(232,168,124,.16)), transparent 64%);
  animation:pv-drift 22s ease-in-out infinite alternate;
}
@keyframes pv-drift{
  0%{transform:translate3d(0,0,0) scale(1)}
  50%{transform:translate3d(2%,-2%,0) scale(1.08)}
  100%{transform:translate3d(-2%,2%,0) scale(1.04)}
}
.pv-leave-active,.pv-enter-active{transition:opacity .4s var(--ease),transform .4s var(--ease)}
.pv-enter-from,.pv-leave-to{opacity:0;transform:scale(.985)}

.pv-top{position:relative;display:flex;align-items:center;flex:none}
.pv-label{flex:1;text-align:center;font-size:11px;letter-spacing:.32em;color:var(--dk-sub);text-transform:uppercase;font-family:var(--f-display)}
.pv-top-r{display:flex;gap:4px}
.pv-ghost{
  width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-size:19px;
  color:var(--dk-sub);transition:all .2s var(--ease);cursor:pointer;
}
.pv-ghost:hover{background:rgba(255,255,255,.09);color:#fff}
.pv-ghost.on{color:#BFE3CF;background:rgba(143,188,143,.16)}
.pv-pop{
  position:absolute;top:48px;right:52px;z-index:5;min-width:150px;
  background:rgba(23,28,26,.95);border:1px solid rgba(255,255,255,.1);border-radius:var(--r-md);
  padding:6px;backdrop-filter:blur(20px);display:flex;flex-direction:column;
}
.pv-pop button{
  display:flex;justify-content:space-between;gap:14px;padding:9px 12px;border-radius:8px;
  font-size:13.5px;color:var(--dk-ink);cursor:pointer;
}
.pv-pop button:hover{background:rgba(255,255,255,.08)}
.pv-pop button span{color:var(--dk-sub);font-size:12px}

.pv-main{flex:1;min-height:0;display:grid;grid-template-columns:minmax(300px,420px) minmax(0,1fr);gap:clamp(28px,5vw,72px);align-items:center;padding:18px 0 8px}
.pv-stage{display:flex;flex-direction:column;align-items:center;gap:24px}
.pv-cover{
  width:100%;max-width:420px;aspect-ratio:1;border-radius:var(--r-xl);overflow:hidden;
  box-shadow:0 30px 90px rgba(0,0,0,.55),0 12px 48px rgba(0,0,0,.3);
  transform:perspective(1200px) rotateY(-4deg);
  transition:transform .5s var(--ease);
}
.pv-cover:hover{transform:perspective(1200px) rotateY(0)}
.pv-cover.playing{animation:pv-float 7s ease-in-out infinite}
@keyframes pv-float{
  0%,100%{transform:perspective(1200px) rotateY(-4deg) translateY(0)}
  50%{transform:perspective(1200px) rotateY(-2deg) translateY(-8px)}
}
.pv-meta{text-align:center;max-width:440px}
.pv-title{font-family:var(--f-display);font-size:29px;font-weight:600;line-height:1.3}
.pv-artist{margin-top:6px;color:var(--dk-sub);font-size:14.5px}
.pv-tags{display:flex;justify-content:center;align-items:center;gap:8px;margin-top:14px}
.pv-chip{
  font-size:12px;padding:4.5px 12px;border-radius:999px;
  background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.85);
  backdrop-filter:blur(8px);
}
.pv-chip.q{color:#BFE3CF;border-color:rgba(143,188,143,.45)}
.pv-like{
  width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-size:18px;
  color:rgba(255,255,255,.65);transition:all .25s var(--ease);cursor:pointer;
}
.pv-like:hover{background:rgba(255,255,255,.1);color:#fff}
.pv-like.on{color:var(--accent);animation:like-pop .35s var(--ease)}

.pv-bottom{flex:none;display:flex;flex-direction:column;gap:6px;padding-top:6px}
.pv-progress{display:flex;align-items:center;gap:14px}
.pv-time{font-size:12px;color:var(--dk-sub);font-variant-numeric:tabular-nums;min-width:38px}
.pv-time.right{text-align:right}
.pv-bar{position:relative;flex:1;height:18px;display:flex;align-items:center;cursor:pointer}
.pv-bar .rail{width:100%;height:4px;border-radius:3px;background:rgba(255,255,255,.14)}
.pv-bar .fill{
  position:absolute;left:0;top:50%;transform:translateY(-50%);height:4px;border-radius:3px;
  background:linear-gradient(90deg,#8FBC8F,#E8C9A0);pointer-events:none;
}
.pv-ctrl{display:flex;align-items:center;justify-content:center;gap:clamp(14px,3vw,30px);padding:6px 0 2px}
.pv-ctl{
  width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-size:19px;
  color:var(--dk-sub);transition:all .2s var(--ease);cursor:pointer;
}
.pv-ctl:hover{background:rgba(255,255,255,.1);color:#fff}
.pv-ctl.on{color:#BFE3CF}
.pv-ctl.big{font-size:22px}
.pv-play{
  width:62px;height:62px;border-radius:50%;display:grid;place-items:center;font-size:24px;color:#0B0F0E;
  background:linear-gradient(135deg,#FFF,#DCE8DF);
  box-shadow:0 10px 34px rgba(143,188,143,.35),0 4px 14px rgba(0,0,0,.4);
  transition:all .25s var(--ease);cursor:pointer;
}
.pv-play:hover{transform:scale(1.06)}
.pv-play:active{transform:scale(.97)}
.pv-play .app-icon{margin-left:2px}
.pv-vol{display:flex;align-items:center;justify-content:center;gap:10px;color:var(--dk-sub);font-size:15px}
.pv-vol input{width:180px;accent-color:#8FBC8F;height:4px;cursor:pointer}
.pv-queue-btn{
  position:absolute;right:clamp(18px,4vw,48px);bottom:calc(120px + env(safe-area-inset-bottom));
  width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-size:19px;
  color:rgba(255,255,255,.75);background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);
  backdrop-filter:blur(8px);cursor:pointer;transition:all .2s;
}
.pv-queue-btn:hover{background:rgba(255,255,255,.16);color:#fff}

/* 队列抽屉 */
.queue-mask{
  position:fixed;inset:0;z-index:94;background:rgba(6,9,8,.45);backdrop-filter:blur(3px);
  opacity:0;pointer-events:none;transition:opacity .3s;
}
.queue-mask.open{opacity:1;pointer-events:auto}
.queue{
  position:fixed;top:0;right:0;bottom:0;z-index:95;width:min(340px,88vw);
  background:rgba(23,28,26,.94);backdrop-filter:blur(28px) saturate(1.4);
  border-left:1px solid rgba(255,255,255,.08);
  transform:translateX(102%);transition:transform .4s var(--ease);
  display:flex;flex-direction:column;padding:22px 0 0;color:var(--dk-ink);
}
.queue.open{transform:none}
.queue-head{display:flex;align-items:center;justify-content:space-between;padding:0 20px 14px}
.queue-head b{font-size:15px;font-weight:650}
.queue-head span{font-size:12px;color:var(--dk-sub);margin-left:8px}
.queue-list{overflow:auto;flex:1;padding:0 10px 20px;scrollbar-width:none}
.queue-list::-webkit-scrollbar{display:none}
.q-row{display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:var(--r-md);cursor:pointer;transition:background .2s}
.q-row:hover{background:rgba(255,255,255,.06)}
.q-cov{width:40px;height:40px;border-radius:var(--r-sm);overflow:hidden;flex:none}
.qm{flex:1;min-width:0}
.qt{font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qa{font-size:12px;color:var(--dk-sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.q-row.cur .qt{color:#BFE3CF}
.q-eq{display:flex;align-items:flex-end;gap:2px;height:14px;padding-right:6px}
.q-eq b{width:2.5px;background:#8FBC8F;border-radius:1px;animation:eq 1s ease-in-out infinite}
.q-eq b:nth-child(1){height:6px}.q-eq b:nth-child(2){height:12px;animation-delay:.15s}.q-eq b:nth-child(3){height:9px;animation-delay:.3s}

/* H5 */
@media (max-width:900px){
  .pv{padding:14px 18px calc(14px + env(safe-area-inset-bottom))}
  .pv-main{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr);gap:14px;align-items:start;padding-top:8px}
  .pv-stage{flex-direction:row;align-items:center;gap:16px;width:100%}
  .pv-cover{width:132px;max-width:none;flex:none;transform:none;animation:none!important}
  .pv-meta{text-align:left;flex:1;min-width:0}
  .pv-title{font-size:21px}
  .pv-tags{justify-content:flex-start;flex-wrap:wrap}
  .pv-lyrics{max-height:none;height:100%}
  .pv-vol{display:none}
  .pv-queue-btn{bottom:calc(150px + env(safe-area-inset-bottom))}
}
</style>
