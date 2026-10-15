<script setup lang="ts">
/** P4 歌单详情：取色 Hero + 曲目管理 + 一键播放 */
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '@/components/AppIcon.vue';
import CoverImage from '@/components/CoverImage.vue';
import SongRow from '@/components/SongRow.vue';
import { libraryApi } from '@/api/library';
import { useLibraryStore } from '@/stores/library';
import { usePlayerStore } from '@/stores/player';
import { toast } from '@/stores/toast';
import { sourceLabel, trackToSong, type PlaylistDetail, type Song } from '@/types';
import { fmtDuration } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const player = usePlayerStore();
const lib = useLibraryStore();

const pl = ref<PlaylistDetail | null>(null);
const loading = ref(true);

const songs = computed<Song[]>(() => (pl.value?.tracks ?? []).map(trackToSong));
const totalDur = computed(() => songs.value.reduce((a, s) => a + (s.duration || 0), 0));

const TINTS = [
  'linear-gradient(135deg,#5B8A72,#33523F)',
  'linear-gradient(135deg,#31415E,#1B2438)',
  'linear-gradient(135deg,#2E4A52,#182B31)',
  'linear-gradient(135deg,#E8A87C,#C97B4E)',
  'linear-gradient(135deg,#4E6470,#2C3A42)',
  'linear-gradient(135deg,#A98F6B,#6E5A3F)',
  'linear-gradient(135deg,#8A7BB8,#4F4370)',
  'linear-gradient(135deg,#B99B7A,#7A6248)',
];
const tint = computed(() => {
  const id = pl.value?.id ?? 0;
  return pl.value?.tint || TINTS[id % TINTS.length];
});

const heroCover = computed(() => pl.value?.cover || songs.value[0]?.cover);

async function load() {
  loading.value = true;
  try {
    const data = await libraryApi.playlist(Number(route.params.id));
    if (!data) {
      toast('歌单不存在');
      router.replace('/library');
      return;
    }
    pl.value = data;
  } catch (e: any) {
    toast(e?.message || '歌单加载失败');
  } finally {
    loading.value = false;
  }
}

function playAll(shuffle = false) {
  if (!songs.value.length) return;
  const idx = shuffle ? Math.floor(Math.random() * songs.value.length) : 0;
  player.play(songs.value, idx);
  player.showPlayer = true;
}

async function rename() {
  if (!pl.value) return;
  const name = window.prompt('修改歌单名称', pl.value.name);
  if (!name?.trim()) return;
  await libraryApi.updatePlaylist(pl.value.id, { name: name.trim() });
  pl.value.name = name.trim();
  lib.refreshPlaylists();
  toast('歌单已重命名');
}

async function remove() {
  if (!pl.value) return;
  if (!window.confirm(`确定删除歌单「${pl.value.name}」吗？`)) return;
  await libraryApi.deletePlaylist(pl.value.id);
  await lib.refreshPlaylists();
  toast('歌单已删除');
  router.replace('/library');
}

async function removeTrack(trackId: number) {
  if (!pl.value) return;
  await libraryApi.removeTrack(pl.value.id, trackId);
  pl.value.tracks = pl.value.tracks.filter((t) => t.id !== trackId);
  lib.refreshPlaylists();
  toast('已从歌单移除');
}

onMounted(load);
</script>

