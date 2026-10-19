import { mk } from './util.js';

export function thumbURL(src, w, h){ const c = mk(192, 108), x = c.getContext('2d'), s = Math.max(192 / w, 108 / h); x.imageSmoothingQuality = 'high'; x.drawImage(src, (192 - w * s) / 2, (108 - h * s) / 2, w * s, h * s); return c.toDataURL('image/jpeg', .82); }
export function makePreview(img, w, h, max = 1600){
  if (Math.max(w, h) <= max) return img;
  const s = max / Math.max(w, h), c = mk(w * s, h * s), x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, c.width, c.height); return c;
}

let uid = 0;
export const isImageFile = f => /^image\//.test(f.type) || /\.(jpe?g|png|webp|avif|gif|bmp)$/i.test(f.name);
export async function decodeImages(files){
  const added = [], failed = [];
  for (const f of files){
    const url = URL.createObjectURL(f), img = new Image(); img.src = url;
    try { await img.decode(); } catch (e){ failed.push(f.name); URL.revokeObjectURL(url); continue; }
    const w = img.naturalWidth, h = img.naturalHeight;
    added.push({ id: 'u' + (++uid), name: f.name, w, h, src: img, prev: makePreview(img, w, h), thumb: thumbURL(img, w, h), url });
  }
  return { added, failed };
}
