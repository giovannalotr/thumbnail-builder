import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { needFonts } from '../lib/fonts.js';
import { imgFor, renderTpl } from '../lib/render.js';
import { makeTpl, slotGeo, slotRects, textAnchors } from '../lib/templates.js';
import { toast } from '../lib/toast.js';
import { BW, clamp, patchIn, setIn } from '../lib/util.js';
import { shuffleTpl } from '../state.js';
import { BordersPanel, ImagesPanel, TextsPanel } from './EditorPanels.jsx';
import PreviewBgPicker from './PreviewBgPicker.jsx';
import { IconDownload, IconRedo, IconShuffle, IconSwap, IconUndo } from './icons.jsx';

const TABS = [['imagens', 'Imagens'], ['textos', 'Textos'], ['bordas', 'Bordas']];
const snap = t => JSON.stringify({ slots: t.slots, texts: t.texts, border: t.border });
/* Âncora mais próxima de v dentro da tolerância: a posição dela e todas as linhas que passam por ali */
function snapTo(list, v, tol){
  let p = null;
  for (const a of list) if (Math.abs(a.p - v) < tol && (p == null || Math.abs(a.p - v) < Math.abs(p - v))) p = a.p;
  return p == null ? null : { p, lines: list.filter(a => Math.abs(a.p - p) < 1e-4) };
}

