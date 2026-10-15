<script setup lang="ts">
/** P8 设置：音源管理 / 音质偏好 / 推荐配比 / 播放偏好 / 数据 */
import { onMounted, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import { libraryApi } from '@/api/library';
import { musicApi } from '@/api/music';
import { useLibraryStore } from '@/stores/library';
import { usePlayerStore } from '@/stores/player';
import { useSettingsStore } from '@/stores/settings';
import { toast } from '@/stores/toast';
import { EQ_PRESETS } from '@/utils/eq';

const settings = useSettingsStore();
const lib = useLibraryStore();
const player = usePlayerStore();
const sources = ref<any[]>([]);
const isElectron = !!(window as any).electronAPI;

const BR_OPTIONS = [
  { br: 128, label: '128k', desc: '流畅省流' },
  { br: 320, label: '320k', desc: '高品质推荐' },
  { br: 999, label: '无损', desc: 'Lossless · 视音源可用' },
];

function toggleSource(key: string) {
  settings.toggleSource(key);
  toast(`${key} 音源已${settings.s.sources.includes(key) ? '启用' : '停用'}`);
}

function setBr(o: { br: number; label: string }) {
  settings.set('br', o.br);
  settings.set('brLabel', o.label);
  toast(`默认音质：${o.label}`);
}

function setRatio(v: number) {
  settings.set('dailyRatio', v);
}

function setReduceMotion(v: boolean) {
  settings.set('reduceMotion', v);
  document.documentElement.classList.toggle('reduce-motion', v);
  toast(v ? '已减少动态效果' : '已恢复动效');
}

/* 桌面歌词（仅 Electron 环境） */
const lyricOn = ref(false);
(window as any).electronAPI?.onDesktopLyricState?.((v: boolean) => (lyricOn.value = v));
function toggleLyric() {
  if (!isElectron) {
    toast('桌面歌词需使用桌面端（npm run start in desktop/）');
    return;
  }
  (window as any).electronAPI.toggleDesktopLyric();
  lyricOn.value = !lyricOn.value;
}

async function exportData() {
  try {
    const [playlists, liked] = await Promise.all([libraryApi.playlists(), libraryApi.liked()]);
    const details = await Promise.all(playlists.map((p) => libraryApi.playlist(p.id)));
    const data = { exportedAt: new Date().toISOString(), settings: settings.s, liked, playlists: details };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lingjing-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('备份已导出');
  } catch {
    toast('导出失败');
  }
}

async function clearHistory() {
  if (!window.confirm('确定清空全部播放历史吗？')) return;
  await libraryApi.clearHistory();
  await lib.load();
  toast('播放历史已清空');
}

onMounted(() => {
  lib.load();
  musicApi.sources().then((s) => (sources.value = s)).catch(() => {});
});
</script>

<template>
  <main class="app-content">
    <div class="pg-head">
      <div class="pg-kicker">SETTINGS · 设置</div>
      <h1 class="pg-title">设置</h1>
      <p class="pg-sub">音源、音质、推荐配比与数据管理 · 所有偏好自动同步到本地与服务端</p>
    </div>

    <div class="set-grid">
      <!-- 音源管理 -->
      <section class="card set-card">
        <h3><AppIcon name="sliders-horizontal" />音源管理</h3>
        <p class="set-desc">停用的音源不参与搜索与播放；健康分反映各源近期可用性。</p>
        <div v-for="s in sources" :key="s.key" class="src-row">
          <span class="health" :class="s.available ? 'ok' : 'bad'" :title="`健康分 ${s.score}`"></span>
          <span class="src-name">{{ s.label }}</span>
          <span class="src-score">健康分 {{ s.score }}</span>
          <button class="switch" :class="{ on: settings.s.sources.includes(s.key) }" @click="toggleSource(s.key)" :aria-label="`切换 ${s.label}`">
            <i></i>
          </button>
        </div>
        <p v-if="!sources.length" class="set-desc">音源状态获取失败，请确认服务端已启动。</p>
      </section>

      <!-- 播放偏好 -->
      <section class="card set-card">
        <h3><AppIcon name="audio-lines" />播放偏好</h3>
        <p class="set-desc">默认音质（实际音质视音源可用情况自动匹配）。</p>
        <div class="br-row">
          <button
            v-for="o in BR_OPTIONS"
            :key="o.br"
            class="br-card"
            :class="{ on: settings.s.br === o.br }"
            @click="setBr(o)"
          >
            <b>{{ o.label }}</b><span>{{ o.desc }}</span>
          </button>
        </div>
        <label class="toggle-row">
          <span>显示歌词翻译<small>有翻译时显示双语对照</small></span>
          <button class="switch" :class="{ on: settings.s.showTranslation }" @click="settings.set('showTranslation', !settings.s.showTranslation)"><i></i></button>
        </label>
        <label class="toggle-row">
          <span>桌面歌词<small>仅桌面端可用 · 快捷键 ⌘/Ctrl+Shift+L</small></span>
          <button class="switch" :class="{ on: lyricOn }" :disabled="!isElectron" @click="toggleLyric"><i></i></button>
        </label>
        <label class="toggle-row">
          <span>减少动态<small>关闭大部分动画（无障碍）</small></span>
          <button class="switch" :class="{ on: settings.s.reduceMotion }" @click="setReduceMotion(!settings.s.reduceMotion)"><i></i></button>
        </label>
      </section>

      <!-- 均衡器 -->
      <section class="card set-card">
        <h3><AppIcon name="sliders-horizontal" />均衡器</h3>
        <p class="set-desc">三段 EQ（200Hz / 1kHz / 4kHz），点击预设即时生效。</p>
        <label class="toggle-row" style="padding-top:0">
          <span>启用均衡器<small>关闭时输出平直信号</small></span>
          <button class="switch" :class="{ on: settings.s.eqEnabled }" @click="player.setEq(!settings.s.eqEnabled)"><i></i></button>
        </label>
        <div class="eq-row">
          <button
            v-for="p in EQ_PRESETS"
            :key="p.key"
            class="chip"
            :class="{ active: settings.s.eqPreset === p.key }"
            @click="player.setEq(true, p.key)"
          >
            {{ p.label }}
          </button>
        </div>
      </section>

      <!-- 推荐配比 -->
      <section class="card set-card">
        <h3><AppIcon name="sparkles" />每日推荐配比</h3>
        <p class="set-desc">熟悉：基于你的喜欢与最近聆听；探索：来自新流派关键词。每天 0 点刷新。</p>
        <div class="ratio-row">
          <span class="ratio-label">熟悉 {{ Math.round(settings.s.dailyRatio * 100) }}%</span>
          <input
            type="range"
            min="0.3"
            max="0.9"
            step="0.05"
            :value="settings.s.dailyRatio"
            @input="setRatio(Number(($event.target as HTMLInputElement).value))"
          />
          <span class="ratio-label">探索 {{ 100 - Math.round(settings.s.dailyRatio * 100) }}%</span>
        </div>
      </section>

      <!-- 数据 -->
      <section class="card set-card">
        <h3><AppIcon name="folder" />数据管理</h3>
        <p class="set-desc">歌单、喜欢与播放记录保存在本地 SQLite，可随时导出备份。</p>
        <div class="data-ops">
          <button class="btn btn-ghost" @click="exportData"><AppIcon name="download" />导出备份 JSON</button>
          <button class="btn btn-ghost" @click="clearHistory"><AppIcon name="trash" />清空播放历史</button>
        </div>
        <p class="set-desc" style="margin-top:14px">
          快捷键：Space 播放/暂停 · Shift+←/→ 切歌 · Shift+↑/↓ 音量 · L 喜欢 · Esc 关闭播放页
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.set-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.set-card{padding:26px 28px}
.set-card h3{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:650}
.set-card h3 .app-icon{color:var(--primary);font-size:19px}
.set-desc{font-size:13px;color:var(--sub);margin:8px 0 16px}
.src-row{display:flex;align-items:center;gap:12px;padding:10px 4px;border-bottom:1px solid var(--line)}
.src-row:last-of-type{border-bottom:0}
.health{width:8px;height:8px;border-radius:50%;flex:none}
.health.ok{background:var(--primary)}
.health.bad{background:var(--danger)}
.src-name{flex:1;font-size:14px;font-weight:600}
.src-score{font-size:12px;color:var(--faint);font-variant-numeric:tabular-nums}
.switch{
  width:42px;height:24px;border-radius:999px;background:var(--wash);
  border:1px solid var(--line);position:relative;cursor:pointer;transition:background .2s;flex:none;
}
.switch i{
  position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;
  background:#fff;box-shadow:var(--sh-sm);transition:transform .25s var(--ease);
}
.switch.on{background:var(--primary);border-color:var(--primary)}
.switch.on i{transform:translateX(18px)}
.toggle-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 0;border-bottom:1px solid var(--line)}
.toggle-row:last-child{border-bottom:0}
.toggle-row span{font-size:14px;font-weight:500;display:flex;flex-direction:column;gap:2px}
.toggle-row small{font-size:12px;color:var(--faint);font-weight:400}
.br-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:8px}
.br-card{
  border:1.5px solid var(--line);border-radius:var(--r-md);padding:14px 10px;
  display:flex;flex-direction:column;gap:2px;align-items:center;cursor:pointer;
  transition:all .2s var(--ease);background:var(--surface);
}
.br-card b{font-size:16px}
.br-card span{font-size:11.5px;color:var(--faint)}
.br-card.on{border-color:var(--primary);background:var(--primary-soft)}
.br-card.on b{color:var(--primary)}
.ratio-row{display:flex;align-items:center;gap:14px}
.ratio-label{font-size:12.5px;color:var(--sub);white-space:nowrap;font-variant-numeric:tabular-nums}
.ratio-row input{flex:1;accent-color:var(--primary);height:4px;cursor:pointer}
.data-ops{display:flex;gap:10px;flex-wrap:wrap}
.eq-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.switch:disabled{opacity:.45;cursor:not-allowed}
@media (max-width:900px){
  .set-grid{grid-template-columns:1fr}
}
</style>
