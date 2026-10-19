import { BW, clamp } from './util.js';

const R2 = (a, b) => ({ d: 'r', s: [1, 1], k: [a, b] });
const C2 = (a, b) => ({ d: 'c', s: [1, 1], k: [a, b] });
export const DEFS = [
  { id: 'central', name: 'Imagem única', layout: 0, border: {},
    texts: [{ text: 'gentle days', font: 'Pinyon Script', size: 150, y: .52, color: '#F7EFDF', shadow: { blur: 26, op: .5 } }] },
  { id: 'duo-lado', name: 'Duas lado a lado', layout: R2(0, 0), border: { gap: 4, color: '#F3EDE1' },
    texts: [
      { text: 'a cosy autumn vlog in', font: 'Cormorant Garamond', italic: true, weight: 500, size: 40, y: .12 },
      { text: 'the countryside', font: 'Playfair Display', weight: 600, size: 100, y: .235 },
      { text: 'england', font: 'Cormorant Garamond', italic: true, weight: 500, size: 36, x: .64, y: .33 }] },
  { id: 'duo-empilhado', name: 'Duas empilhadas', layout: C2(0, 0), border: { gap: 4, color: '#F3EDE1' },
    texts: [
      { text: 'COSY AUTUMN', font: 'Cinzel', weight: 600, size: 96, ls: .03, y: .46 },
      { text: 'in the countryside', font: 'Italianno', size: 76, y: .6 }] },
  { id: 'trio-colunas', name: 'Três colunas', layout: { d: 'r', s: [1, 1, 1], k: [0, 0, 0] }, border: { gap: 5, color: '#F3EDE1' },
    texts: [{ text: 'September in\nLondon', font: 'Bodoni Moda', size: 96, lh: .9, y: .56, shadow: { blur: 22, op: .5 } }] },
  { id: 'trio-faixas', name: 'Três faixas', layout: { d: 'c', s: [1, 1, 1], k: [0, 0, 0] }, border: { gap: 5, color: '#EDE6D6' },
    texts: [{ text: 'slow mornings', font: 'Cormorant Garamond', italic: true, size: 104, y: .5, shadow: { on: false }, box: { mode: 'band-h', color: '#2A2119', op: .22, blur: 14, py: 14 } }] },
  { id: 'destaque-esq', name: 'Destaque à esquerda', layout: { d: 'r', s: [2, 1], k: [0, C2(0, 0)] }, border: { gap: 6, color: '#EDE6D6' },
    texts: [
      { text: 'A COSY AUTUMN VLOG', font: 'Cormorant Garamond', weight: 500, size: 52, ls: .14, x: .36, y: .45 },
      { text: 'in the Cotswolds', font: 'Pinyon Script', size: 46, x: .36, y: .555 }] },
  { id: 'destaque-dir', name: 'Destaque à direita', layout: { d: 'r', s: [1, 2], k: [C2(0, 0), 0] }, border: { outer: 20, gap: 8, radius: 4, color: '#EDE6D6', tex: 'ramagem', amt: .75 },
    texts: [{ text: 'life in the countryside', font: 'Cormorant Garamond', italic: true, weight: 500, size: 62, x: .655, y: .83, color: '#F3E7C9' }] },
  { id: 'quadrantes', name: 'Quatro quadrantes', layout: C2(R2(0, 0), R2(0, 0)), border: { gap: 5, color: '#F3EDE1' },
    texts: [
      { text: 'COTSWOLDS', font: 'Cinzel', weight: 700, size: 100, ls: .04, y: .47, box: { mode: 'box', color: '#1E1A16', op: .22, blur: 12, px: 34, py: 14, r: 6 } },
      { text: 'cosy autumn day', font: 'Italianno', size: 72, y: .615 }] },
  { id: 'trio-largo', name: 'Centro largo', layout: { d: 'r', s: [1, 2, 1], k: [0, 0, 0] }, border: { outer: 16, gap: 6, radius: 3, color: '#EFE8D8', tex: 'ramagem', amt: .65 },
    texts: [
      { text: 'coffee shops, shopping, nature walks', font: 'Cormorant Garamond', italic: true, weight: 500, size: 21, ls: .02, y: .525 },
      { text: 'a slow sunday', font: 'Playfair Display', italic: true, size: 78, y: .615 },
      { text: 'vlog', font: 'Cormorant Garamond', italic: true, weight: 500, size: 30, x: .63, y: .705 }] },
  { id: 'destaque-tres', name: 'Destaque + três', layout: { d: 'r', s: [3, 2], k: [0, { d: 'c', s: [1, 1, 1], k: [0, 0, 0] }] }, border: { gap: 5, color: '#F3EDE1' },
    texts: [{ text: 'countryside diaries', font: 'Great Vibes', size: 92, x: .3, y: .8 }] },
  { id: 'mosaico', name: 'Mosaico de cinco', layout: { d: 'r', s: [1, 1.5, 1], k: [C2(0, 0), 0, C2(0, 0)] }, border: { gap: 5, color: '#F3EDE1' },
    texts: [
      { text: 'decorating for autumn', font: 'Cormorant Garamond', italic: true, weight: 500, size: 36, y: .1 },
      { text: 'cosy home vlog', font: 'Bodoni Moda', weight: 600, size: 86, y: .2 },
      { text: 'england', font: 'Cormorant Garamond', italic: true, weight: 500, size: 30, x: .6, y: .285 }] },
  { id: 'faixa', name: 'Faixa de título', layout: { d: 'c', s: [1, .5, 1], k: [0, 'x', 0] }, border: { color: '#EFE4CC', tex: 'papel', amt: .75 },
    texts: [
      { text: 'COSY OCTOBER', font: 'Cinzel', weight: 600, size: 56, ls: .1, color: '#3B322A', y: .474, shadow: { on: false } },
      { text: 'in the Cotswolds', font: 'Pinyon Script', size: 36, color: '#6B5544', y: .55, shadow: { on: false } }] },
];
export function makeText(o){
  const d = { text: '', font: 'Cormorant Garamond', weight: 400, italic: false, size: 80, color: '#F6EEDD', ls: 0, lh: 1.05, align: 'center', x: .5, y: .5 };
  return Object.assign(d, o, {
    shadow: Object.assign({ on: true, color: '#1E1610', blur: 18, ox: 0, oy: 2, op: .45 }, o.shadow || {}),
    box: Object.assign({ mode: 'none', color: '#1E1A16', op: .25, blur: 12, px: 28, py: 12, r: 6, line: false }, o.box || {}),
  });
}
const makeBorder = o => Object.assign({ outer: 0, gap: 0, radius: 0, color: '#EDE6D6', tex: 'grao', amt: .55, blend: 0 }, o);
function countSlots(n){ return n === 0 ? 1 : n === 'x' ? 0 : n.k.reduce((a, c) => a + countSlots(c), 0); }
export function makeTpl(def){
  return { def, slots: Array.from({ length: countSlots(def.layout) }, () => ({ img: null, zoom: 1, px: 0, py: 0, flip: false })),
    texts: def.texts.map(o => makeText(JSON.parse(JSON.stringify(o)))), border: makeBorder(def.border), pick: false, edited: false };
}
function lay(n, x, y, w, h, g, out){
  if (n === 0){ out.push({ x, y, w, h }); return; }
  if (n === 'x') return;
  const tot = n.s.reduce((a, b) => a + b, 0), hz = n.d === 'r', avail = (hz ? w : h) - g * (n.k.length - 1);
  let p = hz ? x : y;
  n.k.forEach((ch, i) => { const len = avail * n.s[i] / tot; hz ? lay(ch, p, y, len, h, g, out) : lay(ch, x, p, w, len, g, out); p += len + g; });
}
export const blendOn = t => t.border.blend > 0 && t.slots.length > 1;
export function slotRects(t, W, H){ const s = W / BW, bl = blendOn(t), o = bl ? 0 : t.border.outer * s, out = []; lay(t.def.layout, o, o, W - 2 * o, H - 2 * o, bl ? 0 : t.border.gap * s, out); return out; }
/* Geometria de desenho: com transição suave, cada foto avança metade da suavidade sobre as vizinhas */
export function slotGeo(t, W, H){
  const rs = slotRects(t, W, H);
  if (!blendOn(t)) return rs.map(r => ({ r, e: r, m: null }));
  const minDim = Math.min(...rs.map(r => Math.min(r.w, r.h)));
  const h = Math.max(1, Math.min(Math.round(t.border.blend * (W / BW) / 2), Math.floor(minDim / 2))), tol = 1.5;
  return rs.map(r => {
    const x0 = Math.round(r.x), x1 = Math.round(r.x + r.w), y0 = Math.round(r.y), y1 = Math.round(r.y + r.h);
    const L = x0 > tol, R = x1 < W - tol, T = y0 > tol, Bt = y1 < H - tol;
    const ex = L ? x0 - h : x0, ey = T ? y0 - h : y0;
    return { r, e: { x: ex, y: ey, w: (R ? x1 + h : x1) - ex, h: (Bt ? y1 + h : y1) - ey }, m: { L, R, T, B: Bt, f: 2 * h } };
  });
}
const smoothT = v => v * v * (3 - 2 * v);
function rampStops(g, len, f, a, b){
  const pts = [];
  if (a) for (let k = 0; k <= 8; k++){ const v = k / 8; pts.push([v * f / len, smoothT(v)]); } else pts.push([0, 1]);
  if (b) for (let k = 0; k <= 8; k++){ const v = k / 8; pts.push([(len - f + v * f) / len, 1 - smoothT(v)]); } else pts.push([1, 1]);
  pts.sort((p, q) => p[0] - q[0]).forEach(([q, v]) => g.addColorStop(clamp(q, 0, 1), `rgba(0,0,0,${v})`));
}
export function featherMask(x, w, h, m){
  x.globalCompositeOperation = 'destination-in';
  if (m.L || m.R){ const g = x.createLinearGradient(0, 0, w, 0); rampStops(g, w, m.f, m.L, m.R); x.fillStyle = g; x.fillRect(0, 0, w, h); }
  if (m.T || m.B){ const g = x.createLinearGradient(0, 0, 0, h); rampStops(g, h, m.f, m.T, m.B); x.fillStyle = g; x.fillRect(0, 0, w, h); }
  x.globalCompositeOperation = 'source-over';
}
