import { defineStore } from 'pinia';
import { libraryApi } from '@/api/library';
import { sourceLabel, type LikedRow, type PlaylistSummary, type SongPayload } from '@/types';
import { toast } from './toast';

export const useLibraryStore = defineStore('library', {
  state: () => ({
    playlists: [] as PlaylistSummary[],
    liked: [] as LikedRow[],
    likedKeys: new Set<string>(),
    history: [] as LikedRow[],
    stats: { playlists: 0, liked: 0, history: 0 },
    loaded: false,
  }),
  actions: {
    async load() {
      try {
        const [ov, liked, history] = await Promise.all([
          libraryApi.overview(),
          libraryApi.liked(),
          libraryApi.history(120),
        ]);
        this.playlists = ov.playlists;
        this.stats = ov.stats;
        this.liked = liked;
        this.likedKeys = new Set(liked.map((l) => l.key));
        this.history = history;
        this.loaded = true;
      } catch { /* 服务未启动时静默 */ }
    },
    isLiked(key: string) {
      return this.likedKeys.has(key);
    },
    async toggleLike(song: { key: string; title: string; artist: string; album?: string; duration: number; cover?: string; sources: { source: string; sourceId: string }[]; qualities?: string[] }) {
      const payload: SongPayload = {
        source: song.sources[0]?.source ?? 'demo',
        sourceId: song.sources[0]?.sourceId ?? '',
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        cover: song.cover,
        quality: JSON.stringify(song.qualities ?? []),
      };
      if (this.likedKeys.has(song.key)) {
        this.likedKeys.delete(song.key);
        this.liked = this.liked.filter((l) => l.key !== song.key);
        await libraryApi.unlike(song.key);
        toast('已从「我喜欢的音乐」移除');
      } else {
        this.likedKeys.add(song.key);
        this.liked = [{ key: song.key, title: song.title, artist: song.artist, album: song.album, duration: song.duration, cover: song.cover, source: payload.source, sourceId: payload.sourceId, quality: payload.quality, addedAt: new Date().toISOString() }, ...this.liked];
        await libraryApi.like(payload);
        toast('已加入「我喜欢的音乐」');
      }
      this.stats.liked = this.likedKeys.size;
    },
    async refreshPlaylists() {
      const ov = await libraryApi.overview();
      this.playlists = ov.playlists;
      this.stats = ov.stats;
    },
    async createPlaylist(name: string, desc?: string) {
      const pl = await libraryApi.createPlaylist(name, desc);
      await this.refreshPlaylists();
      return pl;
    },
    async addHistory(song: SongPayload) {
      try {
        await libraryApi.addHistory(song);
        this.history = [
          { key: `${song.source}:${song.sourceId}`, title: song.title, artist: song.artist, album: song.album, duration: song.duration ?? 0, cover: song.cover, source: song.source, sourceId: song.sourceId, quality: song.quality, playedAt: new Date().toISOString() },
          ...this.history.filter((h) => h.key !== `${song.source}:${song.sourceId}`),
        ].slice(0, 120);
      } catch { /* ignore */ }
    },
  },
});
