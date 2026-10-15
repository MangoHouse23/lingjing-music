/* ============================================================
   聆境 Lingjing · App Shell & Shared Components
   1) Lucide 图标内联注册（离线可用）
   2) Shell 统一注入：PC 侧栏 / H5 底栏 / 迷你播放条（根治导航漂移）
   3) 渲染助手：songRow / plCard / stCard / 徽标
   4) 交互助手：toast / heart / tabs
   ============================================================ */

(function () {
  /* ---------------- Lucide icons (inline, stroke-width 由 CSS 调为 1.75) ---------------- */
  const P = (inner) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  const ICONS = {
    'play': P('<polygon points="6 3 20 12 6 21 6 3"/>'),
    'pause': P('<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>'),
    'skip-back': P('<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>'),
    'skip-forward': P('<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>'),
    'heart': P('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'),
    'search': P('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
    'compass': P('<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>'),
    'library': P('<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>'),
    'zap': P('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
    'radio': P('<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19.1"/>'),
    'shuffle': P('<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>'),
    'repeat': P('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
    'download': P('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
    'download-cloud': P('<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/>'),
    'plus': P('<path d="M5 12h14"/><path d="M12 5v14"/>'),
    'more-horizontal': P('<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>'),
    'volume-2': P('<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>'),
    'chevron-down': P('<path d="m6 9 6 6 6-6"/>'),
    'chevron-left': P('<path d="m15 18-6-6 6-6"/>'),
    'chevron-right': P('<path d="m9 18 6-6-6-6"/>'),
    'x': P('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
    'check': P('<path d="M20 6 9 17l-5-5"/>'),
    'clock-3': P('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
    'mic': P('<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>'),
    'sliders-horizontal': P('<line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/><line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/><line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/><line x1="14" y1="2" x2="14" y2="6"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="16" y1="18" x2="16" y2="22"/>'),
    'settings': P('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'),
    'arrow-down-to-line': P('<path d="M12 17V3"/><path d="m6 11 6 6 6-6"/><path d="M19 21H5"/>'),
    'list-music': P('<path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/>'),
    'moon': P('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
    'coffee': P('<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>'),
    'cloud-rain': P('<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>'),
    'train-front': P('<path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"/><path d="m9 15-1-1"/><path d="m15 16 1 1"/><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/>'),
    'leaf': P('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'),
    'flame': P('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'),
    'sun': P('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'),
    'cloud-snow': P('<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M8 15h.01"/><path d="M8 19h.01"/><path d="M12 17h.01"/><path d="M12 21h.01"/><path d="M16 15h.01"/><path d="M16 19h.01"/>'),
    'waves': P('<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>'),
    'disc-3': P('<circle cx="12" cy="12" r="10"/><path d="M6 12c0-1.7.7-3.2 1.8-4.2"/><circle cx="12" cy="12" r="2"/><path d="M18 12c0 1.7-.7 3.2-1.8 4.2"/>'),
    'sparkles': P('<path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"/>'),
    'history': P('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>'),
    'trending-up': P('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>'),
    'filter': P('<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'),
    'arrow-up-right': P('<path d="M7 7h10v10"/><path d="M7 17 17 7"/>'),
    'alert-circle': P('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'),
    'folder': P('<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>'),
    'timer': P('<line x1="10" y1="2" x2="14" y2="2"/><line x1="12" y1="14" x2="15" y2="11"/><circle cx="12" cy="14" r="8"/>'),
    'audio-lines': P('<path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/>'),
  };

  const App = window.App = {};

  /* ---------------- 图标挂载（幂等） ---------------- */
  App.icon = (n) => ICONS[n] || '';
  function mountIcons(root) {
    (root || document).querySelectorAll('i[data-icon]').forEach((el) => {
      if (el.dataset.mounted) return;
      el.dataset.mounted = '1';
      el.innerHTML = App.icon(el.dataset.icon);
    });
  }
  App.mountIcons = mountIcons;

  /* ---------------- 状态（localStorage 持久化） ---------------- */
  const store = {
    liked: new Set(JSON.parse(localStorage.getItem('lj.liked') || '[]').concat(DB.liked)),
    playing: localStorage.getItem('lj.playing') !== '0',
  };
  const persist = () => {
    localStorage.setItem('lj.liked', JSON.stringify([...store.liked]));
    localStorage.setItem('lj.playing', store.playing ? '1' : '0');
  };
  App.isLiked = (id) => store.liked.has(id);
  App.toggleLike = (id) => {
    const add = !store.liked.has(id);
    add ? store.liked.add(id) : store.liked.delete(id);
    persist();
    document.querySelectorAll(`[data-heart="${id}"]`).forEach((el) => el.classList.toggle('on', add));
    return add;
  };
  App.setPlaying = (v) => {
    store.playing = v;
    persist();
    document.querySelectorAll('.mini-player').forEach((el) => el.classList.toggle('playing', v));
    document.querySelectorAll('[data-playtoggle] i').forEach((el) => (el.innerHTML = App.icon(v ? 'pause' : 'play')));
  };

  /* ---------------- 渲染助手 ---------------- */
  App.songById = (id) => DB.songs.find((s) => s.id === id);
  App.cover = (key) => DB.covers[key] || DB.covers.c1;

  App.qBadge = (q) =>
    (q || [])
      .map(
        (x) =>
          `<span class="q-badge ${x === '无损' ? 'lossless' : x === 'Hi-Res' ? 'hires' : 'sq'}">${x}</span>`
      )
      .join('');

  const SRC_NAME = { netease: '网易云', kugou: '酷狗', kuwo: '酷我', bili: 'B站', gd: 'GD音乐台' };
  App.srcBadge = (s) => {
    const ok = Object.entries(s.src || {}).filter(([, v]) => v).map(([k]) => SRC_NAME[k]);
    return (
      ok.slice(0, 3).map((n) => `<span class="src-badge ok">${n}</span>`).join('') +
      (ok.length < 2 ? '<span class="src-badge dim">源待测</span>' : '')
    );
  };

  App.heartBtn = (s, cls) =>
    `<button class="btn-icon op-heart ${cls || ''} ${store.liked.has(s.id) ? 'on' : ''}" data-heart="${s.id}" aria-label="喜欢">
       <i data-icon="heart"></i>
     </button>`;

  /* 曲目行：序号/封面/标题+徽标/歌手/专辑/时长/操作（H5 自动精简为 3 列） */
  App.songRow = (s, i, opts = {}) => `
    <div class="song-row" style="animation-delay:${(opts.delay ?? i) * 35}ms" data-jump="1">
      <div class="song-idx">${opts.plainIdx ? '' : String(i + 1).padStart(2, '0')}</div>
      <div class="song-cover">
        <img src="${App.cover(s.cover)}" alt="${s.album}">
        <span class="cov-play"><i data-icon="play"></i></span>
      </div>
      <div class="song-main">
        <div class="song-title"><span class="t">${s.title}</span>${App.qBadge(s.quality)}</div>
        <div class="song-artist"><a href="search.html">${s.artist}</a></div>
      </div>
      <div class="song-album">${s.album}</div>
      <div class="song-album">${App.srcBadge(s)}</div>
      <div class="song-dur">${s.dur}</div>
      <div class="song-ops">
        ${App.heartBtn(s)}
        <button class="btn-icon" aria-label="更多"><i data-icon="more-horizontal"></i></button>
      </div>
      <div class="song-like-h5">${App.heartBtn(s)}</div>
    </div>`;

  App.plCard = (p) => `
    <a class="pl-card" href="playlist.html?id=${p.id}">
      <div class="pl-cover">
        <img src="${App.cover(p.cover)}" alt="${p.name}" loading="lazy">
        <span class="pl-play"><i data-icon="play"></i></span>
      </div>
      <div class="pl-name">${p.name}</div>
      <div class="pl-meta">${p.curator} · ${p.count} 首</div>
    </a>`;

  App.stCard = (st) => `
    <div class="st-card" style="background:${st.tint}" data-jump="1">
      <span class="st-ic"><i data-icon="${st.icon}"></i></span>
      <span class="st-go"><i data-icon="arrow-up-right"></i></span>
      <div class="st-name">${st.name}</div>
      <div class="st-desc">${st.desc}</div>
    </div>`;

  /* ---------------- 交互助手 ---------------- */
  App.toast = (msg) => {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 1800);
  };

  App.tabs = (el, cb) => {
    if (!el) return;
    const btns = [...el.querySelectorAll('button')];
    btns.forEach((b, i) =>
      b.addEventListener('click', () => {
        btns.forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        cb && cb(i, b);
      })
    );
  };

  /* ---------------- Shell 注入 ---------------- */
  function buildShell() {
    const page = document.body.dataset.page;
    const app = document.querySelector('.app');
    if (!app || page === 'player') {
      mountIcons();
      return;
    }

    /* PC 侧栏 */
    const aside = document.createElement('aside');
    aside.className = 'app-nav';
    aside.innerHTML = `
      <a class="brand" href="index.html">
        <span class="brand-mark">聆</span>
        <span class="brand-name">聆境<em>LINGJING</em></span>
      </a>
      <nav>
        <a class="nav-item" data-nav="discover" href="index.html"><i data-icon="compass"></i>发现</a>
        <a class="nav-item" data-nav="search" href="search.html"><i data-icon="search"></i>搜索</a>
        <a class="nav-item" data-nav="library" href="library.html"><i data-icon="library"></i>音乐库</a>
      </nav>
      <div class="nav-label">我的歌单<button aria-label="新建歌单"><i data-icon="plus"></i></button></div>
      <nav class="nav-pl">
        ${DB.playlists
          .map(
            (p) => `
          <a class="nav-item" data-nav="pl:${p.id}" href="playlist.html?id=${p.id}">
            <span class="nav-pl-dot" style="background:${p.tint}"></span><span>${p.name}</span>
          </a>`
          )
          .join('')}
      </nav>
      <div class="nav-foot">
        <a class="nav-item" data-nav="import" href="library.html?import=1"><i data-icon="download-cloud"></i>导入歌单</a>
        <a class="nav-item" data-nav="settings" href="#"><i data-icon="settings"></i>设置</a>
      </div>`;

    /* H5 底栏 */
    const tabbar = document.createElement('nav');
    tabbar.className = 'app-tabbar';
    tabbar.innerHTML = `
      <a data-nav="discover" href="index.html"><i data-icon="compass"></i>发现</a>
      <a data-nav="flow" href="player.html"><i data-icon="zap"></i>心流</a>
      <a data-nav="search" href="search.html"><i data-icon="search"></i>搜索</a>
      <a data-nav="library" href="library.html"><i data-icon="library"></i>音乐库</a>`;

    /* 迷你播放条 */
    const cur = App.songById(DB.now.songId);
    const mini = document.createElement('div');
    mini.className = 'mini-player' + (store.playing ? ' playing' : '');
    mini.innerHTML = `
      <div class="mini-cover">
        <img src="${App.cover(cur.cover)}" alt="${cur.album}">
        <span class="mini-eq"><b></b><b></b><b></b><b></b></span>
      </div>
      <div class="mini-info">
        <div class="mini-title">${cur.title}</div>
        <div class="mini-artist">${cur.artist} · ${DB.now.quality}</div>
        <div class="mini-progress"><i></i></div>
      </div>
      <div class="mini-ctrl">
        ${App.heartBtn(cur, 'mini-like')}
        <button aria-label="播放/暂停" data-playtoggle><i data-icon="${store.playing ? 'pause' : 'play'}"></i></button>
        <button aria-label="下一首" data-next><i data-icon="skip-forward"></i></button>
      </div>`;

    app.prepend(aside);
    document.body.appendChild(tabbar);
    document.body.appendChild(mini);

    /* active 标记（唯一规则：body[data-page] ↔ a[data-nav]） */
    const page_ = page;
    const pl = document.body.dataset.playlist;
    mini.addEventListener('click', (e) => {
      const heart = e.target.closest('[data-heart]');
      if (heart) {
        e.stopPropagation(); /* 防止 document 层重复切换 */
        const added = App.toggleLike(heart.dataset.heart);
        App.toast(added ? '已加入「我喜欢的音乐」' : '已从「我喜欢的音乐」移除');
        return;
      }
      location.href = 'player.html';
    });
    mini.querySelectorAll('button').forEach((b) => {
      if (b.dataset.heart) return; /* 红心交给 mini 处理器 */
      b.addEventListener('click', (e) => e.stopPropagation());
    });
    mini.querySelector('[data-playtoggle]').addEventListener('click', () => App.setPlaying(!store.playing));
    mini.querySelector('[data-next]').addEventListener('click', () => App.toast('已切到下一首（演示）'));

    /* 全局委托 */
    document.addEventListener('click', (e) => {
      const heart = e.target.closest('[data-heart]');
      if (heart) {
        const added = App.toggleLike(heart.dataset.heart);
        App.toast(added ? '已加入「我喜欢的音乐」' : '已从「我喜欢的音乐」移除');
        return;
      }
      const jump = e.target.closest('[data-jump]');
      if (jump && !e.target.closest('button, a')) {
        e.preventDefault();
        location.href = 'player.html';
      }
    });

    document.querySelectorAll('.app-nav [data-nav], .app-tabbar [data-nav]').forEach((a) => {
      const key = a.dataset.nav;
      const active = key === page_ || (pl && key === 'pl:' + pl);
      if (active) a.classList.add('active');
    });

    mountIcons(aside);
    mountIcons(tabbar);
    mountIcons(mini);
    mountIcons(document.querySelector('.app-content'));
  }

  buildShell();
})();
