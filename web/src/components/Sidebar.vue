<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from './AppIcon.vue';
import { useLibraryStore } from '@/stores/library';

const route = useRoute();
const lib = useLibraryStore();

const items = [
  { key: 'discover', label: '发现', icon: 'compass', to: '/' },
  { key: 'search', label: '搜索', icon: 'search', to: '/search' },
  { key: 'library', label: '音乐库', icon: 'library', to: '/library' },
];

const isActive = (to: string) => {
  if (to === '/') return route.path === '/';
  return route.path.startsWith(to);
};
const plActive = computed(() => {
  const m = route.path.match(/^\/playlist\/(\d+)/);
  return m ? Number(m[1]) : -1;
});
</script>

<template>
  <aside class="app-nav">
    <RouterLink class="brand" to="/">
      <span class="brand-mark">聆</span>
      <span class="brand-name">聆境<em>LINGJING</em></span>
    </RouterLink>
    <nav>
      <RouterLink v-for="it in items" :key="it.key" class="nav-item" :class="{ active: isActive(it.to) }" :to="it.to">
        <AppIcon :name="it.icon" />{{ it.label }}
      </RouterLink>
    </nav>
    <div class="nav-label">我的歌单<RouterLink to="/library?create=1" aria-label="新建歌单"><AppIcon name="plus" /></RouterLink></div>
    <nav class="nav-pl">
      <RouterLink
        v-for="p in lib.playlists"
        :key="p.id"
        class="nav-item"
        :class="{ active: plActive === p.id }"
        :to="`/playlist/${p.id}`"
      >
        <span class="nav-pl-dot" :style="{ background: p.tint || 'linear-gradient(135deg,#5B8A72,#33523F)' }" />
        <span>{{ p.name }}</span>
      </RouterLink>
      <div v-if="!lib.playlists.length" class="nav-empty">还没有歌单，去导入一个吧</div>
    </nav>
    <div class="nav-foot">
      <button class="nav-item" @click="$router.push('/library?import=1')"><AppIcon name="download-cloud" />导入歌单</button>
      <RouterLink class="nav-item" :class="{ active: route.path === '/settings' }" to="/settings"><AppIcon name="settings" />设置</RouterLink>
    </div>
  </aside>
</template>

<style>
.app-nav{
  position:fixed;inset:0 auto 0 0;width:var(--sidebar-w);z-index:40;
  display:flex;flex-direction:column;gap:2px;
  padding:28px 16px 20px;
  background:rgba(250,250,247,.82);
  backdrop-filter:blur(24px) saturate(1.4);-webkit-backdrop-filter:blur(24px) saturate(1.4);
  border-right:1px solid var(--line);
}
.brand{display:flex;align-items:center;gap:10px;padding:0 10px 24px}
.brand-mark{
  width:34px;height:34px;border-radius:10px;flex:none;
  display:grid;place-items:center;color:#fff;
  font-family:var(--f-display);font-size:18px;
  background:linear-gradient(135deg,#6B9C82,#4A7561);
  box-shadow:0 4px 14px rgba(91,138,114,.35);
}
.brand-name{font-weight:650;font-size:16px;letter-spacing:.02em}
.brand-name em{display:block;font-style:normal;font-family:var(--f-display);font-size:10px;font-weight:400;letter-spacing:.34em;color:var(--faint);text-transform:uppercase}
.app-nav>nav{display:flex;flex-direction:column;gap:2px}
.nav-item{
  display:flex;align-items:center;gap:12px;
  padding:9px 12px;border-radius:var(--r-md);
  font-size:14px;color:var(--sub);transition:all .2s var(--ease);cursor:pointer;
  text-align:left;width:100%;
}
.nav-item .app-icon{font-size:18px}
.nav-item:hover{color:var(--ink);background:rgba(26,29,31,.04)}
.nav-item.active{color:var(--ink);font-weight:600;background:var(--surface);box-shadow:var(--sh-sm)}
.nav-item.active .app-icon{color:var(--primary)}
.nav-label{
  margin:22px 12px 6px;font-size:11px;letter-spacing:.18em;color:var(--faint);
  display:flex;justify-content:space-between;align-items:center;
}
.nav-label a{color:var(--faint);display:flex;padding:2px;border-radius:6px;font-size:14px}
.nav-label a:hover{color:var(--primary)}
.nav-pl{min-height:0;overflow:auto;flex:1;scrollbar-width:none}
.nav-pl::-webkit-scrollbar{display:none}
.nav-pl .nav-item span:last-child{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}
.nav-empty{padding:8px 12px;font-size:12px;color:var(--faint);line-height:1.6}
.nav-pl-dot{width:26px;height:26px;border-radius:8px;flex:none}
.nav-foot{padding-top:14px;border-top:1px solid var(--line)}
@media (max-width:900px){
  .app-nav{display:none}
}
</style>
