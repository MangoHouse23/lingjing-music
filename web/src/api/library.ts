import { del, get, patch, post, put } from './client';
import type { HistoryRow, LikedRow, PlaylistDetail, PlaylistSummary, SongPayload } from '@/types';

export const libraryApi = {
  overview() {
    return get<{ playlists: PlaylistSummary[]; stats: { playlists: number; liked: number; history: number } }>('/library/overview');
  },

  playlists() {
    return get<PlaylistSummary[]>('/library/playlists');
  },

  playlist(id: number) {
    return get<PlaylistDetail | null>(`/library/playlists/${id}`);
  },

  createPlaylist(name: string, desc?: string) {
    return post<PlaylistSummary>('/library/playlists', { name, desc });
  },

  updatePlaylist(id: number, data: { name?: string; desc?: string }) {
    return patch<PlaylistDetail>(`/library/playlists/${id}`, data);
  },

  deletePlaylist(id: number) {
    return del<{ ok: boolean }>(`/library/playlists/${id}`);
  },

  addTracks(playlistId: number, songs: SongPayload[]) {
    return post<{ added: number }>(`/library/playlists/${playlistId}/tracks`, { songs });
  },

  removeTrack(playlistId: number, trackId: number) {
    return del<{ ok: boolean }>(`/library/playlists/${playlistId}/tracks/${trackId}`);
  },

  liked() {
    return get<LikedRow[]>('/library/liked');
  },

  like(song: SongPayload) {
    return post<{ ok: boolean }>('/library/liked', song);
  },

  unlike(key: string) {
    return del<{ ok: boolean }>(`/library/liked/${encodeURIComponent(key)}`);
  },

  history(limit = 100) {
    return get<HistoryRow[]>(`/library/history?limit=${limit}`);
  },

  addHistory(song: SongPayload) {
    return post<{ ok: boolean }>('/library/history', song);
  },

  clearHistory() {
    return del<{ ok: boolean }>('/library/history');
  },

  settings() {
    return get<{ value: any }>('/library/settings');
  },

  saveSettings(value: any) {
    return put<{ ok: boolean }>('/library/settings', { value });
  },
};
