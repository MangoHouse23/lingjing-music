import { defineStore } from 'pinia';

interface ToastItem {
  id: number;
  text: string;
}

let seq = 0;

export const useToastStore = defineStore('toast', {
  state: () => ({ items: [] as ToastItem[] }),
  actions: {
    show(text: string) {
      const id = ++seq;
      this.items.push({ id, text });
      setTimeout(() => {
        this.items = this.items.filter((t) => t.id !== id);
      }, 2200);
    },
  },
});

export const toast = (text: string) => useToastStore().show(text);

/** 全局 UI 状态：导入向导等 */
export const useUiStore = defineStore('ui', {
  state: () => ({
    importOpen: false,
    addToPlaylistSong: null as null | { title: string; artist: string; payload: any },
  }),
  actions: {
    openImport() {
      this.importOpen = true;
    },
    closeImport() {
      this.importOpen = false;
    },
    openAddTo(payload: any) {
      this.addToPlaylistSong = payload;
    },
    closeAddTo() {
      this.addToPlaylistSong = null;
    },
  },
});
