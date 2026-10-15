import { defineStore } from 'pinia';
import { libraryApi } from '@/api/library';

export interface AppSettings {
  sources: string[]; // 启用的音源 key
  br: number; // 128 / 320 / 999(无损)
  brLabel: string;
  dailyRatio: number; // 熟悉占比 0-1
  reduceMotion: boolean;
  showTranslation: boolean;
  eqEnabled: boolean;
  eqPreset: string;
}

const DEFAULTS: AppSettings = {
  sources: ['netease', 'kuwo', 'netease-gd', 'bilibili', 'demo'],
  br: 320,
  brLabel: '320k',
  dailyRatio: 0.7,
  reduceMotion: false,
  showTranslation: true,
  eqEnabled: false,
  eqPreset: 'flat',
};

export const useSettingsStore = defineStore('settings', {
  state: (): { s: AppSettings } => ({ s: { ...DEFAULTS } }),
  getters: {
    settings: (st) => st.s,
  },
  actions: {
    load() {
      try {
        const raw = localStorage.getItem('lj.settings');
        if (raw) this.s = { ...DEFAULTS, ...JSON.parse(raw) };
      } catch { /* ignore */ }
      // 服务端镜像（best-effort）
      libraryApi.settings().then((r) => {
        if (r.value && typeof r.value === 'object') this.s = { ...DEFAULTS, ...r.value };
      }).catch(() => {});
    },
    save() {
      localStorage.setItem('lj.settings', JSON.stringify(this.s));
      libraryApi.saveSettings(this.s).catch(() => {});
    },
    set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
      this.s[key] = value;
      this.save();
    },
    toggleSource(key: string) {
      const has = this.s.sources.includes(key);
      this.s.sources = has ? this.s.sources.filter((k) => k !== key) : [...this.s.sources, key];
      if (!this.s.sources.length) this.s.sources = ['demo'];
      this.save();
    },
  },
});
