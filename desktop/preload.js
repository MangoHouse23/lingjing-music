const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  /** 主窗口 → 主进程 → 桌面歌词窗口 */
  sendLyric: (data) => ipcRenderer.send('lyric:update', data),
  /** 桌面歌词窗口接收歌词 */
  onLyric: (cb) => {
    ipcRenderer.on('lyric:show', (_e, data) => cb(data));
  },
  /** 开关桌面歌词窗口 */
  toggleDesktopLyric: () => ipcRenderer.send('lyric:toggle'),
  onDesktopLyricState: (cb) => ipcRenderer.on('lyric:state', (_e, visible) => cb(visible)),
});
