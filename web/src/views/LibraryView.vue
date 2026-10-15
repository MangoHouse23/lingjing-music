<script setup lang="ts">
/** P6 音乐库：我喜欢 / 最近播放 + 歌单管理 + 导入 */
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import PlaylistCard from '@/components/PlaylistCard.vue';
import SongRow from '@/components/SongRow.vue';
import { useLibraryStore } from '@/stores/library';
import { usePlayerStore } from '@/stores/player';
import { toast, useUiStore } from '@/stores/toast';
import { trackToSong, type Song } from '@/types';

const route = useRoute();
const router = useRouter();
const lib = useLibraryStore();
const player = usePlayerStore();
const ui = useUiStore();

const tab = ref(0);
const likedSongs = computed<Song[]>(() => lib.liked.map(trackToSong));
const historySongs = computed<Song[]>(() => lib.history.map(trackToSong));
const current = computed(() => (tab.value === 0 ? likedSongs.value : historySongs.value));

function playAll() {
  if (!current.value.length) return;
  player.play(current.value, 0);
  player.showPlayer = true;
}

async function createPlaylist() {
  const name = window.prompt('新建歌单名称');
  if (!name?.trim()) return;
  try {
    const pl = await lib.createPlaylist(name.trim());
    toast(`已创建「${pl.name}」`);
  } catch (e: any) {
    toast(e?.message || '创建失败');
  }
}

onMounted(async () => {
  await lib.load();
  if (route.query.import === '1') ui.openImport();
  if (route.query.create === '1') createPlaylist();
});
watch(
  () => route.query,
  (q) => {
    if (q.import === '1') ui.openImport();
    if (q.create === '1') createPlaylist();
  },
);
</script>

<template>
  <main class="app-content">
    <div class="pg-head lib-head">
      <div>
        <div class="pg-kicker">MY LIBRARY · 音乐库</div>
        <h1 class="pg-title">音乐库</h1>
        <p class="pg-sub">{{ lib.stats.liked }} 首喜欢 · {{ lib.stats.history }} 条最近播放 · {{ lib.stats.playlists }} 张歌单</p>
      </div>
      <button class="btn btn-ghost" @click="ui.openImport()"><AppIcon name="download-cloud" />导入外部歌单</button>
    </div>

    <div class="tab-line">
      <button :class="{ active: tab === 0 }" @click="tab = 0">我喜欢<span class="cnt">{{ likedSongs.length }}</span></button>
      <button :class="{ active: tab === 1 }" @click="tab = 1">最近播放<span class="cnt">{{ historySongs.length }}</span></button>
      <button class="play-all-link" @click="playAll"><AppIcon name="play" />播放全部</button>
    </div>

    <div v-if="current.length" class="song-list" :key="tab">
      <SongRow v-for="(s, i) in current" :key="s.key + tab" :song="s" :index="i" :queue="current" :delay="Math.min(i, 12) * 35" />
    </div>
    <div v-else class="empty">
      <AppIcon name="heart" />
      <p>{{ tab === 0 ? '还没有喜欢的音乐，播放时点击红心收藏吧' : '还没有播放记录，去发现页开始聆听吧' }}</p>
      <button class="btn btn-ghost" style="margin-top:14px" @click="router.push('/')"><AppIcon name="compass" />去发现</button>
    </div>

    <div class="sec-head">
      <h2>我的歌单<small>MY PLAYLISTS</small></h2>
      <div style="display:flex;gap:8px">
        <button class="btn-icon" @click="createPlaylist" aria-label="新建歌单"><AppIcon name="plus" /></button>
        <button class="btn btn-ghost" @click="ui.openImport()"><AppIcon name="download-cloud" />导入歌单</button>
      </div>
    </div>
    <div v-if="lib.playlists.length" class="pl-grid">
      <PlaylistCard v-for="p in lib.playlists" :key="p.id" :playlist="p" />
    </div>
    <div v-else class="card empty-card">
      <AppIcon name="disc-3" />
      <p>还没有歌单，导入网易云歌单一键迁移</p>
      <button class="btn btn-ghost" @click="ui.openImport()"><AppIcon name="download-cloud" />导入歌单</button>
    </div>
  </main>
</template>

<style scoped>
.lib-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px}
.play-all-link{
  margin-left:auto;display:inline-flex;align-items:center;gap:6px;
  font-size:13px;color:var(--sub);cursor:pointer;transition:color .2s;
}
.play-all-link:hover{color:var(--primary)}
.empty-card{padding:40px;text-align:center;color:var(--sub);font-size:13.5px}
.empty-card .app-icon{font-size:34px;color:var(--faint);margin-bottom:10px}
.empty-card p{margin-bottom:16px}
</style>
