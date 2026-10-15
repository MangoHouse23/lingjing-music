import { defineStore } from 'pinia';
import { musicApi } from '@/api/music';
import { proxyImage } from '@/api/client';
import { demoMode } from '@/api/mode';
import { extractColors } from '@/utils/color';
import { EQ_FREQS, EQ_PRESETS } from '@/utils/eq';
import { songKey, type LyricLine, type Song } from '@/types';
import { useLibraryStore } from './library';
import { useSettingsStore } from './settings';
import { toast } from './toast';

export type PlayMode = 'order' | 'repeat' | 'random';

interface EqNodes {
  low: BiquadFilterNode;
  mid: BiquadFilterNode;
  high: BiquadFilterNode;
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    queue: [] as Song[],
    index: -1,
    playing: false,
    loading: false,
    curTime: 0,
    duration: 0,
    volume: Number(localStorage.getItem('lj.volume') ?? 0.9),
    mode: (localStorage.getItem('lj.mode') ?? 'order') as PlayMode,
    showPlayer: false,
    /** 当前播放使用的来源（换源后更新） */
    activeSource: null as null | { source: string; sourceId: string; label: string },
    /** 来源尝试游标（失败自动切换） */
    specIdx: 0,
    lyrics: [] as LyricLine[],
    lyricsLoading: false,
    curLyricLine: null as null | { cn: string; en?: string },
    palette: null as null | { main: string; glow: string; accent: string },
    sleepTimer: 0, // 剩余分钟；0 = 未开启
    _audio: null as null | HTMLAudioElement,
    _ctx: null as null | AudioContext,
    _analyser: null as null | AnalyserNode,
    _eq: null as null | EqNodes,
    _sleepHandle: null as any,
    _lastHistoryKey: '',
    _failStreak: 0,
  }),

  getters: {
    current: (st): Song | null => st.queue[st.index] ?? null,
    hasQueue: (st) => st.queue.length > 0,
    progress: (st) => (st.duration ? st.curTime / st.duration : 0),
  },

  actions: {
    /* ---------------- 音频引擎 ---------------- */
    audio(): HTMLAudioElement {
      if (!this._audio) {
        const a = new Audio();
        a.preload = 'auto';
        a.volume = this.volume;
        a.addEventListener('timeupdate', () => {
          this.curTime = a.currentTime;
          this.syncLyricLine();
        });
        a.addEventListener('durationchange', () => {
          this.duration = isFinite(a.duration) ? a.duration : 0;
        });
        a.addEventListener('play', () => (this.playing = true));
        a.addEventListener('pause', () => (this.playing = false));
        a.addEventListener('ended', () => this.onEnded());
        a.addEventListener('error', () => this.onError());
        this._audio = a;
      }
      return this._audio;
    },

    /** Web Audio 链：source → EQ(低/中/高) → analyser → destination（音频走服务端代理以获得 CORS） */
    analyser(): AnalyserNode | null {
      if (this._analyser) return this._analyser;
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        this._ctx = new Ctx();
        const ctx = this._ctx;
        const src = ctx.createMediaElementSource(this.audio());
        const mk = (type: BiquadFilterType, freq: number, q = 1) => {
          const f = ctx.createBiquadFilter();
          f.type = type;
          f.frequency.value = freq;
          f.Q.value = q;
          return f;
        };
        const low = mk('lowshelf', EQ_FREQS.low);
        const mid = mk('peaking', EQ_FREQS.mid, 1.2);
        const high = mk('highshelf', EQ_FREQS.high);
        const an = ctx.createAnalyser();
        an.fftSize = 128;
        src.connect(low).connect(mid).connect(high).connect(an);
        an.connect(ctx.destination);
        this._eq = { low, mid, high };
        this._analyser = an;
        this.applyEq();
      } catch {
        this._analyser = null;
      }
      return this._analyser;
    },

    /** 应用均衡器预设 */
    applyEq() {
      if (!this._eq) return;
      const settings = useSettingsStore();
      const preset =
        EQ_PRESETS.find((p) => p.key === settings.s.eqPreset)?.gains ?? [0, 0, 0];
      const g = settings.s.eqEnabled ? preset : [0, 0, 0];
      this._eq.low.gain.value = g[0];
      this._eq.mid.gain.value = g[1];
      this._eq.high.gain.value = g[2];
    },

    setEq(enabled?: boolean, presetKey?: string) {
      const settings = useSettingsStore();
      if (enabled !== undefined) settings.set('eqEnabled', enabled);
      if (presetKey !== undefined) settings.set('eqPreset', presetKey);
      this.applyEq();
    },

    /* ---------------- 播放控制 ---------------- */
    async play(songs: Song[], index = 0) {
      if (!songs.length) return;
      this.queue = songs;
      this.index = Math.max(0, Math.min(index, songs.length - 1));
      await this.loadCurrent(true);
      this.showPlayer = false;
    },

    async playSong(song: Song, queue?: Song[]) {
      const q = queue ?? [song];
      const idx = q.findIndex((s) => s.key === song.key);
      await this.play(q, idx >= 0 ? idx : 0);
    },

    async toggle() {
      const a = this.audio();
      if (!this.current) return;
      this._ctx?.resume?.().catch?.(() => {});
      if (a.paused) {
        this.analyser(); // 首次播放时建立 Web Audio 链
        if (!a.src) await this.loadCurrent(true);
        else await a.play().catch(() => {});
      } else {
        a.pause();
      }
    },

    async next(auto = false) {
      if (!this.queue.length) return;
      if (this.mode === 'repeat' && auto) {
        this.audio().currentTime = 0;
        await this.audio().play().catch(() => {});
        return;
      }
      let n: number;
      if (this.mode === 'random') {
        n = this.queue.length > 1 ? (this.index + 1 + Math.floor(Math.random() * (this.queue.length - 1))) % this.queue.length : 0;
      } else {
        n = this.index + 1;
        if (n >= this.queue.length) n = 0;
      }
      this.index = n;
      await this.loadCurrent(true);
    },

    async prev() {
      if (!this.queue.length) return;
      if (this.curTime > 4) {
        this.audio().currentTime = 0;
        return;
      }
      this.index = (this.index - 1 + this.queue.length) % this.queue.length;
      await this.loadCurrent(true);
    },

    playFromQueue(i: number) {
      if (i < 0 || i >= this.queue.length) return;
      this.index = i;
      this.loadCurrent(true);
    },

    seek(ratio: number) {
      const a = this.audio();
      if (this.duration) a.currentTime = Math.max(0, Math.min(1, ratio)) * this.duration;
    },

    setVolume(v: number) {
      this.volume = Math.max(0, Math.min(1, v));
      this.audio().volume = this.volume;
      localStorage.setItem('lj.volume', String(this.volume));
    },

    setMode(m: PlayMode) {
      this.mode = m;
      localStorage.setItem('lj.mode', m);
    },

    /* ---------------- 加载当前曲 ---------------- */
    async loadCurrent(autoplay: boolean) {
      const song = this.current;
      if (!song) return;
      const settings = useSettingsStore();
      const a = this.audio();
      this.loading = true;
      this.curTime = 0;
      this.duration = song.duration || 0;
      this.specIdx = 0;
      this._lastHistoryKey = songKey(song);
      this.updateMediaSession(song);
      document.title = `${song.title} · ${song.artist} - 聆境`;

      // 歌词与取色并行
      this.loadLyrics(song);
      this.loadPalette(song.cover);
      this.recordHistory(song);

      // 依次尝试来源；服务端内部还有跨源兜底
      const rotate = () => this.songSources(song);
      for (let attempt = 0; attempt < rotate().length; attempt++) {
        const specs = rotate().slice(this.specIdx);
        if (!specs.length) break;
        try {
          const r = await musicApi.resolveUrl(specs, settings.s.br, { title: song.title, artist: song.artist });
          this.activeSource = {
            source: r.source,
            sourceId: r.sourceId,
            label: song.sources.find((s) => s.source === r.source)?.label ?? r.source,
          };
          // 音频经服务端代理获得 CORS（供 Web Audio 频谱）；演示模式/代理失败时回退直链
          const directUrl = r.url;
          a.src = demoMode.value ? directUrl : `/api/music/proxy/audio?url=${encodeURIComponent(directUrl)}`;
          (a as any)._directUrl = directUrl;
          if (autoplay) await a.play().catch(() => {});
          this.loading = false;
          this._failStreak = 0;
          this.prefetchNext();
          return;
        } catch (e: any) {
          this.specIdx++;
          console.warn('[player] 来源失败:', e?.message);
        }
      }
      this.loading = false;
      // 总失败：自动跳下一首（连续失败超过队列长度才停）
      if (this.queue.length > 1 && this._failStreak < this.queue.length) {
        this._failStreak += 1;
        toast('本首暂时无法播放，已自动切到下一首');
        this.next();
      } else {
        this._failStreak = 0;
        toast('所有音源均未取到播放链接，请稍后重试');
      }
    },

    /** 预取下一首的播放直链（写入服务端缓存，切歌零等待） */
    prefetchNext() {
      const nxt = this.queue[(this.index + 1) % this.queue.length];
      if (!nxt) return;
      setTimeout(() => {
        musicApi
          .resolveUrl(this.songSources(nxt), useSettingsStore().s.br, { title: nxt.title, artist: nxt.artist })
          .catch(() => {});
      }, 3000);
    },

    songSources(song: Song) {
      const enabled = new Set(useSettingsStore().s.sources);
      return song.sources.filter((s) => enabled.has(s.source) || s.source === 'demo');
    },

    /** 当前歌词行计算 + 桌面歌词推送 */
    syncLyricLine() {
      const ls = this.lyrics;
      if (!ls.length) return;
      let idx = -1;
      for (let i = 0; i < ls.length; i++) if (this.curTime >= ls[i].t) idx = i;
      const line = idx >= 0 ? { cn: ls[idx].cn, en: ls[idx].en } : null;
      const changed =
        (line?.cn ?? null) !== (this.curLyricLine?.cn ?? null) ||
        (line?.en ?? null) !== (this.curLyricLine?.en ?? null);
      if (!changed) return;
      this.curLyricLine = line;
      const api = (window as any).electronAPI;
      if (api?.sendLyric) api.sendLyric(line);
    },

    onError() {
      const a = this.audio();
      // 代理播放失败 → 回退直链再试一次
      const direct = (a as any)._directUrl;
      if (a.src.startsWith('/api/music/proxy/audio') && direct) {
        (a as any)._proxyFailed = true;
        a.src = direct;
        a.play().catch(() => {});
        return;
      }
      if (this.loading) return;
      this.specIdx++;
      const song = this.current;
      if (song && this.specIdx < song.sources.length) {
        toast(`当前来源失效，自动切换下一个音源…`);
        this.loadCurrent(true);
      } else {
        toast('播放失败，已停止');
        this.playing = false;
      }
    },

    onEnded() {
      this.next(true);
    },

    async loadLyrics(song: Song) {
      const primary = song.sources[this.specIdx] ?? song.sources[0];
      if (!primary) {
        this.lyrics = [];
        return;
      }
      this.lyricsLoading = true;
      try {
        this.lyrics = await musicApi.lyric(primary.source, primary.sourceId);
      } catch {
        this.lyrics = [];
      } finally {
        this.lyricsLoading = false;
      }
    },

    async loadPalette(cover?: string) {
      if (!cover) {
        this.palette = null;
        return;
      }
      this.palette = await extractColors(proxyImage(cover)!);
    },

    recordHistory(song: Song) {
      const lib = useLibraryStore();
      const primary = song.sources[0];
      lib.addHistory({
        source: primary.source,
        sourceId: primary.sourceId,
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        cover: song.cover,
        quality: JSON.stringify(song.qualities),
      });
    },

    updateMediaSession(song: Song) {
      if (!('mediaSession' in navigator)) return;
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title,
          artist: song.artist,
          album: song.album || '聆境',
          artwork: song.cover ? [{ src: proxyImage(song.cover)! }] : [],
        });
        navigator.mediaSession.setActionHandler('play', () => this.toggle());
        navigator.mediaSession.setActionHandler('pause', () => this.toggle());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      } catch { /* ignore */ }
    },

    /* ---------------- 睡眠定时器 ---------------- */
    setSleepTimer(minutes: number) {
      clearTimeout(this._sleepHandle);
      this.sleepTimer = minutes;
      if (!minutes) {
        toast('睡眠定时器已关闭');
        return;
      }
      toast(`${minutes} 分钟后将停止播放`);
      this._sleepHandle = setTimeout(() => {
        this.audio().pause();
        this.sleepTimer = 0;
        toast('睡眠时间到，已暂停播放');
      }, minutes * 60_000);
    },

    /* ---------------- 键盘快捷键 ---------------- */
    bindShortcuts() {
      window.addEventListener('keydown', (e) => {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
        if (e.code === 'Space') {
          e.preventDefault();
          this.toggle();
        } else if (e.key === 'ArrowRight' && e.shiftKey) {
          this.next();
        } else if (e.key === 'ArrowLeft' && e.shiftKey) {
          this.prev();
        } else if (e.key === 'ArrowUp' && e.shiftKey) {
          e.preventDefault();
          this.setVolume(this.volume + 0.1);
        } else if (e.key === 'ArrowDown' && e.shiftKey) {
          e.preventDefault();
          this.setVolume(this.volume - 0.1);
        } else if (e.key.toLowerCase() === 'l' && this.current) {
          useLibraryStore().toggleLike(this.current);
        } else if (e.key === 'Escape' && this.showPlayer) {
          this.showPlayer = false;
        }
      });
    },
  },
});
