import { useEffect, useId, useRef } from 'react';
import { paintTexture } from '../lib/textures.js';

const FMT = { pct: v => Math.round(v * 100) + '%', px: v => Math.round(v) + ' px', em: v => (v * 100).toFixed(0) + '%', x: v => v.toFixed(2) + '×', pos: v => Math.round(v * 100) + '%', off: v => Math.round(v * 100) };

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
  const v = (value || '').toLowerCase();
  return (
    <div className="sw">
      {colors.map(c => <button key={c} className={'swb' + (v === c.toLowerCase() ? ' on' : '')} style={{ background: c }} aria-label={`Cor ${c}`} onClick={() => onChange(c)} />)}
      <input type="color" value={value} onChange={e => onChange(e.target.value)} aria-label="Escolher outra cor" />
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