/* history = { undo, redo, last } e a aba ficam no App, então sobrevivem quando o editor fecha e abre de novo */
export default function Editor({ index, tpl, images, env, actions, history, tab, setTab, prevBg, onPrevBg, onClose, onExport }){
  const [textSel, setTextSel] = useState(0);
  const [slotSel, setSlotSel] = useState(0);
  const [fontOpen, setFontOpen] = useState(false);
  const [drag, setDrag] = useState(null);
  const [guide, setGuide] = useState(null);
  const [cursor, setCursor] = useState('grab');
  const [cw, setCw] = useState(0);
  const [fontTick, setFontTick] = useState(0);
  const [armed, setArmed] = useState(false);
  const [swap, setSwap] = useState(null);
  const [, bump] = useReducer(n => n + 1, 0);
  const wrapRef = useRef(null), cvsRef = useRef(null), pbRef = useRef(null);
  const boxesRef = useRef([]), swapRef = useRef(null), armRef = useRef(0), wheelRef = useRef(null), revealSlot = useRef(false);

  const edit = fn => actions.editTpl(index, fn);
  const setPath = (path, v) => edit(t => setIn(t, path, v));

  /* ---------- Desfazer / refazer ---------- */
  function commit(t){
    const s = snap(t);
    if (history.last == null){ history.last = s; return; }
    if (s === history.last) return;
    history.undo.push(history.last); if (history.undo.length > 150) history.undo.shift();
    history.redo = []; history.last = s; bump();
  }
  function applySnap(s){
    const o = JSON.parse(s); history.last = s;
    actions.setTpl(index, t => ({ ...t, slots: o.slots, texts: o.texts, border: o.border, edited: true }));
    setTextSel(n => clamp(n, 0, Math.max(0, o.texts.length - 1))); setSlotSel(n => clamp(n, 0, o.slots.length - 1)); setFontOpen(false); bump();
  }
  function undo(){ commit(tpl); if (!history.undo.length){ toast('Nada para desfazer.', 1200); return; } history.redo.push(history.last); applySnap(history.undo.pop()); }
  function redo(){ commit(tpl); if (!history.redo.length){ toast('Nada para refazer.', 1200); return; } history.undo.push(history.last); applySnap(history.redo.pop()); }
  function close(){ commit(tpl); onClose(); }

  useEffect(() => { commit(tpl); window.scrollTo(0, 0); }, []);
  // Cada pausa de 350 ms vira um passo do histórico; durante um arraste, espera soltar
  useEffect(() => {
    if (drag) return;
    const id = setTimeout(() => commit(tpl), 350);
    return () => clearTimeout(id);
  }, [tpl, drag]);
  useEffect(() => {
    const onKey = e => {
      const ae = document.activeElement || document.body;
      if (e.key === 'Escape'){ if (!/INPUT|TEXTAREA|SELECT/.test(ae.tagName)) close(); return; }
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      if (ae.tagName === 'TEXTAREA' || (ae.tagName === 'INPUT' && ae.type === 'text')) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey){ e.preventDefault(); undo(); }
      else if ((k === 'z' && e.shiftKey) || k === 'y'){ e.preventDefault(); redo(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  /* ---------- Desenho ---------- */
  useLayoutEffect(() => {
    const size = () => setCw(clamp(Math.round(wrapRef.current.getBoundingClientRect().width * (window.devicePixelRatio || 1)), 640, 1920));
    size();
    window.addEventListener('resize', size);
    return () => window.removeEventListener('resize', size);
  }, []);
  useEffect(() => {
    if (!cw) return;
    let alive = true;
    const p = needFonts(tpl.texts); if (p) p.then(() => { if (alive) setFontTick(n => n + 1); });
    const id = requestAnimationFrame(() => {
      const c = cvsRef.current, W = c.width, H = c.height, s = W / BW, x = c.getContext('2d');
      boxesRef.current = renderTpl(tpl, index, W, H, env, { canvas: c }).boxes;
      if (tab === 'imagens' || (drag && drag.type === 'pan')){
        const r = slotRects(tpl, W, H)[slotSel];
        if (r){ x.save(); x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = Math.max(1.5, 2 * s); x.setLineDash([6 * s, 5 * s]); x.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4); x.restore(); }
      }
      const bb = boxesRef.current[textSel];
      if (bb && tab === 'textos'){
        const pad = 8 * s; x.save(); x.strokeStyle = 'rgba(255,255,255,.95)'; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 3; x.lineWidth = Math.max(1, 1.5 * s); x.setLineDash([5 * s, 4 * s]);
        x.strokeRect(bb.x * W - pad, bb.y * H - pad, bb.w * W + pad * 2, bb.h * H + pad * 2); x.restore();
      }
      if (guide){
        x.save(); x.strokeStyle = 'rgba(214,120,90,.95)'; x.lineWidth = Math.max(1, 1.5 * s); x.beginPath();
        (guide.v || []).forEach(l => { x.moveTo(l.p * W, l.a * H); x.lineTo(l.p * W, l.b * H); });
        (guide.h || []).forEach(l => { x.moveTo(l.a * W, l.p * H); x.lineTo(l.b * W, l.p * H); });
        x.stroke(); x.restore();
      }
    });
    return () => { alive = false; cancelAnimationFrame(id); };
  }, [tpl, index, env, cw, tab, slotSel, textSel, drag, guide, fontTick]);
  // Quando um clique na foto troca a seleção, mostra o cartão dela no painel
  useEffect(() => {
    if (!revealSlot.current) return;
    revealSlot.current = false;
    const el = pbRef.current.querySelector(`.slot[data-slot="${slotSel}"]`); if (el) el.scrollIntoView({ block: 'nearest' });
  }, [slotSel, tab]);

  /* ---------- Arrastar fotos e textos ---------- */
  const evPos = e => { const r = cvsRef.current.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; };
  const hitSlot = p => slotRects(tpl, 1, 1).findIndex(r => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
  function hitText(p){
    const order = tpl.texts.map((_, k) => k).reverse();
    if (tab === 'textos') order.sort((a, b) => (b === textSel) - (a === textSel));
    for (const k of order){
      const bb = boxesRef.current[k]; if (!bb) continue; const m = .012;
      if (p.x >= bb.x - m && p.x <= bb.x + bb.w + m && p.y >= bb.y - m * 1.6 && p.y <= bb.y + bb.h + m * 1.6) return k;
    }
    return -1;
  }
  function selectSlot(si){ if (slotSel !== si || tab !== 'imagens'){ revealSlot.current = true; setSlotSel(si); setTab('imagens'); } }
  function onPointerDown(e){
    const p = evPos(e), ti = hitText(p);
    if (ti >= 0){
      const L = tpl.texts[ti]; setDrag({ type: 'text', i: ti, sx: p.x, sy: p.y, ox: L.x, oy: L.y });
      if (textSel !== ti || tab !== 'textos'){ setTextSel(ti); setTab('textos'); setFontOpen(false); }
    } else {
      const si = hitSlot(p); if (si < 0) return;
      const sl = tpl.slots[si]; setDrag({ type: 'pan', i: si, sx: p.x, sy: p.y, px: sl.px, py: sl.py });
      selectSlot(si); setCursor('grabbing');
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e){
    const p = evPos(e), d = drag;
    if (!d){ setCursor(hitText(p) >= 0 ? 'move' : hitSlot(p) >= 0 ? 'grab' : 'default'); return; }
    if (d.type === 'text'){
      const L = tpl.texts[d.i], c = cvsRef.current, an = textAnchors(tpl, c.width, c.height);
      let nx = clamp(d.ox + p.x - d.sx, 0, 1), ny = clamp(d.oy + p.y - d.sy, 0, 1);
      // Gruda no centro da thumb ou de uma foto; o x só gruda em texto centralizado, porque nos outros ele marca a borda do texto
      const g = {}, sv = L.align === 'center' && snapTo(an.v, nx, .012), sh = snapTo(an.h, ny, .015);
      if (sv){ nx = sv.p; g.v = sv.lines; } if (sh){ ny = sh.p; g.h = sh.lines; }
      setGuide(g.v || g.h ? g : null);
      edit(t => patchIn(t, `texts.${d.i}`, { x: nx, y: ny }));
    } else {
      const c = cvsRef.current, r = slotGeo(tpl, c.width, c.height)[d.i].e, im = imgFor(tpl, d.i, images, index); if (!im) return;
      const sl = tpl.slots[d.i], sc = Math.max(r.w / im.w, r.h / im.h) * sl.zoom, ox = (im.w * sc - r.w) / 2, oy = (im.h * sc - r.h) / 2;
      const dx = (p.x - d.sx) * c.width, dy = (p.y - d.sy) * c.height, patch = {};
      if (ox > .5) patch.px = clamp(d.px + (sl.flip ? -dx : dx) / ox, -1, 1);
      if (oy > .5) patch.py = clamp(d.py + dy / oy, -1, 1);
      edit(t => patchIn(t, `slots.${d.i}`, patch));
    }
  }
  function endDrag(){ if (drag){ setDrag(null); setGuide(null); setCursor('grab'); } }
  // O React registra wheel como passivo; para impedir a rolagem da página, o ouvinte é registrado à mão
  useEffect(() => {
    wheelRef.current = e => {
      const si = hitSlot(evPos(e)); if (si < 0) return; e.preventDefault();
      const f = Math.exp(-e.deltaY * .0015);
      edit(t => patchIn(t, `slots.${si}`, { zoom: clamp(t.slots[si].zoom * f, 1, 4) }));
      selectSlot(si);
    };
  });
  useEffect(() => {
    const c = cvsRef.current, onWheel = e => wheelRef.current(e);
    c.addEventListener('wheel', onWheel, { passive: false });
    return () => c.removeEventListener('wheel', onWheel);
  }, []);

  /* ---------- Trocar fotos de lugar ---------- */
  const ghostAt = e => { const r = wrapRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  function swapStart(e, k){
    e.preventDefault(); e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const im = imgFor(tpl, k, images, index);
    swapRef.current = { from: k, to: -1, moved: false, thumb: im ? im.thumb : null, ...ghostAt(e) };
    setSwap(swapRef.current);
  }
  function swapMove(e){
    if (!swapRef.current) return;
    swapRef.current = { ...swapRef.current, moved: true, to: hitSlot(evPos(e)), ...ghostAt(e) };
    setSwap(swapRef.current);
  }
  function swapEnd(e){
    const sw = swapRef.current; if (!sw) return;
    swapRef.current = null; setSwap(null);
    if (e.type !== 'pointerup') return;
    if (sw.to >= 0 && sw.to !== sw.from) swapSlots(sw.from, sw.to);
    else if (!sw.moved || sw.to === sw.from) toast('Arraste o ícone até outra foto para trocá-las de lugar.', 2200);
  }
  function swapSlots(a, b){
    edit(t => {
      const ia = imgFor(t, a, images, index), ib = imgFor(t, b, images, index), slots = t.slots.slice();
      slots[a] = { ...t.slots[b], img: ib ? ib.id : null };
      slots[b] = { ...t.slots[a], img: ia ? ia.id : null };
      return { ...t, slots };
    });
    setSlotSel(b);
  }

  /* ---------- Barra do topo ---------- */
  function reset(){
    if (!armed){ setArmed(true); clearTimeout(armRef.current); armRef.current = setTimeout(() => setArmed(false), 3500); return; }
    clearTimeout(armRef.current); setArmed(false);
    commit(tpl); history.redo = [];
    actions.setTpl(index, t => ({ ...makeTpl(t.def), pick: t.pick }));
    setTextSel(0); setSlotSel(0); bump(); toast('Template restaurado ao padrão.');
  }
  useEffect(() => () => clearTimeout(armRef.current), []);
  function shuffle(){
    if (!images.length){ toast('Envie stills para embaralhar.'); return; }
    actions.setTpl(index, t => shuffleTpl(t, index, images));
  }
  function borderAll(){
    actions.borderAll(index);
    toast(tpl.border.blend > 0 ? 'Transição suave aplicada a todos os templates.' : 'Bordas aplicadas a todos os templates.');
  }

  const rs = slotRects(tpl, 1, 1), target = swap && swap.to >= 0 && swap.to !== swap.from ? rs[swap.to] : null;
  const panelProps = { tpl, index, images, edit, setPath };
  return (
    <section id="editView">
      <div className="ed-top gut">
        <button className="btn ghost" onClick={close}>← Templates</button>
        <h2>{tpl.def.name}</h2>
        <div className="ed-act">
          <PreviewBgPicker value={prevBg} onChange={onPrevBg} />
          <button className="icon-btn" title="Desfazer (Ctrl+Z)" aria-label="Desfazer" disabled={!history.undo.length} onClick={undo}><IconUndo /></button>
          <button className="icon-btn" title="Refazer (Ctrl+Shift+Z)" aria-label="Refazer" disabled={!history.redo.length} onClick={redo}><IconRedo /></button>
          <button className="btn" onClick={shuffle}><IconShuffle />Embaralhar</button>
          <button className="btn ghost" onClick={reset}>{armed ? 'Confirmar: desfazer edições' : 'Restaurar padrão'}</button>
          <button className="btn primary" onClick={() => onExport([index])}><IconDownload />Baixar</button>
        </div>
      </div>
      <div className="ed-body">
        <div className="stage gut">
          <div id="edWrap" ref={wrapRef}>
            <canvas id="edCanvas" ref={cvsRef} width={cw} height={Math.round(cw * 9 / 16)} style={{ cursor }}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} />
            <div id="slotUI">
              {tpl.slots.length > 1 && rs.map((r, k) => (
                <button key={k} className={'swap' + (swap && swap.from === k ? ' dragging' : '')} style={{ left: (r.x + r.w / 2) * 100 + '%', top: `calc(${r.y * 100}% + 10px)` }}
                  title="Arraste até outra foto para trocar de lugar" aria-label={`Trocar a imagem ${k + 1} de lugar`}
                  onPointerDown={e => swapStart(e, k)} onPointerMove={swapMove} onPointerUp={swapEnd} onPointerCancel={swapEnd}>
                  <IconSwap />
                </button>
              ))}
              {target && <div className="swap-target" style={{ left: target.x * 100 + '%', top: target.y * 100 + '%', width: target.w * 100 + '%', height: target.h * 100 + '%' }}><span>Trocar aqui</span></div>}
              {swap && <div className="swap-ghost" style={{ left: swap.x, top: swap.y, backgroundImage: swap.thumb ? `url(${swap.thumb})` : 'none' }} />}
            </div>
          </div>
          <p className="hint">Arraste uma foto para reposicionar · role sobre ela para zoom · arraste um texto para movê-lo · arraste o ícone ⇄ de uma foto até outra para trocá-las de lugar</p>
        </div>
        <aside className="panel">
          <nav className="tabs" role="tablist">
            {TABS.map(([id, label]) => <button key={id} className={'tab' + (tab === id ? ' on' : '')} role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setFontOpen(false); }}>{label}</button>)}
          </nav>
          <div id="pb" ref={pbRef}>
            {tab === 'imagens' && <ImagesPanel {...panelProps} slotSel={slotSel} setSlotSel={setSlotSel} />}
            {tab === 'textos' && <TextsPanel {...panelProps} textSel={textSel} setTextSel={setTextSel} fontOpen={fontOpen} setFontOpen={setFontOpen} boxesRef={boxesRef} />}
            {tab === 'bordas' && <BordersPanel {...panelProps} onBorderAll={borderAll} />}
          </div>
        </aside>
      </div>
    </section>
  );
}
