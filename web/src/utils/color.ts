/** 从封面图提取主色（用于沉浸播放页动态取色） */
export interface ExtractedPalette {
  main: string; // rgb() 主色（已暗化）
  glow: string; // rgb() 辉光色
  accent: string; // rgb() 次强调色
}

export function extractColors(imgUrl: string): Promise<ExtractedPalette> {
  return new Promise((resolve) => {
    const fallback: ExtractedPalette = {
      main: 'rgb(31, 52, 42)',
      glow: 'rgb(91, 138, 114)',
      accent: 'rgb(232, 168, 124)',
    };
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const done = (p: ExtractedPalette) => resolve(p);
    img.onload = () => {
      try {
        const cv = document.createElement('canvas');
        const w = 48;
        const h = 48;
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        // 简易三桶聚类：按亮度分组统计平均色
        const buckets = [
          { r: 0, g: 0, b: 0, n: 0 }, // 暗
          { r: 0, g: 0, b: 0, n: 0 }, // 中
          { r: 0, g: 0, b: 0, n: 0 }, // 亮
        ];
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const idx = lum < 85 ? 0 : lum < 170 ? 1 : 2;
          buckets[idx].r += r;
          buckets[idx].g += g;
          buckets[idx].b += b;
          buckets[idx].n += 1;
        }
        const avg = (bk: { r: number; g: number; b: number; n: number }, fb: [number, number, number]) =>
          bk.n > 6 ? [bk.r / bk.n, bk.g / bk.n, bk.b / bk.n] : fb;
        const [dr, dg, db] = avg(buckets[0], [31, 52, 42]);
        const [gr, gg, gb] = avg(buckets[1], [91, 138, 114]);
        const [ar, ag, ab] = avg(buckets[2], [232, 168, 124]);
        const mix = (c: number[], target: number[], k: number) =>
          c.map((v, i) => Math.round(v * (1 - k) + target[i] * k));
        const dark = (c: number[], k: number) => mix(c, [8, 12, 10], k);
        done({
          main: `rgb(${dark([dr, dg, db], 0.72).join(', ')})`,
          glow: `rgb(${mix([gr, gg, gb], [64, 96, 78], 0.25).join(', ')})`,
          accent: `rgb(${mix([ar, ag, ab], [232, 168, 124], 0.35).join(', ')})`,
        });
      } catch {
        done(fallback);
      }
    };
    img.onerror = () => done(fallback);
    img.src = imgUrl;
  });
}
