import { clamp, mk, rng } from './util.js';

/* ids das texturas; os nomes ficam em locales/ (texture.<id>) */
export const TEXTURES = ['none', 'grao', 'filme', 'papel', 'linho', 'tela', 'pontilhado', 'fibras', 'aquarela', 'ramagem'];
const TS = 384, TEX_CACHE = {};
function vnoise(size, P, r){
  const g = new Float32Array(P * P); for (let i = 0; i < g.length; i++) g[i] = r();
  const out = new Float32Array(size * size), sm = t => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++){
    const fx = x / size * P, fy = y / size * P, x0 = fx | 0, y0 = fy | 0, tx = sm(fx - x0), ty = sm(fy - y0);
    const x1 = (x0 + 1) % P, y1 = (y0 + 1) % P;
    const a = g[y0 * P + x0], b = g[y0 * P + x1], c = g[y1 * P + x0], d = g[y1 * P + x1];
    out[y * size + x] = (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
  }
  return out;
}
function pixTex(T, f){
  const c = mk(T, T), x = c.getContext('2d'), im = x.createImageData(T, T), d = im.data;
  for (let y = 0; y < T; y++) for (let X = 0; X < T; X++){
    const v = f(X, y), i = (y * T + X) * 4;
    if (v < 0){ d[i] = 70; d[i + 1] = 56; d[i + 2] = 42; d[i + 3] = Math.min(255, -v * 255); }
    else { d[i] = 255; d[i + 1] = 251; d[i + 2] = 243; d[i + 3] = Math.min(255, v * 255); }
  }
  x.putImageData(im, 0, 0); return c;
}
function wrapDraw(T, fn){ for (const ox of [-T, 0, T]) for (const oy of [-T, 0, T]) fn(ox, oy); }
function genTex(id){
  const T = TS, r = rng(id.length * 977 + 13);
  if (id === 'grao') return pixTex(T, () => (r() - .5) * .5);
  if (id === 'filme'){ const s = pixTex(T / 3, () => (r() - .5) * .75), c = mk(T, T), x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(s, 0, 0, T, T); return c; }
  if (id === 'papel'){ const a = vnoise(T, 6, r), b = vnoise(T, 24, r); return pixTex(T, (X, y) => (a[y * T + X] - .5) * .38 + (b[y * T + X] - .5) * .22 + (r() - .5) * .12); }
  if (id === 'aquarela'){ const a = vnoise(T, 4, r), b = vnoise(T, 11, r); return pixTex(T, (X, y) => { const m = a[y * T + X] * .7 + b[y * T + X] * .3; return -Math.max(0, m - .42) * 1.1 + (r() - .5) * .05; }); }
  const c = mk(T, T), x = c.getContext('2d');
  if (id === 'linho'){
    for (let y = 0; y < T; y += 2){ x.fillStyle = `rgba(70,56,42,${.03 + r() * .09})`; x.fillRect(0, y, T, 1); x.fillStyle = `rgba(255,251,243,${.03 + r() * .08})`; x.fillRect(0, y + 1, T, 1); }
    for (let X = 0; X < T; X += 2){ x.fillStyle = `rgba(70,56,42,${.02 + r() * .07})`; x.fillRect(X, 0, 1, T); }
    for (let i = 0; i < 70; i++){ const X = r() * T, y = (r() * T / 2 | 0) * 2, w = 10 + r() * 40, a = .06 + r() * .1; wrapDraw(T, (ox, oy) => { x.fillStyle = `rgba(70,56,42,${a})`; x.fillRect(X + ox, y + oy, w, 1.4); }); }
    return c;
  }
  if (id === 'tela'){
    x.lineWidth = 1;
    for (let k = -T; k < 2 * T; k += 6){
      x.strokeStyle = 'rgba(70,56,42,.09)'; x.beginPath(); x.moveTo(k, 0); x.lineTo(k + T, T); x.stroke();
      x.strokeStyle = 'rgba(255,251,243,.08)'; x.beginPath(); x.moveTo(k + 3, T); x.lineTo(k + 3 + T, 0); x.stroke();
    }
    const n = pixTex(T, () => (r() - .5) * .18); x.drawImage(n, 0, 0); return c;
  }
  if (id === 'pontilhado'){
    for (let i = 0; i < 1100; i++){ const X = r() * T, y = r() * T, rad = .35 + r() * 1.05, dark = r() < .8, a = dark ? .12 + r() * .4 : .3 + r() * .4;
      wrapDraw(T, (ox, oy) => { x.fillStyle = dark ? `rgba(70,56,42,${a})` : `rgba(255,251,243,${a})`; x.beginPath(); x.arc(X + ox, y + oy, rad, 0, 7); x.fill(); }); }
    return c;
  }
  if (id === 'fibras'){
    x.drawImage(pixTex(T, () => (r() - .5) * .16), 0, 0);
    for (let i = 0; i < 700; i++){ const X = r() * T, y = r() * T, len = 4 + r() * 14, ang = r() * Math.PI, bend = (r() - .5) * 4, dark = r() < .6, a = .08 + r() * .22;
      wrapDraw(T, (ox, oy) => { x.strokeStyle = dark ? `rgba(70,56,42,${a})` : `rgba(255,251,243,${a})`; x.lineWidth = .6; x.beginPath(); x.moveTo(X + ox, y + oy); const ex = X + ox + Math.cos(ang) * len, ey = y + oy + Math.sin(ang) * len; x.quadraticCurveTo((X + ox + ex) / 2 + bend, (y + oy + ey) / 2 - bend, ex, ey); x.stroke(); }); }
    return c;
  }
  if (id === 'ramagem'){
    x.drawImage(pixTex(T, () => (r() - .5) * .14), 0, 0);
    const sprigs = [];
    for (let i = 0; i < 16; i++) sprigs.push({ X: (i % 4 + r() * .7) * T / 4, Y: ((i / 4 | 0) + r() * .7) * T / 4, a: r() * Math.PI * 2, len: 16 + r() * 16, b: (r() - .5), n: 3 + (r() * 3 | 0), s: r() * 1000 | 0 });
    sprigs.forEach(s => wrapDraw(T, (ox, oy) => sprig(x, s.X + ox, s.Y + oy, s.a, s.len, s.b, s.n, rng(s.s))));
    for (let i = 0; i < 40; i++){ const X = r() * T, y = r() * T, rad = .8 + r() * 1.2, warm = r() < .5;
      wrapDraw(T, (ox, oy) => { x.fillStyle = warm ? 'rgba(128,78,56,.45)' : 'rgba(84,80,56,.4)'; x.beginPath(); x.arc(X + ox, y + oy, rad, 0, 7); x.fill(); }); }
    return c;
  }
  return c;
}
function sprig(x, X, Y, ang, len, b, n, r){
  x.save(); x.translate(X, Y); x.rotate(ang);
  const bend = b * len * .6;
  x.strokeStyle = 'rgba(78,74,52,.62)'; x.lineWidth = .9; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(len / 2, bend, len, 0); x.stroke();
  x.fillStyle = 'rgba(78,74,52,.55)';
  for (let i = 1; i <= n; i++){
    const t = i / (n + 1), px = len * t, py = bend * 2 * t * (1 - t), side = i % 2 ? 1 : -1;
    x.save(); x.translate(px, py); x.rotate(side * (.6 + r() * .35)); x.beginPath(); x.ellipse(4.2, 0, 4.2, 1.7, 0, 0, 7); x.fill(); x.restore();
  }
  x.fillStyle = 'rgba(128,78,56,.55)'; x.beginPath(); x.arc(len + 1.8, 0, 1.5, 0, 7); x.fill();
  x.restore();
}
const tex = id => TEX_CACHE[id] || (TEX_CACHE[id] = genTex(id));
export function paintTexture(ctx, id, amt, s, W, H){
  if (id === 'none' || amt <= 0) return;
  const p = ctx.createPattern(tex(id), 'repeat');
  if (p.setTransform) p.setTransform(new DOMMatrix().scale(s));
  ctx.save(); ctx.globalAlpha = clamp(amt, 0, 1); ctx.fillStyle = p; ctx.fillRect(0, 0, W, H); ctx.restore();
}
