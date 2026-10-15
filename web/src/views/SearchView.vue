<script setup lang="ts">
/** P3 搜索：聚合搜索 + 源筛选 + 热搜/历史 */
import { computed, onMounted, ref } from 'vue';
import AppIcon from '@/components/AppIcon.vue';
import SongRow from '@/components/SongRow.vue';
import { musicApi } from '@/api/music';
import { toast } from '@/stores/toast';
import type { Song } from '@/types';

const input = ref('');
const searching = ref(false);
const searched = ref(false);
const result = ref<Song[]>([]);
const sourceAvail = ref<Record<string, number>>({});
const filter = ref('all');
const history = ref<string[]>(JSON.parse(localStorage.getItem('lj.searchHistory') || '[]'));

const HOT = [
  { term: '海雾来信', tag: '' },
  { term: '陈屿 新专辑', tag: '热' },
  { term: '雨停之前 Live', tag: '' },
  { term: '通勤 民谣', tag: '新' },
  { term: '白噪合唱团', tag: '' },
  { term: '深夜 写作歌单', tag: '' },
  { term: '落日收音机', tag: '' },
  { term: '城市夜航', tag: '' },
  { term: '木星旅馆 Remix', tag: '新' },
  { term: '初雪 信号', tag: '' },
];

const HOT_HEATS = ['478万', '392万', '341万', '298万', '261万', '217万', '185万', '152万', '128万', '96万'];

const filtered = computed(() => {
  if (filter.value === 'all') return result.value;
  return result.value.filter((s) => s.sources.some((x) => x.source === filter.value));
});

async function doSearch(keyword: string) {
  const kw = keyword.trim();
  if (!kw) return;
  input.value = kw;
  searching.value = true;
  searched.value = true;
  try {
    const r = await musicApi.search(kw, undefined, 24);
    result.value = r.songs;
    sourceAvail.value = {};
    for (const s of r.songs) for (const src of s.sources) sourceAvail.value[src.source] = (sourceAvail.value[src.source] ?? 0) + 1;
    history.value = [kw, ...history.value.filter((h) => h !== kw)].slice(0, 10);
    localStorage.setItem('lj.searchHistory', JSON.stringify(history.value));
  } catch (e: any) {
    toast(e?.message || '搜索失败');
  } finally {
    searching.value = false;
  }
}

function clearHistory() {
  history.value = [];
  localStorage.removeItem('lj.searchHistory');
  toast('搜索历史已清空');
}

function backToDefault() {
  input.value = '';
  searched.value = false;
  result.value = [];
}

const SOURCE_CHIPS = computed(() => {
  const meta = [
    { key: 'all', label: '全部' },
    { key: 'netease', label: '网易云' },
    { key: 'kuwo', label: '酷我' },
    { key: 'netease-gd', label: '网易云聚合' },
    { key: 'bilibili', label: 'B站' },
  ];
  return meta.map((m) => ({ ...m, cnt: m.key === 'all' ? result.value.length : sourceAvail.value[m.key] ?? 0 }));
});

onMounted(() => {});
</script>

<template>
  <main class="app-content">
    <div class="pg-head">
      <div class="pg-kicker">SEARCH · 聚合搜索</div>
      <h1 class="pg-title">一个框，搜全网</h1>
      <p class="pg-sub">网易云 · 网易云聚合 · B站 · 演示源 并发检索，同名歌曲自动合并，VIP/灰色歌自动换源</p>
    </div>

    <div class="search-box" :class="{ 'has-val': !!input }" style="margin-bottom: 34px">
      <AppIcon name="search" />
      <input
        v-model="input"
        type="text"
        placeholder="试试搜索：海雾来信"
        @keydown.enter="doSearch(input)"
        autofocus
      />
      <button v-if="input" class="btn-icon" style="width:32px;height:32px;font-size:16px" @click="backToDefault" aria-label="清空">
        <AppIcon name="x" />
      </button>
    </div>

    <!-- 默认态 -->
    <section v-if="!searched">
      <div class="sec-head" style="margin-top:0">
        <h2>搜索历史<small>HISTORY</small></h2>
        <button v-if="history.length" class="link" @click="clearHistory"><AppIcon name="x" />清空</button>
      </div>
      <div v-if="history.length" class="history-chips">
        <button v-for="h in history" :key="h" class="hchip" @click="doSearch(h)">{{ h }}</button>
      </div>
      <p v-else class="pg-sub">暂无搜索历史</p>

      <div class="sec-head">
        <h2>热搜榜<small>TRENDING</small></h2>
        <span class="pg-sub" style="font-size:12px">每小时更新</span>
      </div>
      <div class="hot-grid">
        <div v-for="(h, i) in HOT" :key="h.term" class="hot-item" :class="{ top: i < 3 }" @click="doSearch(h.term)">
          <span class="hot-no">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="hot-term">{{ h.term }}<span v-if="h.tag" class="tag">{{ h.tag }}</span></span>
          <span class="hot-hot">{{ HOT_HEATS[i] }} 次搜索</span>
        </div>
      </div>
    </section>

    <!-- 结果态 -->
    <section v-else>
      <div class="src-note">
        <span>
          为你找到 <b style="color:var(--ink)">{{ result.length }}</b> 首相关歌曲 · 同名歌曲已自动合并
          <template v-if="searching"> · 搜索中…</template>
        </span>
      </div>
      <div class="chips" style="margin-bottom: 18px">
        <button
          v-for="c in SOURCE_CHIPS"
          :key="c.key"
          class="chip"
          :class="{ active: filter === c.key }"
          @click="filter = c.key"
        >
          {{ c.label }}<span v-if="c.cnt" class="cnt">{{ c.cnt }}</span>
        </button>
      </div>
      <div v-if="filtered.length" class="song-list">
        <SongRow v-for="(s, i) in filtered" :key="s.key" :song="s" :index="i" :queue="filtered" :delay="Math.min(i, 12) * 35" />
      </div>
      <div v-else-if="!searching" class="empty">
        <AppIcon name="search" />
        <p>没有找到「{{ input }}」相关歌曲<br />换个关键词试试，或到导入向导粘贴歌单链接</p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.src-note{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 14px;font-size:13px;color:var(--sub)}
</style>
