import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { needFonts } from '../lib/fonts.js';
import { imgFor, renderTpl } from '../lib/render.js';
import { cancel, schedule } from '../lib/scheduler.js';
import { makeTpl, slotGeo, slotRects, textAnchors, tplName } from '../lib/templates.js';
import { toast } from '../lib/toast.js';
import { isDirty, revertMine } from '../lib/userTemplates.js';
import { BW, clamp, patchIn, setIn } from '../lib/util.js';
import { shuffleTpl, useTr } from '../state.js';
import { BordersPanel, ImagesPanel, TextsPanel } from './EditorPanels.jsx';
import FilterPanel from './FilterPanel.jsx';
import PreviewBgPicker from './PreviewBgPicker.jsx';
import { useDismiss } from './controls.jsx';
import { IconChevron, IconDownload, IconRedo, IconSave, IconShuffle, IconSnapPhoto, IconSnapText, IconSwap, IconUndo } from './icons.jsx';

const TABS = ['imagens', 'textos', 'bordas', 'filtros'];
const snap = t => JSON.stringify({ slots: t.slots, texts: t.texts, border: t.border, filter: t.filter });
/* Âncora mais próxima de v dentro da tolerância: a posição dela e todas as linhas que passam por ali */
function snapTo(list, v, tol){
  let p = null;
  for (const a of list) if (Math.abs(a.p - v) < tol && (p == null || Math.abs(a.p - v) < Math.abs(p - v))) p = a.p;
  return p == null ? null : { p, lines: list.filter(a => Math.abs(a.p - p) < 1e-4) };
}
/* Âncoras dos outros textos (t: true), em frações do canvas: bordas esquerda e direita e o meio, na vertical;
   bordas superior e inferior e o meio, na horizontal */
function textEdges(boxes, skip){
  const v = [], h = [];
  boxes.forEach((bb, k) => {
    if (!bb || k === skip) return;
    [bb.x, bb.x + bb.w / 2, bb.x + bb.w].forEach(p => v.push({ p, a: bb.y, b: bb.y + bb.h, t: true }));
    [bb.y, bb.y + bb.h / 2, bb.y + bb.h].forEach(p => h.push({ p, a: bb.x, b: bb.x + bb.w, t: true }));
  });
  return { v, h };
}
/* Encaixe num eixo. pos é a posição do texto (x ou y) e feats a distância dela até as duas bordas e o meio da caixa.
   As âncoras das fotos pegam só o meio do texto; as dos outros textos pegam qualquer borda ou o meio. */
function snapAxis(pos, feats, photo, text, tol){
  let best = null;
  const test = (list, fs) => fs.forEach(f => {
    const r = snapTo(list, pos + f, tol), d = r && Math.abs(r.p - pos - f);
    if (r && (!best || d < best.d)) best = { d, pos: r.p - f, lines: r.lines };
  });
  test(photo, [feats[1]]); test(text, feats);
  return best;
}

/* Quais âncoras o texto arrastado usa (fotos e outros textos); a escolha fica salva no navegador */
function readSnaps(){
  try { const o = JSON.parse(localStorage.getItem('tb-anchors') || '{}'); return { photo: o.photo !== false, text: o.text !== false }; } catch (e){ return { photo: true, text: true }; }
}
const NO_LINES = { v: [], h: [] };
function readMini(){ try { return localStorage.getItem('tb-mini') !== '0'; } catch (e){ return true; } }

/* history = { undo, redo, last } e a aba ficam no App, então sobrevivem quando o editor fecha e abre de novo.
   onSaveAs(nome) guarda uma cópia de um template padrão em "Meus templates". */
