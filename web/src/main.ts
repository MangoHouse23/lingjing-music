import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { useLibraryStore } from './stores/library';
import { useSettingsStore } from './stores/settings';
import './styles/base.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);

// 初始化：设置 + 音乐库 + 减少动态偏好
const settings = useSettingsStore();
settings.load();
document.documentElement.classList.toggle('reduce-motion', settings.s.reduceMotion);

useLibraryStore().load();

app.mount('#app');
