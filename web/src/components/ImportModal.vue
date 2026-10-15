<script setup lang="ts">
/** 导入向导：粘贴链接 → 解析 → 预览匹配 → 建单入库 */
import { ref, watch } from 'vue';
import AppIcon from './AppIcon.vue';
import { libraryApi, musicApi } from '@/api';
import { useLibraryStore } from '@/stores/library';
import { toast, useUiStore } from '@/stores/toast';
import type { SongPayload } from '@/types';

const ui = useUiStore();
const lib = useLibraryStore();

const step = ref(1); // 1 粘贴 2 匹配中 3 预览
const link = ref('');
const resolving = ref(false);
const result = ref<{ name: string; cover?: string; source: string; sourceId: string; trackCount: number } | null>(null);
const importName = ref('');
const importing = ref(false);

watch(
  () => ui.importOpen,
  (v) => {
    if (v) {
      step.value = 1;
      link.value = '';
      result.value = null;
    }
  },
);

async function resolve() {
  if (!link.value.trim()) {
    toast('请先粘贴歌单分享链接');
    return;
  }
  resolving.value = true;
  step.value = 2;
  try {
    result.value = await musicApi.resolvePlaylist(link.value.trim());
    importName.value = result.value.name;
    step.value = 3;
    toast(`解析成功：${result.value.trackCount} 首曲目`);
  } catch (e: any) {
    toast(e?.message || '解析失败，请检查链接');
    step.value = 1;
  } finally {
    resolving.value = false;
  }
}

async function doImport() {
  if (!result.value) return;
  importing.value = true;
  try {
    // 重新解析拿到完整曲目（resolve 已返回 tracks？服务端返回 tracks 字段）
    const full = await musicApi.resolvePlaylist(link.value.trim());
    const pl = await lib.createPlaylist(importName.value || full.name, '从网易云导入');
    const songs: SongPayload[] = (full as any).tracks ?? [];
    if (songs.length) await libraryApi.addTracks(pl.id, songs);
    await lib.refreshPlaylists();
    toast(`已导入 ${songs.length} 首到「${pl.name}」`);
    ui.closeImport();
  } catch (e: any) {
    toast(e?.message || '导入失败');
  } finally {
    importing.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-mask" :class="{ open: ui.importOpen }" @click.self="ui.closeImport()">
      <div class="modal">
        <h3>
          导入外部歌单
          <button class="btn-icon" @click="ui.closeImport()" aria-label="关闭"><AppIcon name="x" /></button>
        </h3>
        <p class="m-desc">粘贴网易云歌单分享链接，自动在 5 个音源中逐首匹配聚合，灰色歌曲播放时自动换源。</p>

        <div class="steps">
          <span class="step" :class="{ done: step >= 1 }"><span class="step-dot" :class="{ done: step >= 1 }"><AppIcon v-if="step >= 1" name="check" /><template v-else>1</template></span>粘贴链接</span>
          <span class="step-line" :class="{ done: step >= 3 }"></span>
          <span class="step" :class="{ done: step >= 3 }"><span class="step-dot" :class="{ done: step >= 3 }"><AppIcon v-if="step >= 3" name="check" /><template v-else>2</template></span>匹配音源</span>
          <span class="step-line" :class="{ done: false }"></span>
          <span class="step" :class="{ done: false }"><span class="step-dot">3</span>完成导入</span>
        </div>

        <input class="input" v-model="link" type="url" placeholder="粘贴歌单分享链接，如 https://music.163.com/playlist?id=…" :disabled="step === 2" />

        <div v-if="step === 3 && result" class="import-preview">
          <div class="ip-head">
            <div class="ip-cov" v-if="result.cover">
              <img :src="`/api/music/proxy/image?url=${encodeURIComponent(result.cover)}`" alt="" />
            </div>
            <div>
              <div class="ip-name">{{ result.name }}</div>
              <div class="ip-meta">共 {{ result.trackCount }} 首 · 来源：网易云</div>
            </div>
          </div>
          <input class="input" v-model="importName" placeholder="歌单名称" style="margin-top: 12px" />
        </div>

        <div class="modal-ops">
          <button class="btn btn-ghost" @click="ui.closeImport()">取消</button>
          <button v-if="step < 3" class="btn btn-primary" :disabled="resolving" @click="resolve">
            <AppIcon name="download-cloud" />{{ resolving ? '解析中…' : '解析链接' }}
          </button>
          <button v-else class="btn btn-primary" :disabled="importing" @click="doImport">
            <AppIcon name="check" />{{ importing ? '导入中…' : '完成导入' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.steps{display:flex;align-items:center;margin:18px 0 20px}
.step{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--faint)}
.step.done{color:var(--primary)}
.step-line{flex:1;height:1.5px;background:var(--line);margin:0 10px;min-width:26px}
.step-line.done{background:var(--primary)}
.step-dot{
  width:26px;height:26px;border-radius:50%;display:grid;place-items:center;
  font-size:12px;font-weight:700;background:var(--wash);color:var(--sub);
}
.step-dot.done{background:var(--primary);color:#fff}
.step-dot .app-icon{font-size:13px}
.import-preview{margin-top:16px;border-top:1px solid var(--line);padding-top:16px}
.ip-head{display:flex;gap:14px;align-items:center}
.ip-cov{width:56px;height:56px;border-radius:var(--r-md);overflow:hidden;flex:none;background:var(--wash)}
.ip-cov img{width:100%;height:100%;object-fit:cover}
.ip-name{font-weight:650;font-size:15px}
.ip-meta{font-size:12.5px;color:var(--sub);margin-top:2px}
.modal-ops{display:flex;gap:10px;justify-content:flex-end;margin-top:20px}
</style>