export default function Editor({ index, tpl, images, env, actions, history, tab, setTab, prevBg, onPrevBg, onClose, onExport, onSaveAs }){
  const tr = useTr();
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
  const [saveName, setSaveName] = useState(null);
  const [snaps, setSnaps] = useState(readSnaps);
  const [mini, setMini] = useState(readMini);
  const [mw, setMw] = useState(0);
  const [, bump] = useReducer(n => n + 1, 0);
  const wrapRef = useRef(null), cvsRef = useRef(null), pbRef = useRef(null), miniRef = useRef(null);
  const boxesRef = useRef([]), swapRef = useRef(null), armRef = useRef(0), wheelRef = useRef(null), revealSlot = useRef(false), saveRef = useRef(null);
  const dirty = isDirty(tpl);
  useDismiss(saveRef, saveName != null, () => setSaveName(null));

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
    actions.setTpl(index, t => ({ ...t, slots: o.slots, texts: o.texts, border: o.border, filter: o.filter, edited: true }));
    setTextSel(n => clamp(n, 0, Math.max(0, o.texts.length - 1))); setSlotSel(n => clamp(n, 0, o.slots.length - 1)); setFontOpen(false); bump();
  }
  function undo(){ commit(tpl); if (!history.undo.length){ toast(tr('editor.nothingToUndo'), 1200); return; } history.redo.push(history.last); applySnap(history.undo.pop()); }
  function redo(){ commit(tpl); if (!history.redo.length){ toast(tr('editor.nothingToRedo'), 1200); return; } history.undo.push(history.last); applySnap(history.redo.pop()); }
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
      const k = e.key.toLowerCase();
      if (k === 's'){ e.preventDefault(); save(); return; }
      if (ae.tagName === 'TEXTAREA' || (ae.tagName === 'INPUT' && ae.type === 'text')) return;
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
  // Pré-visualização reduzida (como a thumb aparece no YouTube): sem seleção nem guias, desenhada depois do palco
  useEffect(() => {
    const c = miniRef.current; if (!c) return;
    const size = () => setMw(Math.round(c.clientWidth * (window.devicePixelRatio || 1)));
    size();
    const ro = new ResizeObserver(size); ro.observe(c);
    return () => ro.disconnect();
  }, [mini]);
  useEffect(() => {
    if (!mini || !mw) return;
    schedule('mini', () => { if (miniRef.current) renderTpl(tpl, index, mw, Math.round(mw * 9 / 16), env, { canvas: miniRef.current }); });
    return () => cancel('mini');
  }, [mini, mw, tpl, index, env, fontTick]);
  useEffect(() => { try { localStorage.setItem('tb-mini', mini ? '1' : '0'); } catch (e){} }, [mini]);
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
      const L = tpl.texts[d.i], c = cvsRef.current, an = snaps.photo ? textAnchors(tpl, c.width, c.height) : NO_LINES, te = snaps.text ? textEdges(boxesRef.current, d.i) : NO_LINES, bb = boxesRef.current[d.i];
      let nx = clamp(d.ox + p.x - d.sx, 0, 1), ny = clamp(d.oy + p.y - d.sy, 0, 1);
      // x marca a borda esquerda, o meio ou a borda direita da caixa, conforme o alinhamento; y é sempre o meio
      const off = L.align === 'center' ? bb.w / 2 : L.align === 'left' ? 0 : bb.w;
      const sv = snapAxis(nx, [-off, bb.w / 2 - off, bb.w - off], an.v, te.v, .012), sh = snapAxis(ny, [-bb.h / 2, 0, bb.h / 2], an.h, te.h, .015);
      if (sv) nx = sv.pos; if (sh) ny = sh.pos;
      // As linhas de um texto vão até o texto arrastado, para mostrar com o que ele está alinhado
      const x0 = nx - off, y0 = ny - bb.h / 2, g = {};
      if (sv) g.v = sv.lines.map(l => l.t ? { ...l, a: Math.min(l.a, y0), b: Math.max(l.b, y0 + bb.h) } : l);
      if (sh) g.h = sh.lines.map(l => l.t ? { ...l, a: Math.min(l.a, x0), b: Math.max(l.b, x0 + bb.w) } : l);
      setGuide(sv || sh ? g : null);
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
    else if (!sw.moved || sw.to === sw.from) toast(tr('editor.swapHelp'), 2200);
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
    // Template salvo volta à última versão salva; template padrão volta ao original
    actions.setTpl(index, t => t.mine ? revertMine(t) : { ...makeTpl(t.def), pick: t.pick });
    setTextSel(0); setSlotSel(0); bump(); toast(tr(tpl.mine ? 'editor.reverted' : 'editor.resetDone'));
  }
  function save(){
    if (!tpl.mine){ if (saveName == null) setSaveName(tplName(tpl)); return; }
    if (!dirty){ toast(tr('editor.nothingToSave'), 1200); return; }
    actions.saveTemplate(index); toast(tr('editor.saved'));
  }
  function saveAs(e){
    e.preventDefault();
    commit(tpl); onSaveAs(saveName.trim() || tr('mine.untitled')); toast(tr('editor.savedNew'), 4000);
  }
  useEffect(() => () => clearTimeout(armRef.current), []);
  useEffect(() => { try { localStorage.setItem('tb-anchors', JSON.stringify(snaps)); } catch (e){} }, [snaps]);
  function shuffle(){
    if (!images.length){ toast(tr('shuffle.noStills')); return; }
    actions.setTpl(index, t => shuffleTpl(t, index, images));
  }
  function borderAll(){
    actions.borderAll(index);
    toast(tr(tpl.border.blend > 0 ? 'editor.blendAll' : 'editor.bordersAll'));
  }

  const rs = slotRects(tpl, 1, 1), target = swap && swap.to >= 0 && swap.to !== swap.from ? rs[swap.to] : null;
  const panelProps = { tpl, index, images, edit, setPath };
  return (
    <section id="editView">
      <div className="ed-top gut">
        <button className="btn ghost" onClick={close}>{tr('editor.back')}</button>
        {tpl.mine
          ? <div className="ed-title">
              <input className="ed-name" value={tpl.name} maxLength={80} aria-label={tr('editor.saveName')} title={tr('editor.rename')}
                onChange={e => actions.renameTemplate(index, e.target.value)} onBlur={e => { if (!e.target.value.trim()) actions.renameTemplate(index, tr('mine.untitled')); }} />
              <span className="note">{tr('card.base', { name: tr('tpl.' + tpl.def.id) })}</span>
            </div>
          : <h2>{tplName(tpl)}</h2>}
        <div className="ed-act">
          <PreviewBgPicker value={prevBg} onChange={onPrevBg} />
          <div className="bgpick" role="group" aria-label={tr('editor.anchors')}>
            <span className="lbl">{tr('editor.anchors')}</span>
            {[['photo', IconSnapPhoto], ['text', IconSnapText]].map(([k, Icon]) => (
              <button key={k} className={'bgs snap' + (snaps[k] ? ' on' : '')} aria-pressed={snaps[k]} title={tr('editor.anchors.' + k)} aria-label={tr('editor.anchors.' + k)}
                onClick={() => setSnaps(o => ({ ...o, [k]: !o[k] }))}><Icon /></button>
            ))}
          </div>
          <button className="icon-btn" title={tr('editor.undoTitle')} aria-label={tr('editor.undo')} disabled={!history.undo.length} onClick={undo}><IconUndo /></button>
          <button className="icon-btn" title={tr('editor.redoTitle')} aria-label={tr('editor.redo')} disabled={!history.redo.length} onClick={redo}><IconRedo /></button>
          <button className="btn" onClick={shuffle}><IconShuffle />{tr('editor.shuffle')}</button>
          <button className={'btn ghost' + (armed ? ' danger' : '')} disabled={tpl.mine && !dirty} onClick={reset}>{tr(tpl.mine ? (armed ? 'editor.revertConfirm' : 'editor.revert') : (armed ? 'editor.resetConfirm' : 'editor.reset'))}</button>
          <div className="save-wrap" ref={saveRef}>
            <button className="btn" disabled={tpl.mine && !dirty} title={tr(tpl.mine ? 'editor.saveTitleMine' : 'editor.saveTitleDefault')} onClick={save}><IconSave />{tr('editor.save')}</button>
            {saveName != null && (
              <form className="save-pop" onSubmit={saveAs}>
                <label htmlFor="saveName">{tr('editor.saveName')}</label>
                <input id="saveName" autoFocus value={saveName} maxLength={80} onChange={e => setSaveName(e.target.value)} />
                <div className="row">
                  <button type="button" className="btn ghost" onClick={() => setSaveName(null)}>{tr('editor.cancel')}</button>
                  <button type="submit" className="btn primary">{tr('editor.saveConfirm')}</button>
                </div>
              </form>
            )}
          </div>
          <button className="btn primary" onClick={() => onExport([index])}><IconDownload />{tr('common.download')}</button>
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
                  title={tr('editor.swapTitle')} aria-label={tr('editor.swapLabel', { n: k + 1 })}
                  onPointerDown={e => swapStart(e, k)} onPointerMove={swapMove} onPointerUp={swapEnd} onPointerCancel={swapEnd}>
                  <IconSwap />
                </button>
              ))}
              {target && <div className="swap-target" style={{ left: target.x * 100 + '%', top: target.y * 100 + '%', width: target.w * 100 + '%', height: target.h * 100 + '%' }}><span>{tr('editor.swapHere')}</span></div>}
              {swap && <div className="swap-ghost" style={{ left: swap.x, top: swap.y, backgroundImage: swap.thumb ? `url(${swap.thumb})` : 'none' }} />}
            </div>
          </div>
          <p className="hint">{tr('editor.hint')}</p>
        </div>
        <aside className="panel">
          <div className="mini-prev">
            <button className="mini-head" aria-expanded={mini} onClick={() => setMini(v => !v)}>
              <span>{tr('editor.mini')}</span><IconChevron />
            </button>
            {mini && <canvas ref={miniRef} aria-label={tr('editor.mini')} />}
          </div>
          <nav className="tabs" role="tablist">
            {TABS.map(id => <button key={id} className={'tab' + (tab === id ? ' on' : '')} role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setFontOpen(false); }}>{tr('editor.tab.' + id)}</button>)}
          </nav>
          <div id="pb" ref={pbRef}>
            {tab === 'imagens' && <ImagesPanel {...panelProps} slotSel={slotSel} setSlotSel={setSlotSel} />}
            {tab === 'textos' && <TextsPanel {...panelProps} textSel={textSel} setTextSel={setTextSel} fontOpen={fontOpen} setFontOpen={setFontOpen} boxesRef={boxesRef} />}
            {tab === 'bordas' && <BordersPanel {...panelProps} onBorderAll={borderAll} />}
            {tab === 'filtros' && <FilterPanel {...panelProps} />}
          </div>
        </aside>
      </div>
    </section>
  );
}
