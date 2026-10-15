/** 均衡器预设（三段：低频 shelf 200Hz / 中频 peak 1kHz / 高频 shelf 4kHz，单位 dB） */
export interface EqPreset {
  key: string;
  label: string;
  gains: [number, number, number];
}

export const EQ_PRESETS: EqPreset[] = [
  { key: 'flat', label: '平直', gains: [0, 0, 0] },
  { key: 'bass', label: '低音增强', gains: [6, 0, -1] },
  { key: 'vocal', label: '人声', gains: [-2, 4, 1] },
  { key: 'pop', label: '流行', gains: [1, 0, 2] },
  { key: 'rock', label: '摇滚', gains: [4, 1, 3] },
  { key: 'jazz', label: '爵士', gains: [3, 2, 2] },
  { key: 'classical', label: '古典', gains: [3, 0, 3] },
];

export const EQ_FREQS = { low: 200, mid: 1000, high: 4000 } as const;
