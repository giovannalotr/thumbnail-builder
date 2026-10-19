import { mk, rng, rrect, shade } from './util.js';
import { blurCanvas } from './blur.js';
import { thumbURL } from './images.js';

function glow(x, cx, cy, r, col){ const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); x.fillStyle = g; x.fillRect(0, 0, x.canvas.width, x.canvas.height); }
function vgrad(x, y0, y1, stops){ const g = x.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; }
function blob(x, X, Y, R){ x.beginPath(); x.arc(X, Y, R, 0, 7); x.fill(); }
const SCENES = [
  ['colinas', (x, W, H, r) => {
    x.fillStyle = vgrad(x, 0, H * .62, ['#B7C1C4', '#E3D6C2', '#F0D9B6']); x.fillRect(0, 0, W, H);
    glow(x, W * .68, H * .4, W * .34, 'rgba(255,228,186,.8)');
    const cols = ['#AAB3A8', '#8F9C83', '#76835E', '#5C6A44', '#414E31'];
    cols.forEach((col, k) => {
      const base = H * (.47 + k * .105), amp = H * (.05 + k * .014), ph = r() * 6, f1 = 1.2 + r() * 1.8, f2 = 3.5 + r() * 3;
      const ridge = t => base - amp * (Math.sin(t * f1 * Math.PI + ph) * .6 + Math.sin(t * f2 * Math.PI + ph * 2) * .25 + .3);
      x.beginPath(); x.moveTo(0, H); for (let i = 0; i <= W; i += 8) x.lineTo(i, ridge(i / W)); x.lineTo(W, H); x.closePath(); x.fillStyle = col; x.fill();
      if (k >= 1){ x.fillStyle = shade(col, -.2); for (let n = 0; n < 8 + k * 5; n++){ const tx = r() * W, ty = ridge(tx / W) + 6, rr = 5 + k * 5 + r() * 9; blob(x, tx, ty - rr * .4, rr); blob(x, tx + rr * .7, ty - rr * .1, rr * .8); } }
      if (k < 4){ x.fillStyle = `rgba(236,226,208,${.3 - k * .06})`; x.fillRect(0, 0, W, H); }
    });
  }],
  ['bosque', (x, W, H, r) => {
    x.fillStyle = vgrad(x, 0, H, ['#F2CF92', '#D08F4A', '#6E4524']); x.fillRect(0, 0, W, H);
    glow(x, W * .55, H * .33, W * .5, 'rgba(255,238,196,.85)');
    for (let i = 0; i < 260; i++){ x.fillStyle = `rgba(${170 + r() * 70 | 0},${70 + r() * 70 | 0},${20 + r() * 30 | 0},${.12 + r() * .25})`; blob(x, r() * W, r() * H * .6, 12 + r() * 38); }
    for (let i = 0; i < 70; i++){ x.fillStyle = `rgba(255,${210 + r() * 40 | 0},${140 + r() * 60 | 0},${.06 + r() * .2})`; blob(x, r() * W, r() * H * .8, 8 + r() * 46); }
    const trunk = (X, w, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(X - w / 2, H); x.lineTo(X - w * .32, 0); x.lineTo(X + w * .32, 0); x.lineTo(X + w / 2, H); x.closePath(); x.fill(); };
    for (let i = 0; i < 11; i++) trunk(r() * W, 10 + r() * 14, 'rgba(110,70,40,.45)');
    x.fillStyle = vgrad(x, H * .74, H, ['#8E5C2B', '#5A3818']); x.fillRect(0, H * .76, W, H * .24);
    for (let i = 0; i < 6; i++) trunk(r() * W, 30 + r() * 46, '#3B281B');
    for (let i = 0; i < 260; i++){ x.fillStyle = ['#C4662C', '#D9893A', '#A8461F', '#E0B24F'][r() * 4 | 0]; x.beginPath(); x.ellipse(r() * W, H * .8 + r() * H * .2, 3 + r() * 6, 2 + r() * 3, r() * 3, 0, 7); x.fill(); }
  }],
  ['vela', (x, W, H, r) => {
    x.fillStyle = '#24170F'; x.fillRect(0, 0, W, H);
    glow(x, W * .56, H * .4, W * .6, 'rgba(255,158,70,.55)'); glow(x, W * .56, H * .32, W * .16, 'rgba(255,216,150,.6)');
    x.fillStyle = vgrad(x, H * .68, H, ['#6E452B', '#3A2416']); x.fillRect(0, H * .68, W, H * .32);
    x.fillStyle = 'rgba(255,200,140,.25)'; x.fillRect(0, H * .68, W, 3);
    const cx = W * .56, top = H * .36, cw = 90, g = x.createLinearGradient(cx - cw / 2, 0, cx + cw / 2, 0);
    g.addColorStop(0, '#D5C4A6'); g.addColorStop(.45, '#FFF6E6'); g.addColorStop(1, '#BFAE90'); x.fillStyle = g; x.fillRect(cx - cw / 2, top, cw, H * .68 - top);
    x.fillStyle = '#FFF3DD'; x.beginPath(); x.ellipse(cx, top, cw / 2, 10, 0, 0, 7); x.fill();
    x.strokeStyle = '#2A1A10'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx, top); x.lineTo(cx, top - 16); x.stroke();
    const fg = x.createRadialGradient(cx, top - 40, 2, cx, top - 36, 40); fg.addColorStop(0, '#FFFBE6'); fg.addColorStop(.45, '#FFC45E'); fg.addColorStop(1, 'rgba(255,150,40,0)');
    x.fillStyle = fg; x.beginPath(); x.ellipse(cx, top - 38, 16, 36, 0, 0, 7); x.fill();
    const mx = W * .24, my = H * .5; x.fillStyle = '#E6DCCB'; rrect(x, mx, my, 170, H * .69 - my, 18); x.fill();
    x.strokeStyle = '#E6DCCB'; x.lineWidth = 16; x.beginPath(); x.arc(mx + 170, my + 70, 36, -1.3, 1.3); x.stroke();
    x.fillStyle = '#3B2416'; x.beginPath(); x.ellipse(mx + 85, my + 6, 78, 12, 0, 0, 7); x.fill();
    x.fillStyle = 'rgba(40,20,10,.25)'; x.fillRect(mx, my, 34, H * .69 - my);
    [[W * .8, H * .68, 110], [W * .9, H * .7, 76]].forEach(([px, py, rw]) => {
      x.fillStyle = '#C8692A'; x.beginPath(); x.ellipse(px, py - rw * .5, rw, rw * .62, 0, 0, 7); x.fill();
      x.strokeStyle = 'rgba(120,50,20,.55)'; x.lineWidth = 3; for (let k = -2; k <= 2; k++){ x.beginPath(); x.ellipse(px, py - rw * .5, Math.abs(k) * rw * .3 + 6, rw * .6, 0, 0, 7); x.stroke(); }
      x.fillStyle = '#5A4A2A'; x.fillRect(px - 5, py - rw * 1.15, 10, rw * .3);
    });
  }],
  ['ovelhas', (x, W, H, r) => {
    x.fillStyle = vgrad(x, 0, H * .5, ['#C3CDD2', '#EAE1D2']); x.fillRect(0, 0, W, H);
    x.fillStyle = '#9AA58A'; x.beginPath(); x.moveTo(0, H * .5); for (let i = 0; i <= W; i += 10) x.lineTo(i, H * .46 - Math.sin(i / W * 3 + 1) * 30); x.lineTo(W, H); x.lineTo(0, H); x.fill();
    x.fillStyle = vgrad(x, H * .52, H, ['#9AA565', '#6A7A3C']); x.fillRect(0, H * .55, W, H * .45);
    for (let row = 0; row < 3; row++) for (let X = -20; X < W; X += 34 + r() * 26){ x.fillStyle = ['#B9AB92', '#A99A80', '#CBBFA6', '#9C8F78'][r() * 4 | 0]; rrect(x, X, H * .53 + row * 22, 30 + r() * 30, 20 + r() * 6, 7); x.fill(); }
    for (let i = 0; i < 7; i++){
      const sx = W * (.08 + i * .13 + r() * .05), sy = H * (.7 + r() * .2), rw = 60 + r() * 36, dir = r() < .5 ? -1 : 1;
      x.fillStyle = 'rgba(40,50,20,.35)'; x.beginPath(); x.ellipse(sx, sy + rw * .55, rw * .95, rw * .18, 0, 0, 7); x.fill();
      x.fillStyle = '#2E2822'; x.fillRect(sx - rw * .5, sy + rw * .2, 8, rw * .35); x.fillRect(sx + rw * .4, sy + rw * .2, 8, rw * .35);
      x.fillStyle = '#EFE8DA'; x.beginPath(); x.ellipse(sx, sy, rw, rw * .6, 0, 0, 7); x.fill();
      x.fillStyle = '#3A332C'; x.beginPath(); x.ellipse(sx + dir * rw * .95, sy - rw * .2, rw * .22, rw * .3, dir * .4, 0, 7); x.fill();
    }
  }],
  ['trilha', (x, W, H, r) => {
    x.fillStyle = vgrad(x, 0, H, ['#EBDFC6', '#D8C39C']); x.fillRect(0, 0, W, H);
    glow(x, W * .5, H * .45, W * .3, 'rgba(255,240,205,.8)');
    for (let i = 0; i < 520; i++){ const left = r() < .5, X = left ? r() * W * .44 : W * .56 + r() * W * .44, Y = r() * H * .72;
      x.fillStyle = ['rgba(196,102,44,.55)', 'rgba(217,137,58,.5)', 'rgba(168,70,31,.5)', 'rgba(224,178,79,.5)', 'rgba(124,90,42,.45)'][r() * 5 | 0]; blob(x, X, Y, 12 + r() * 40); }
    x.strokeStyle = 'rgba(58,40,27,.8)'; for (let i = 0; i < 10; i++){ const X = r() < .5 ? r() * W * .38 : W * .62 + r() * W * .38; x.lineWidth = 6 + r() * 12; x.beginPath(); x.moveTo(X, H); x.lineTo(X + (r() - .5) * 30, H * .25); x.stroke(); }
    x.fillStyle = vgrad(x, H * .6, H, ['#8A8442', '#5E5A2A']); x.fillRect(0, H * .66, W, H * .34);
    x.fillStyle = vgrad(x, H * .55, H, ['#E6D4AE', '#C9AE82']); x.beginPath(); x.moveTo(W * .28, H); x.lineTo(W * .72, H); x.lineTo(W * .53, H * .6); x.lineTo(W * .47, H * .6); x.fill();
    for (let i = 0; i < 160; i++){ x.fillStyle = ['#C4662C', '#D9893A', '#A8461F'][r() * 3 | 0]; x.beginPath(); x.ellipse(W * .3 + r() * W * .4, H * .62 + r() * H * .38, 3 + r() * 5, 2 + r() * 2, r() * 3, 0, 7); x.fill(); }
  }],
  ['janela', (x, W, H, r) => {
    x.fillStyle = vgrad(x, 0, H, ['#D6C8B0', '#BBA889']); x.fillRect(0, 0, W, H);
    const wx = W * .1, wy = H * .06, ww = W * .5, wh = H * .56;
    x.fillStyle = vgrad(x, wy, wy + wh, ['#EEF1E8', '#C7D3B6']); x.fillRect(wx, wy, ww, wh);
    for (let i = 0; i < 60; i++){ x.fillStyle = `rgba(${90 + r() * 40 | 0},${120 + r() * 40 | 0},${70 + r() * 30 | 0},${.18 + r() * .25})`; blob(x, wx + r() * ww, wy + wh * .35 + r() * wh * .65, 18 + r() * 40); }
    x.fillStyle = '#F1EADF'; x.fillRect(wx + ww / 2 - 7, wy, 14, wh); x.fillRect(wx, wy + wh / 2 - 7, ww, 14);
    x.strokeStyle = '#F1EADF'; x.lineWidth = 22; x.strokeRect(wx, wy, ww, wh);
    glow(x, wx + ww * .6, wy + wh * .5, W * .5, 'rgba(255,246,226,.45)');
    x.fillStyle = vgrad(x, H * .66, H, ['#EDE5D6', '#D9CDB7']); x.fillRect(0, H * .66, W, H * .34);
    x.fillStyle = '#7A5A40'; rrect(x, W * .18, H * .76, 300, 46, 4); x.fill(); x.fillStyle = '#EFE6D4'; x.fillRect(W * .18 + 6, H * .76 + 8, 288, 10);
    const cx = W * .66, cy = H * .78;
    x.fillStyle = '#F7F2EA'; x.beginPath(); x.ellipse(cx, cy + 60, 190, 40, 0, 0, 7); x.fill();
    x.fillStyle = 'rgba(80,60,40,.12)'; x.beginPath(); x.ellipse(cx, cy + 66, 150, 24, 0, 0, 7); x.fill();
    x.fillStyle = '#FAF6EF'; x.beginPath(); x.moveTo(cx - 120, cy - 60); x.bezierCurveTo(cx - 120, cy + 60, cx - 60, cy + 70, cx, cy + 70); x.bezierCurveTo(cx + 60, cy + 70, cx + 120, cy + 60, cx + 120, cy - 60); x.fill();
    x.fillStyle = '#8A4B22'; x.beginPath(); x.ellipse(cx, cy - 60, 120, 22, 0, 0, 7); x.fill();
    x.strokeStyle = '#FAF6EF'; x.lineWidth = 16; x.beginPath(); x.arc(cx + 128, cy - 10, 34, -1.2, 1.2); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.4)'; x.lineWidth = 6; x.lineCap = 'round'; for (let k = 0; k < 3; k++){ x.beginPath(); x.moveTo(cx - 40 + k * 40, cy - 90); x.bezierCurveTo(cx - 70 + k * 40, cy - 150, cx - 10 + k * 40, cy - 190, cx - 40 + k * 40, cy - 250); x.stroke(); }
  }],
];
function makeSample(name, fn, i){
  const W = 1600, H = 900, c = mk(W, H), x = c.getContext('2d', { willReadFrequently: true });
  fn(x, W, H, rng(101 + i * 31));
  const soft = blurCanvas(c, 1.6); x.clearRect(0, 0, W, H); x.drawImage(soft, 0, 0);
  const im = x.getImageData(0, 0, W, H), d = im.data, r = rng(9 + i);
  for (let p = 0; p < d.length; p += 4){ const n = (r() - .5) * 14; d[p] += n; d[p + 1] += n; d[p + 2] += n; }
  x.putImageData(im, 0, 0);
  return { id: 'ex-' + name, name: 'Exemplo · ' + name, w: W, h: H, src: c, prev: c, thumb: thumbURL(c, W, H), sample: true };
}
let samples = null;
export const sampleImages = () => samples || (samples = SCENES.map(([n, fn], i) => makeSample(n, fn, i)));
