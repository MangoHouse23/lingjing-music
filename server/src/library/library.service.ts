import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SongPayload, songKey } from './song.payload';

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  /* ---------- 歌单 ---------- */
  listPlaylists() {
    return this.prisma.playlist.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { tracks: true } } },
    });
  }

  getPlaylist(id: number) {
    return this.prisma.playlist.findUnique({
      where: { id },
      include: { tracks: { orderBy: [{ position: 'asc' }, { addedAt: 'asc' }] } },
    });
  }

  createPlaylist(data: { name: string; desc?: string; cover?: string; tint?: string }) {
    return this.prisma.playlist.create({ data });
  }

  async updatePlaylist(id: number, data: { name?: string; desc?: string }) {
    await this.prisma.playlist.update({ where: { id }, data });
    return this.getPlaylist(id);
  }

  async deletePlaylist(id: number) {
    await this.prisma.playlist.delete({ where: { id } });
    return { ok: true };
  }

  async addTracks(playlistId: number, songs: SongPayload[]) {
    const max = await this.prisma.playlistTrack.aggregate({
      where: { playlistId },
      _max: { position: true },
    });
    const base = (max._max.position ?? 0) + 1;
    const existing = await this.prisma.playlistTrack.findMany({
      where: { playlistId },
      select: { songKey: true },
    });
    const have = new Set(existing.map((e) => e.songKey));
    const fresh = songs
      .slice(0, 300)
      .filter((s) => s.source && s.sourceId && !have.has(songKey(s)));
    if (!fresh.length) return { added: 0 };
    const data = fresh.map((s, i) => ({
      playlistId,
      songKey: songKey(s),
      title: s.title,
      artist: s.artist,
      album: s.album,
      duration: Math.round(s.duration ?? 0),
      cover: s.cover,
      source: s.source,
      sourceId: s.sourceId,
      quality: s.quality ?? JSON.stringify([]),
      position: base + i,
    }));
    const r = await this.prisma.playlistTrack.createMany({ data });
    return { added: r.count };
  }

  async removeTrack(playlistId: number, trackId: number) {
    await this.prisma.playlistTrack.deleteMany({ where: { id: trackId, playlistId } });
    return { ok: true };
  }

  /* ---------- 我喜欢 ---------- */
  listLiked() {
    return this.prisma.likedSong.findMany({ orderBy: { addedAt: 'desc' } });
  }

  async likeSong(song: SongPayload) {
    await this.prisma.likedSong.upsert({
      where: { key: songKey(song) },
      update: { title: song.title, artist: song.artist, cover: song.cover },
      create: {
        key: songKey(song),
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: Math.round(song.duration ?? 0),
        cover: song.cover,
        source: song.source,
        sourceId: song.sourceId,
        quality: song.quality ?? JSON.stringify([]),
      },
    });
    return { ok: true };
  }

  async unlikeSong(key: string) {
    await this.prisma.likedSong.deleteMany({ where: { key: decodeURIComponent(key) } });
    return { ok: true };
  }

  /* ---------- 播放历史 ---------- */
  listHistory(limit = 100) {
    return this.prisma.playHistory.findMany({ orderBy: { playedAt: 'desc' }, take: Math.min(limit, 200) });
  }

  async addHistory(song: SongPayload) {
    await this.prisma.playHistory.create({
      data: {
        key: songKey(song),
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: Math.round(song.duration ?? 0),
        cover: song.cover,
        source: song.source,
        sourceId: song.sourceId,
      },
    });
    // 只保留最近 500 条
    const count = await this.prisma.playHistory.count();
    if (count > 500) {
      const old = await this.prisma.playHistory.findMany({
        orderBy: { playedAt: 'desc' },
        skip: 500,
        take: count - 500,
        select: { id: true },
      });
      await this.prisma.playHistory.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
    }
    return { ok: true };
  }

  async clearHistory() {
    await this.prisma.playHistory.deleteMany({});
    return { ok: true };
  }

  /* ---------- 设置 ---------- */
  async getSettings(): Promise<{ value: any }> {
    const row = await this.prisma.setting.findUnique({ where: { key: 'app' } });
    return { value: row ? JSON.parse(row.value) : null };
  }

  async putSettings(value: any) {
    await this.prisma.setting.upsert({
      where: { key: 'app' },
      update: { value: JSON.stringify(value) },
      create: { key: 'app', value: JSON.stringify(value) },
    });
    return { ok: true };
  }

  /* ---------- 统计 ---------- */
  async stats() {
    const [playlists, liked, history] = await Promise.all([
      this.prisma.playlist.count(),
      this.prisma.likedSong.count(),
      this.prisma.playHistory.count(),
    ]);
    return { playlists, liked, history };
  }
}
