import { BW, mk, rrect, rgba } from './util.js';
import { applyGrade } from './grade.js';
import { blurCanvas } from './blur.js';
import { paintTexture } from './textures.js';
import { fstr } from './fonts.js';
import { featherMask, slotGeo } from './templates.js';

/* env = { images, imgVer, grade }: o que, além do próprio template, muda o desenho.
   ti é a posição do template na lista; define qual still preenche cada espaço vazio. */
export function imgFor(t, si, images, ti){
  const sl = t.slots[si];
  if (sl.img){ const f = images.find(i => i.id === sl.img); if (f) return f; }
  if (!images.length) return null;
  return images[(ti + si) % images.length];
}

function drawCover(x, im, src, r, sl, rad){
  const sc = Math.max(r.w / im.w, r.h / im.h) * sl.zoom, dw = im.w * sc, dh = im.h * sc, ox = (dw - r.w) / 2, oy = (dh - r.h) / 2;
  const px = sl.flip ? -sl.px : sl.px;
  const dx = r.x - ox + px * ox, dy = r.y - oy + sl.py * oy;
  x.save(); rrect(x, r.x, r.y, r.w, r.h, rad); x.clip();
  if (sl.flip){ const cx = r.x + r.w / 2; x.translate(cx, 0); x.scale(-1, 1); x.translate(-cx, 0); }
  x.drawImage(src, dx, dy, dw, dh); x.restore();
}
function photoLayer(t, ti, W, H, hi, env){
  const c = mk(W, H), x = c.getContext('2d', { willReadFrequently: true }), s = W / BW, rad = t.border.radius * s;
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  slotGeo(t, W, H).forEach(({ r, e, m }, i) => {
    const im = imgFor(t, i, env.images, ti);
    if (!m){
      if (!im){ x.fillStyle = '#CFC6B8'; rrect(x, r.x, r.y, r.w, r.h, rad); x.fill(); return; }
      drawCover(x, im, hi ? im.src : im.prev, r, t.slots[i], rad); return;
    }
    const lc = mk(e.w, e.h), lx = lc.getContext('2d'); lx.imageSmoothingQuality = 'high';
    if (im) drawCover(lx, im, hi ? im.src : im.prev, { x: 0, y: 0, w: lc.width, h: lc.height }, t.slots[i], 0);
    else { lx.fillStyle = '#CFC6B8'; lx.fillRect(0, 0, lc.width, lc.height); }
    featherMask(lx, lc.width, lc.height, m);
    x.globalCompositeOperation = 'lighter'; x.drawImage(lc, e.x, e.y); x.globalCompositeOperation = 'source-over';
  });
  applyGrade(c, env.grade);
  return c;
}
const PHOTO = new Map();
function cachedPhoto(t, ti, W, H, env){
  const key = JSON.stringify([t.def.id, t.slots, t.border.outer, t.border.gap, t.border.radius, t.border.blend, env.imgVer, env.grade.key, env.images.length]);
  const ck = ti + ':' + W, hit = PHOTO.get(ck);
  if (hit && hit.key === key) return hit.c;
  const c = photoLayer(t, ti, W, H, false, env); PHOTO.set(ck, { key, c }); return c;
}
function lineW(x, s, ls){ if (!ls) return x.measureText(s).width; let w = 0; for (const ch of s) w += x.measureText(ch).width + ls; return Math.max(0, w - ls); }
function drawLine(x, s, X, Y, ls){ if (!ls){ x.fillText(s, X, Y); return; } for (const ch of s){ x.fillText(ch, X, Y); X += x.measureText(ch).width + ls; } }
/* Desenha um texto e devolve a caixa que ele ocupa (em frações do canvas), usada pelo editor para clicar e arrastar */
function drawText(ctx, canvas, L, s, W, H, blurs){
  if (!L.text.trim()) return null;
  const fs = L.size * s; ctx.font = fstr(L, fs);
  const lines = L.text.split('\n'), ls = L.ls * fs, widths = lines.map(l => lineW(ctx, l, ls)), maxW = Math.max(...widths);
  const lh = fs * L.lh, blockH = lh * (lines.length - 1) + fs * .95, cx = L.x * W, cy = L.y * H;
  const left = L.align === 'center' ? cx - maxW / 2 : L.align === 'left' ? cx : cx - maxW, top = cy - blockH / 2;
  const Bx = L.box;
  if (Bx.mode !== 'none'){
    let bx = left - Bx.px * s, by = top - Bx.py * s, bw = maxW + 2 * Bx.px * s, bh = blockH + 2 * Bx.py * s;
    if (Bx.mode === 'band-h'){ bx = 0; bw = W; }
    if (Bx.mode === 'band-v'){ by = 0; bh = H; }
    const rad = Bx.mode === 'box' ? Bx.r * s : 0;
    if (Bx.blur > 0){
      const rb = Math.round(Bx.blur * s * 10) / 10;
      if (!blurs.has(rb)) blurs.set(rb, blurCanvas(canvas, rb));
      ctx.save(); rrect(ctx, bx, by, bw, bh, rad); ctx.clip(); ctx.drawImage(blurs.get(rb), 0, 0); ctx.restore();
    }
    ctx.save(); rrect(ctx, bx, by, bw, bh, rad); ctx.globalAlpha = Bx.op; ctx.fillStyle = Bx.color; ctx.fill(); ctx.restore();
    if (Bx.line){ const lw = Math.max(1, 1.2 * s); ctx.save(); rrect(ctx, bx + lw / 2, by + lw / 2, bw - lw, bh - lw, rad); ctx.strokeStyle = 'rgba(255,250,240,.5)'; ctx.lineWidth = lw; ctx.stroke(); ctx.restore(); }
  }
  ctx.save();
  if (L.shadow.on){ ctx.shadowColor = rgba(L.shadow.color, L.shadow.op); ctx.shadowBlur = L.shadow.blur * s; ctx.shadowOffsetX = L.shadow.ox * s; ctx.shadowOffsetY = L.shadow.oy * s; }
  ctx.fillStyle = L.color; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  lines.forEach((ln, i) => { const w = widths[i], lx = L.align === 'center' ? cx - w / 2 : L.align === 'left' ? cx : cx - w; drawLine(ctx, ln, lx, top + fs * .475 + i * lh, ls); });
  ctx.restore();
  return { x: left / W, y: top / H, w: maxW / W, h: blockH / H };
}
/* o.canvas: desenha num canvas existente; o.hi: usa as stills em resolução original (exportação) */
export function renderTpl(t, ti, W, H, env, o = {}){
  const c = o.canvas || mk(W, H);
  if (c.width !== W || c.height !== H){ c.width = W; c.height = H; }
  const ctx = c.getContext('2d'), s = W / BW, b = t.border;
  ctx.save(); ctx.fillStyle = b.color; ctx.fillRect(0, 0, W, H); ctx.restore();
  paintTexture(ctx, b.tex, b.amt, s, W, H);
  ctx.drawImage(o.hi ? photoLayer(t, ti, W, H, true, env) : cachedPhoto(t, ti, W, H, env), 0, 0);
  const blurs = new Map();
  const boxes = t.texts.map(L => drawText(ctx, c, L, s, W, H, blurs));
  return { canvas: c, boxes };
}
