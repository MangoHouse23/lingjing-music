<script setup lang="ts">
import { useRoute } from 'vue-router';
import AppIcon from './AppIcon.vue';

const route = useRoute();
const items = [
  { key: 'discover', label: '发现', icon: 'compass', to: '/' },
  { key: 'flow', label: '心流', icon: 'zap', to: '/flow' },
  { key: 'search', label: '搜索', icon: 'search', to: '/search' },
  { key: 'library', label: '音乐库', icon: 'library', to: '/library' },
];
const isActive = (it: (typeof items)[number]) => {
  if (it.key === 'flow') return route.path === '/flow';
  if (it.to === '/') return route.path === '/';
  return route.path.startsWith(it.to);
};
</script>

<template>
  <nav class="app-tabbar">
    <RouterLink v-for="it in items" :key="it.key" :to="it.to" :class="{ active: isActive(it) }">
      <AppIcon :name="it.icon" />{{ it.label }}
    </RouterLink>
  </nav>
</template>

<style>
.app-tabbar{display:none}
@media (max-width:900px){
  .app-tabbar{
    display:flex;position:fixed;left:0;right:0;bottom:0;z-index:60;
    height:calc(58px + env(safe-area-inset-bottom));padding-bottom:env(safe-area-inset-bottom);
    background:rgba(255,255,255,.92);backdrop-filter:blur(24px) saturate(1.5);
    border-top:1px solid var(--line);
  }
  .app-tabbar a{
    flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
    font-size:10.5px;color:var(--faint);transition:color .2s;
  }
  .app-tabbar a .app-icon{font-size:21px}
  .app-tabbar a.active{color:var(--primary);font-weight:600}
}
</style>
