<script setup lang="ts">
/** 加入歌单弹层 */
import { ref, watch } from 'vue';
import AppIcon from './AppIcon.vue';
import { libraryApi } from '@/api/library';
import { useLibraryStore } from '@/stores/library';
import { toast, useUiStore } from '@/stores/toast';

const ui = useUiStore();
const lib = useLibraryStore();
const selected = ref<number | null>(null);
const busy = ref(false);

watch(
  () => ui.addToPlaylistSong,
  (v) => {
    selected.value = null;
    if (v) lib.refreshPlaylists();
  },
);

async function confirm() {
  const ctx = ui.addToPlaylistSong;
  if (!ctx || selected.value == null) return;
  busy.value = true;
  try {
    const r = await libraryApi.addTracks(selected.value, [ctx.payload]);
    await lib.refreshPlaylists();
    toast(`已添加 ${r.added} 首到歌单`);
    ui.closeAddTo();
  } catch (e: any) {
    toast(e?.message || '添加失败');
  } finally {
    busy.value = false;
  }
}

async function createAndAdd() {
  const ctx = ui.addToPlaylistSong;
  if (!ctx) return;
  busy.value = true;
  try {
    const pl = await lib.createPlaylist(`「${ctx.title}」收藏`);
    await libraryApi.addTracks(pl.id, [ctx.payload]);
    await lib.refreshPlaylists();
    toast(`已创建「${pl.name}」并加入`);
    ui.closeAddTo();
  } catch (e: any) {
    toast(e?.message || '创建失败');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-mask" :class="{ open: !!ui.addToPlaylistSong }" @click.self="ui.closeAddTo()">
      <div class="modal add-modal" v-if="ui.addToPlaylistSong">
        <h3>
          把「{{ ui.addToPlaylistSong.title }}」加入歌单
          <button class="btn-icon" @click="ui.closeAddTo()" aria-label="关闭"><AppIcon name="x" /></button>
        </h3>
        <p class="m-desc">{{ ui.addToPlaylistSong.artist }}</p>
        <div class="add-list">
          <button
            v-for="p in lib.playlists"
            :key="p.id"
            class="add-row"
            :class="{ sel: selected === p.id }"
            @click="selected = p.id"
          >
            <span class="add-dot" :style="{ background: p.tint || 'linear-gradient(135deg,#5B8A72,#33523F)' }"></span>
            <span class="add-name">{{ p.name }}</span>
            <span class="add-cnt">{{ p._count?.tracks ?? 0 }} 首</span>
            <AppIcon v-if="selected === p.id" name="check" class="add-check" />
          </button>
          <div v-if="!lib.playlists.length" class="empty" style="padding:24px 0">还没有歌单，先新建一个吧</div>
        </div>
        <div class="modal-ops">
          <button class="btn btn-ghost" @click="createAndAdd" :disabled="busy"><AppIcon name="plus" />新建并加入</button>
          <button class="btn btn-primary" @click="confirm" :disabled="busy || selected == null"><AppIcon name="check" />加入歌单</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
.add-modal{width:min(440px,92vw)}
.add-list{display:flex;flex-direction:column;gap:4px;max-height:280px;overflow:auto}
.add-row{
  display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:var(--r-md);
  cursor:pointer;transition:background .2s;text-align:left;
}
.add-row:hover{background:var(--wash)}
.add-row.sel{background:var(--primary-soft)}
.add-dot{width:34px;height:34px;border-radius:10px;flex:none}
.add-name{flex:1;font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.add-cnt{font-size:12px;color:var(--faint)}
.add-check{color:var(--primary);font-size:16px}
</style>
