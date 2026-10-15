const { app, BrowserWindow, ipcMain, globalShortcut, screen } = require('electron');
const path = require('node:path');

const BASE_URL = process.env.LJ_URL || 'http://localhost:5173';
let mainWin = null;
let lyricWin = null;

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 400,
    minHeight: 640,
    backgroundColor: '#FAFAF7',
    autoHideMenuBar: true,
    title: '聆境 Lingjing',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWin.loadURL(BASE_URL);
  mainWin.on('closed', () => (mainWin = null));
}

function createLyricWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const width = Math.min(760, Math.floor(workArea.width * 0.62));
  lyricWin = new BrowserWindow({
    width,
    height: 96,
    x: Math.floor(workArea.x + (workArea.width - width) / 2),
    y: Math.floor(workArea.y + workArea.height - 130),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  lyricWin.setAlwaysOnTop(true, 'screen-saver');
  lyricWin.setIgnoreMouseEvents(true, { forward: true }); // 完全点击穿透，不挡任何操作
  lyricWin.loadURL(`${BASE_URL}/desktop-lyrics`);
  lyricWin.on('closed', () => (lyricWin = null));
}

function toggleLyric() {
  if (lyricWin) {
    lyricWin.close();
    lyricWin = null;
    if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send('lyric:state', false);
  } else {
    createLyricWindow();
    if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send('lyric:state', true);
  }
}

/* IPC */
ipcMain.on('lyric:update', (_e, data) => {
  if (lyricWin && !lyricWin.isDestroyed()) lyricWin.webContents.send('lyric:show', data);
});
ipcMain.on('lyric:toggle', () => toggleLyric());

app.setPath('userData', path.join(app.getPath('appData'), 'lingjing'));

app.whenReady().then(() => {
  createMainWindow();
  globalShortcut.register('CommandOrControl+Shift+L', toggleLyric);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('will-quit', () => globalShortcut.unregisterAll());