<template>
  <main class="app-content">
    <div v-if="loading" class="pg-sub" style="padding:40px 0">歌单加载中…</div>
    <template v-else-if="pl">
      <!-- Hero -->
      <section class="pl-hero" :style="{ background: `linear-gradient(150deg, rgba(16,18,20,.28), rgba(16,18,20,.55)), ${tint}` }">
        <div class="pl-hero-cover">
          <CoverImage v-if="heroCover" :cover="heroCover" :alt="pl.name" />
          <div v-else class="pl-hero-fallback">{{ pl.name.slice(0, 1) }}</div>
        </div>
        <div class="pl-hero-info">
          <div class="pg-kicker">歌单 · PLAYLIST</div>
          <h1 class="pl-hero-name">{{ pl.name }}</h1>
          <div class="pl-hero-meta">
            {{ songs.length }} 首 · 约 {{ fmtDuration(totalDur) }}
            <template v-if="pl.desc"> · {{ pl.desc }}</template>
          </div>
          <div class="pl-hero-ops">
            <button class="btn btn-primary" @click="playAll()"><AppIcon name="play" />播放全部</button>
            <button class="btn btn-ghost" @click="playAll(true)"><AppIcon name="shuffle" />随机播放</button>
            <button class="btn-icon" @click="rename" aria-label="重命名"><AppIcon name="pen" /></button>
            <button class="btn-icon" @click="remove" aria-label="删除歌单"><AppIcon name="trash" /></button>
          </div>
        </div>
      </section>

      <!-- 曲目 -->
      <div v-if="songs.length" class="song-list">
        <SongRow
          v-for="(s, i) in songs"
          :key="s.key"
          :song="s"
          :index="i"
          :queue="songs"
          :delay="Math.min(i, 12) * 35"
          removable
          @remove="removeTrack(pl!.tracks[i].id)"
        />
      </div>
      <div v-else class="empty">
        <AppIcon name="music" />
        <p>歌单还是空的<br />去搜索页找几首喜欢的歌加进来</p>
        <button class="btn btn-ghost" style="margin-top: 14px" @click="router.push('/search')"><AppIcon name="search" />去搜索</button>
      </div>
      <p v-if="songs.length" class="pl-note">来源徽标标注每首歌的可用音源 · 灰色歌曲播放时自动换源</p>
    </template>
  </main>
</template>

<style scoped>
.pl-hero{
  position:relative;overflow:hidden;border-radius:var(--r-xl);
  display:flex;gap:32px;align-items:flex-end;
  padding:40px;margin-bottom:30px;color:#fff;
}
.pl-hero::before{
  content:"";position:absolute;width:340px;height:340px;border-radius:50%;
  right:-80px;top:-120px;filter:blur(70px);background:rgba(255,255,255,.16);
}
.pl-hero-cover{
  width:200px;height:200px;border-radius:var(--r-xl);overflow:hidden;flex:none;
  box-shadow:0 20px 56px rgba(0,0,0,.4);transform:rotate(-2deg);
  transition:transform .4s var(--ease);position:relative;z-index:1;background:rgba(0,0,0,.2);
}
.pl-hero:hover .pl-hero-cover{transform:rotate(0) scale(1.02)}
.pl-hero-fallback{
  width:100%;height:100%;display:grid;place-items:center;
  font-family:var(--f-display);font-size:56px;color:rgba(255,255,255,.9);
}
.pl-hero-info{position:relative;z-index:1;min-width:0;padding-bottom:4px}
.pl-hero-info .pg-kicker{color:rgba(255,255,255,.72)}
.pl-hero-name{font-family:var(--f-display);font-size:34px;font-weight:600;line-height:1.25;margin:6px 0 8px}
.pl-hero-meta{font-size:13px;color:rgba(255,255,255,.82)}
.pl-hero-ops{display:flex;align-items:center;gap:12px;margin-top:22px;flex-wrap:wrap}
.pl-hero .btn-primary{background:#fff;color:var(--ink);box-shadow:0 8px 24px rgba(0,0,0,.26)}
.pl-hero .btn-primary:hover{background:rgba(255,255,255,.92)}
.pl-hero .btn-ghost{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.35);color:#fff;backdrop-filter:blur(8px)}
.pl-hero .btn-ghost:hover{background:rgba(255,255,255,.24);color:#fff;border-color:rgba(255,255,255,.5)}
.pl-hero .btn-icon{color:rgba(255,255,255,.85)}
.pl-hero .btn-icon:hover{background:rgba(255,255,255,.16);color:#fff}
.pl-note{font-size:12px;color:var(--faint);text-align:center;margin-top:22px}
@media (max-width:900px){
  .pl-hero{flex-direction:column;align-items:flex-start;gap:20px;padding:26px 22px}
  .pl-hero-cover{width:132px;height:132px}
  .pl-hero-name{font-size:26px}
}
</style>
