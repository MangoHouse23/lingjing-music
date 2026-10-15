import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'discover', component: () => import('@/views/DiscoverView.vue') },
    { path: '/search', name: 'search', component: () => import('@/views/SearchView.vue') },
    { path: '/playlist/:id', name: 'playlist', component: () => import('@/views/PlaylistView.vue') },
    { path: '/library', name: 'library', component: () => import('@/views/LibraryView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/flow', name: 'flow', component: () => import('@/views/FlowView.vue') },
    { path: '/editor', name: 'editor', component: () => import('@/views/EditorView.vue') },
    { path: '/editor/:id', name: 'editor-detail', component: () => import('@/views/EditorPlaylistView.vue') },
    { path: '/desktop-lyrics', name: 'desktop-lyrics', component: () => import('@/views/DesktopLyrics.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
});
