/** 静态演示模式请求解析器：把后端 API 形状映射到本地数据（无后端时托管整个应用） */
import {
  DEMO_EDITOR, DEMO_LYRIC, DEMO_SONGS, DEMO_STATION_TAGS,
  demoSongToSong, loadMockLibrary, saveMockLibrary,
} from './demo-data';

const pickSongs = (pred: (tags: string[]) => boolean, n: number) =>
  DEMO_SONGS.filter((s) => pred(s.tags))
    .concat(DEMO_SONGS.filter((s) => !pred(s.tags)))
    .slice(0, n)
    .map(demoSongToSong);

const rotate = <T>(arr: T[], by: number) => arr.slice(by).concat(arr.slice(0, by));

function searchDemo(keyword: string, limit = 20) {
  const kw = keyword.trim().toLowerCase();
  const matched = kw
    ? DEMO_SONGS.filter(
        (s) =>
          s.title.toLowerCase().includes(kw) ||
          s.artist.toLowerCase().includes(kw) ||
          s.album.toLowerCase().includes(kw),
      )
    : [];
  const list = (matched.length ? matched : rotate(DEMO_SONGS, keyword.length % DEMO_SONGS.length)).slice(0, limit);
  return list.map(demoSongToSong);
}

/** 返回 mock JSON 或 null（不支持端点） */
export function resolveMock(method: string, path: string, body: any): { status: number; data: any } | null {
  const lib = loadMockLibrary();
  const [p] = path.split('?');
  const seg = p.replace(/^\//, '').split('/'); // music/search | library/liked ...

  /* ---------- music ---------- */
  if (seg[0] === 'music') {
    if (seg[1] === 'search') {
      const q = new URLSearchParams(path.split('?')[1] || '');
      return { status: 200, data: { songs: searchDemo(q.get('keyword') || '', Number(q.get('limit')) || 20) } };
    }
    if (seg[1] === 'url') {
      const q = new URLSearchParams(path.split('?')[1] || '');
      const specs = JSON.parse(q.get('songs') || '[]');
      const id = specs[0]?.sourceId;
      const song = DEMO_SONGS.find((s) => s.id === id) ?? DEMO_SONGS[0];
      return { status: 200, data: { url: song.audio, br: 320, source: 'demo', sourceId: song.id } };
    }
    if (seg[1] === 'lyric') {
      const q = new URLSearchParams(path.split('?')[1] || '');
      const ok = q.get('songId') === 'd1';
      return { status: 200, data: ok ? { lrc: DEMO_LYRIC.lrc, tlrc: DEMO_LYRIC.tlrc } : { lrc: '' } };
    }
    if (seg[1] === 'daily') {
      const q = new URLSearchParams(path.split('?')[1] || '');
      const n = Number(q.get('count')) || 24;
      const by = new Date().getDate() % DEMO_SONGS.length;
      return { status: 200, data: { songs: rotate(DEMO_SONGS, by).slice(0, n).map(demoSongToSong), date: new Date().toISOString().slice(0, 10) } };
    }
    if (seg[1] === 'radio') {
      const mood = seg[2] || 'focus';
      const tags = DEMO_STATION_TAGS[mood] ?? ['专注'];
      return { status: 200, data: { label: mood, songs: pickSongs((t) => t.some((x) => tags.includes(x)), 20) } };
    }
    if (seg[1] === 'editor' && !seg[2]) {
      return { status: 200, data: DEMO_EDITOR.map((e) => ({ ...e, songCount: 16 })) };
    }
    if (seg[1] === 'editor' && seg[2]) {
      const e = DEMO_EDITOR.find((x) => x.id === seg[2]);
      if (!e) return { status: 404, data: { message: '未知编辑歌单' } };
      return { status: 200, data: { id: e.id, name: e.name, desc: e.desc, tint: e.tint, songs: pickSongs((t) => t.some((x) => e.tags.includes(x)), 16) } };
    }
    if (seg[1] === 'new') {
      return { status: 200, data: { songs: rotate(DEMO_SONGS, 5).slice(0, 12).map(demoSongToSong) } };
    }
    if (seg[1] === 'sources') {
      return {
        status: 200,
        data: [
          { key: 'demo', label: '演示', available: true, score: 100, supportsPlaylist: false },
          { key: 'netease', label: '网易云', available: false, score: 0, supportsPlaylist: true },
        ],
      };
    }
    if (seg[1] === 'import' && seg[2] === 'resolve') {
      return { status: 501, data: { message: '演示模式不支持歌单导入，请部署后端服务' } };
    }
  }

  /* ---------- library（localStorage 持久化） ---------- */
  if (seg[0] === 'library') {
    if (seg[1] === 'overview') {
      return {
        status: 200,
        data: {
          playlists: lib.playlists.map((p) => ({ ...p, _count: { tracks: p.tracks.length } })),
          stats: { playlists: lib.playlists.length, liked: lib.liked.length, history: lib.history.length },
        },
      };
    }
    if (seg[1] === 'playlists' && !seg[2] && method === 'GET') {
      return { status: 200, data: lib.playlists.map((p) => ({ ...p, _count: { tracks: p.tracks.length } })) };
    }
    if (seg[1] === 'playlists' && !seg[2] && method === 'POST') {
      const pl = { id: Date.now(), name: body?.name || '未命名歌单', desc: body?.desc, createdAt: new Date().toISOString(), tracks: [] };
      lib.playlists.unshift(pl);
      saveMockLibrary(lib);
      return { status: 200, data: { ...pl, _count: { tracks: 0 } } };
    }
    if (seg[1] === 'playlists' && seg[2] && !seg[3]) {
      const pl = lib.playlists.find((x) => x.id === Number(seg[2]));
      return pl
        ? { status: 200, data: { ...pl, tracks: pl.tracks.map((t, i) => ({ ...t, id: i + 1, album: '', quality: '[]', position: i + 1, songKey: `${t.source}:${t.sourceId}`, playlistId: pl.id })) } }
        : { status: 404, data: { message: '歌单不存在' } };
    }
    if (seg[1] === 'playlists' && seg[3] === 'tracks' && method === 'POST') {
      const pl = lib.playlists.find((x) => x.id === Number(seg[2]));
      if (!pl) return { status: 404, data: { message: '歌单不存在' } };
      const songs = body?.songs ?? [];
      let added = 0;
      for (const s of songs) {
        if (pl.tracks.some((t) => t.source === s.source && t.sourceId === s.sourceId)) continue;
        pl.tracks.push({ id: Date.now() + added, title: s.title, artist: s.artist, source: s.source, sourceId: s.sourceId, cover: s.cover, duration: s.duration ?? 0 });
        added++;
      }
      saveMockLibrary(lib);
      return { status: 200, data: { added } };
    }
    if (seg[1] === 'liked' && method === 'GET') return { status: 200, data: lib.liked };
    if (seg[1] === 'liked' && method === 'POST') {
      const s = body;
      if (!lib.liked.some((l) => l.key === `${s.source}:${s.sourceId}`)) {
        lib.liked.unshift({ key: `${s.source}:${s.sourceId}`, title: s.title, artist: s.artist, album: s.album, duration: s.duration ?? 0, cover: s.cover, source: s.source, sourceId: s.sourceId, quality: s.quality, addedAt: new Date().toISOString() });
        saveMockLibrary(lib);
      }
      return { status: 200, data: { ok: true } };
    }
    if (seg[1] === 'liked' && method === 'DELETE') {
      const key = decodeURIComponent(seg[2] || '');
      lib.liked = lib.liked.filter((l) => l.key !== key);
      saveMockLibrary(lib);
      return { status: 200, data: { ok: true } };
    }
    if (seg[1] === 'history' && method === 'GET') return { status: 200, data: lib.history };
    if (seg[1] === 'history' && method === 'POST') {
      const s = body;
      lib.history = [{ key: `${s.source}:${s.sourceId}`, title: s.title, artist: s.artist, album: s.album, duration: s.duration ?? 0, cover: s.cover, source: s.source, sourceId: s.sourceId, quality: s.quality, addedAt: new Date().toISOString() }, ...lib.history.filter((h) => h.key !== `${s.source}:${s.sourceId}`)].slice(0, 120);
      saveMockLibrary(lib);
      return { status: 200, data: { ok: true } };
    }
    if (seg[1] === 'history' && method === 'DELETE') {
      lib.history = [];
      saveMockLibrary(lib);
      return { status: 200, data: { ok: true } };
    }
    if (seg[1] === 'settings' && method === 'GET') return { status: 200, data: { value: lib.settings } };
    if (seg[1] === 'settings' && method === 'PUT') {
      lib.settings = body?.value ?? {};
      saveMockLibrary(lib);
      return { status: 200, data: { ok: true } };
    }
  }
  return null;
}
