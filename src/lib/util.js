export const BW = 1280;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function mk(w, h){ const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
export function rrect(x, X, Y, W, H, R){ R = Math.max(0, Math.min(R, W / 2, H / 2)); x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R); x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath(); }
export function hex2rgb(h){ h = (h || '#000').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
export function rgba(h, a){ const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; }
export function shade(h, amt){ const c = hex2rgb(h), t = amt < 0 ? 0 : 255, p = Math.abs(amt); return '#' + c.map(v => Math.round(v + (t - v) * p).toString(16).padStart(2, '0')).join(''); }
export const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* Leitura e escrita imutável por caminho, como "texts.0.shadow.blur" */
export const getIn = (o, path) => path.split('.').reduce((a, k) => a[k], o);
export function setIn(o, path, v){
  const [k, ...rest] = typeof path === 'string' ? path.split('.') : path;
  const val = rest.length ? setIn(o[k], rest, v) : v;
  if (Array.isArray(o)){ const a = o.slice(); a[+k] = val; return a; }
  return { ...o, [k]: val };
}
export const patchIn = (o, path, patch) => setIn(o, path, { ...getIn(o, path), ...patch });
