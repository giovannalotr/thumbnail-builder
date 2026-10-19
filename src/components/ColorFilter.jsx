import { useEffect, useRef } from 'react';
import { FILTERS, applyGrade, makeGrade } from '../lib/grade.js';
import { useTr } from '../state.js';
import { Range } from './controls.jsx';

/* Miniatura da primeira still com o filtro aplicado */
function FilterChip({ filter, src, on, onPick }){
  const tr = useTr(), ref = useRef(null);
  useEffect(() => {
    const c = ref.current, x = c.getContext('2d', { willReadFrequently: true });
    if (!src){ x.fillStyle = '#CFC6B8'; x.fillRect(0, 0, c.width, c.height); return; }
    const s = Math.max(c.width / src.w, c.height / src.h); x.imageSmoothingQuality = 'high';
    x.drawImage(src.prev, (c.width - src.w * s) / 2, (c.height - src.h * s) / 2, src.w * s, src.h * s);
    applyGrade(c, makeGrade(filter.id, 1, 0, 0));
  }, [src, filter.id]);
  return (
    <button className={'fchip' + (on ? ' on' : '')} role="radio" aria-checked={on} onClick={onPick}>
      <canvas ref={ref} width="208" height="116" /><span>{tr('filters.' + filter.id)}</span>
    </button>
  );
}

export default function ColorFilter({ state, actions }){
  const tr = useTr(), src = state.images[0];
  return (
    <div className="block">
      <div className="block-head"><h2>{tr('filter.title')}</h2><span className="note">{tr('filter.note')}</span></div>
      <div className="filters" role="radiogroup" aria-label={tr('filter.title')}>
        {FILTERS.map(f => <FilterChip key={f.id} filter={f} src={src} on={f.id === state.filter} onPick={() => actions.set('filter', f.id)} />)}
      </div>
      <div className="sl3">
        <Range label={tr('filter.amount')} value={state.amt} min={0} max={1.5} step={.01} fmt="pct" onChange={v => actions.set('amt', v)} />
        <Range label={tr('filter.grain')} value={state.grain} min={0} max={1} step={.01} fmt="pct" onChange={v => actions.set('grain', v)} />
        <Range label={tr('filter.vignette')} value={state.vig} min={0} max={1} step={.01} fmt="pct" onChange={v => actions.set('vig', v)} />
      </div>
    </div>
  );
}
