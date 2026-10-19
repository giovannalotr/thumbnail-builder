import { mk } from './util.js';

const FILTER_OK = (() => { try { const c = mk(9, 9), x = c.getContext('2d', { willReadFrequently: true }); x.filter = 'blur(2px)'; x.fillRect(4, 4, 1, 1); return x.getImageData(2, 4, 1, 1).data[3] > 0; } catch (e){ return false; } })();
export function blurCanvas(src, r){
  const W = src.width, H = src.height, out = mk(W, H), x = out.getContext('2d');
  x.drawImage(src, 0, 0);
  if (r <= 0) return out;
  if (FILTER_OK){ x.filter = `blur(${r}px)`; x.drawImage(src, 0, 0); x.filter = 'none'; return out; }
  const f = Math.max(2, r / 1.6), sm = mk(W / f, H / f), sx = sm.getContext('2d');
  sx.imageSmoothingQuality = 'high'; sx.drawImage(src, 0, 0, sm.width, sm.height);
  const sm2 = mk(sm.width, sm.height), s2 = sm2.getContext('2d'); s2.drawImage(sm, 0, 0);
  x.imageSmoothingQuality = 'high'; x.drawImage(sm2, 0, 0, W, H);
  return out;
}
