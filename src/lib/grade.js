import { BW, clamp, rng } from './util.js';

const NEU = { exp: 0, con: 0, sat: 1, warm: 0, tint: 0, fade: 0, sh: [0, 0, 0], shA: 0, hi: [255, 255, 255], hiA: 0, grain: 0, vig: 0 };
export const FILTERS = [
  { id: 'natural', name: 'Cor natural', p: {} },
  { id: 'quente', name: 'Tons quentes', p: { warm: .13, sat: .96, con: .05, hi: [255, 200, 140], hiA: .09 } },
  { id: 'fosco', name: 'Suave e fosco', p: { fade: .13, con: -.17, sat: .82, exp: .03, hi: [255, 240, 225], hiA: .05 } },
  { id: 'dourado', name: 'Outono dourado', p: { warm: .17, sat: 1.08, con: .08, hi: [255, 186, 92], hiA: .15, sh: [80, 48, 28], shA: .1 } },
  { id: 'vela', name: 'Luz de vela', p: { warm: .22, exp: -.1, con: .1, sat: .9, sh: [72, 36, 16], shA: .2, hi: [255, 192, 122], hiA: .12, vig: .3 } },
  { id: 'filme', name: 'Filme antigo', p: { fade: .1, con: .04, sat: .78, sh: [30, 62, 56], shA: .13, hi: [255, 222, 172], hiA: .1, grain: .45 } },
  { id: 'cha', name: 'Chá com leite', p: { fade: .14, con: -.12, sat: .78, warm: .1, hi: [250, 230, 205], hiA: .12, exp: .04 } },
  { id: 'musgo', name: 'Musgo e névoa', p: { sat: .72, fade: .08, sh: [46, 70, 46], shA: .17, hi: [236, 236, 214], hiA: .06, con: -.06, warm: .03 } },
  { id: 'nublado', name: 'Manhã nublada', p: { warm: -.05, sat: .8, fade: .08, con: -.1, exp: .04, hi: [225, 232, 240], hiA: .06 } },
  { id: 'sepia', name: 'Sépia suave', p: { sat: .42, warm: .14, fade: .06, hi: [240, 210, 165], hiA: .12, sh: [72, 50, 34], shA: .12 } },
];
const NOISE = (() => { const r = rng(7), a = new Float32Array(65536); for (let i = 0; i < a.length; i++) a[i] = (r() + r() + r() - 1.5) / 1.5; return a; })();
export function makeGrade(fid, amt, gr, vg){
  const p = Object.assign({}, NEU, (FILTERS.find(f => f.id === fid) || FILTERS[0]).p);
  const L = k => NEU[k] + (p[k] - NEU[k]) * amt;
  const exp = L('exp'), con = L('con'), fade = Math.max(0, L('fade')), warm = L('warm'), tint = L('tint');
  const g = { sat: Math.max(0, L('sat')), shA: Math.max(0, L('shA')), hiA: Math.max(0, L('hiA')), sh: p.sh, hi: p.hi, grain: clamp(L('grain') + gr, 0, 2), vig: clamp(L('vig') + vg, 0, 1.5) };
  const tone = v => { v = v * Math.pow(2, exp); v = (v - .5) * (1 + con) + .5; v = clamp(v, 0, 1); return clamp(fade + v * (1 - fade * 1.15), 0, 1); };
  const lut = m => { const a = new Uint8ClampedArray(512); for (let i = 0; i < 512; i++) a[i] = tone(Math.min(1, i * m / 255)) * 255; return a; };
  g.lr = lut(1 + warm * .32); g.lg = lut(1 + warm * .06 + tint * .12); g.lb = lut(1 - warm * .34);
  g.id = !exp && !con && !fade && !warm && !tint && g.sat === 1 && !g.shA && !g.hiA && !g.grain && !g.vig;
  g.key = [fid, amt, gr, vg].join('|');
  return g;
}
export function applyGrade(c, g){
  if (g.id) return;
  const W = c.width, H = c.height, x = c.getContext('2d', { willReadFrequently: true }), im = x.getImageData(0, 0, W, H), d = im.data;
  const sc = BW / W, cx = W / 2, cy = H / 2, gA = g.grain * 22, vg = g.vig * .62, sat = g.sat, shA = g.shA, hiA = g.hiA;
  const [sr, sg, sb] = g.sh, [hr, hg, hb] = g.hi, lr = g.lr, lg = g.lg, lb = g.lb;
  for (let y = 0; y < H; y++){
    const by = (((y * sc) | 0) & 255) << 8, vy = ((y - cy) / cy) ** 2;
    for (let X = 0; X < W; X++){
      const i = (y * W + X) << 2;
      if (d[i + 3] === 0) continue;
      let r = d[i], G = d[i + 1], b = d[i + 2];
      if (sat !== 1){ const l = .299 * r + .587 * G + .114 * b; r = l + (r - l) * sat; G = l + (G - l) * sat; b = l + (b - l) * sat; }
      r = lr[r < 0 ? 0 : r > 511 ? 511 : r | 0]; G = lg[G < 0 ? 0 : G > 511 ? 511 : G | 0]; b = lb[b < 0 ? 0 : b > 511 ? 511 : b | 0];
      const l2 = (.299 * r + .587 * G + .114 * b) / 255;
      if (shA){ const w = (1 - l2) * (1 - l2) * shA; r += (sr - r) * w; G += (sg - G) * w; b += (sb - b) * w; }
      if (hiA){ const w = l2 * l2 * hiA; r += (hr - r) * w; G += (hg - G) * w; b += (hb - b) * w; }
      if (gA){ const n = NOISE[by | (((X * sc) | 0) & 255)] * gA * (1 - Math.abs(l2 - .5)); r += n; G += n; b += n; }
      if (vg){ const vx = ((X - cx) / cx) ** 2; let t = (vx + vy - .25) / 1.75; if (t > 0){ t = t > 1 ? 1 : t; const f = 1 - vg * t * t; r *= f; G *= f; b *= f; } }
      d[i] = r; d[i + 1] = G; d[i + 2] = b;
    }
  }
  x.putImageData(im, 0, 0);
}
