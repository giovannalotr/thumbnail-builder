import { useEffect, useId, useRef, useState } from 'react';
import { fmtNum } from '../lib/i18n.js';
import { paintTexture } from '../lib/textures.js';
import { useTr } from '../state.js';
import { IconMore } from './icons.jsx';

const FMT = { pct: v => Math.round(v * 100) + '%', px: v => Math.round(v) + ' px', em: v => (v * 100).toFixed(0) + '%', x: v => fmtNum(v, 2) + '×', pos: v => Math.round(v * 100) + '%', off: v => Math.round(v * 100) };

export function Range({ label, value, min, max, step, fmt, onChange }){
  const id = useId();
  return (
    <div className="ctl">
      <label htmlFor={id}>{label}</label><output htmlFor={id}>{FMT[fmt](value)}</output>
      <input type="range" id={id} min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

export function Swatches({ value, colors, onChange }){
  const tr = useTr(), v = (value || '').toLowerCase();
  return (
    <div className="sw">
      {colors.map(c => <button key={c} className={'swb' + (v === c.toLowerCase() ? ' on' : '')} style={{ background: c }} aria-label={tr('controls.color', { c })} onClick={() => onChange(c)} />)}
      <input type="color" value={value} onChange={e => onChange(e.target.value)} aria-label={tr('controls.otherColor')} />
    </div>
  );
}

/* Botões lado a lado em que só um fica ativo; options = [[valor, rótulo], ...] */
export function Seg({ value, options, onChange }){
  return <div className="seg">{options.map(([v, l]) => <button key={v} className={value === v ? 'on' : undefined} onClick={() => onChange(v)}>{l}</button>)}</div>;
}

export function TexSwatch({ id, color, amt }){
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, x = c.getContext('2d');
    x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    paintTexture(x, id, Math.max(amt, .7), 1, c.width, c.height);
  }, [id, color, amt]);
  return <canvas ref={ref} width="160" height="106" />;
}

/* Fecha um popup com um clique fora dele ou com Esc (sem que o Esc chegue ao editor) */
export function useDismiss(ref, open, onClose){
  useEffect(() => {
    if (!open) return;
    const down = e => { if (!ref.current.contains(e.target)) onClose(); };
    const key = e => { if (e.key === 'Escape'){ e.stopPropagation(); onClose(); } };
    document.addEventListener('pointerdown', down); document.addEventListener('keydown', key, true);
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key, true); };
  }, [open]);
}

/* Botão "⋯" com uma lista de ações: items = [{ id, label, run, confirm, danger }].
   Com confirm, o primeiro clique troca o rótulo pelo texto de confirmação e só o segundo executa. */
export function Menu({ label, items }){
  const [open, setOpen] = useState(false), [armed, setArmed] = useState(null), ref = useRef(null);
  const close = () => { setOpen(false); setArmed(null); };
  useDismiss(ref, open, close);
  const choose = it => { if (it.confirm && armed !== it.id){ setArmed(it.id); return; } close(); it.run(); };
  return (
    <div className="menu" ref={ref}>
      <button className="icon-btn" aria-haspopup="menu" aria-expanded={open} aria-label={label} title={label} onClick={() => open ? close() : setOpen(true)}><IconMore /></button>
      {open && (
        <div className="menu-list" role="menu">
          {items.map(it => <button key={it.id} role="menuitem" className={it.danger ? 'danger' : undefined} onClick={() => choose(it)}>{armed === it.id ? it.confirm : it.label}</button>)}
        </div>
      )}
    </div>
  );
}
