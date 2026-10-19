import { useEffect, useRef } from 'react';
import { FILTERS, applyGrade, makeGrade } from '../lib/grade.js';
import { imgFor } from '../lib/render.js';
import { useTr } from '../state.js';
import { Range } from './controls.jsx';

/* Miniatura da primeira foto do template com o filtro aplicado */
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

/* Aba "Filtros" do editor: filtro de cor, intensidade, grão e vinheta do template */
export default function FilterPanel({ tpl, index, images, setPath }){
  const tr = useTr(), f = tpl.filter, src = imgFor(tpl, 0, images, index);
  return (
    <>
      <div className="sec">
        <div className="sec-h"><h4>{tr('filter.title')}</h4></div>
        <div className="fgrid" role="radiogroup" aria-label={tr('filter.title')}>
          {FILTERS.map(x => <FilterChip key={x.id} filter={x} src={src} on={x.id === f.id} onPick={() => setPath('filter.id', x.id)} />)}
        </div>
      </div>
      <div className="hr" />
      <div className="sec">
        <Range label={tr('filter.amount')} value={f.amt} min={0} max={1.5} step={.01} fmt="pct" onChange={v => setPath('filter.amt', v)} />
        <Range label={tr('filter.grain')} value={f.grain} min={0} max={1} step={.01} fmt="pct" onChange={v => setPath('filter.grain', v)} />
        <Range label={tr('filter.vignette')} value={f.vig} min={0} max={1} step={.01} fmt="pct" onChange={v => setPath('filter.vig', v)} />
      </div>
    </>
  );
}
