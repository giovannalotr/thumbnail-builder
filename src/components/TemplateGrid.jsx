import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { needFonts } from '../lib/fonts.js';
import { renderTpl } from '../lib/render.js';
import { cancel, schedule } from '../lib/scheduler.js';
import { clamp } from '../lib/util.js';
import { IconDownload } from './icons.jsx';

function TemplateCard({ tpl, index, W, env, onEdit, onPick, onDownload }){
  const ref = useRef(null);
  const { slots, texts, border } = tpl, n = slots.length, name = tpl.def.name;
  // Só fotos, textos, bordas, stills e filtro mudam o desenho; marcar o card não redesenha.
  useEffect(() => {
    if (!W) return;
    const key = 'card:' + index;
    let alive = true;
    const draw = () => { if (alive) schedule(key, () => renderTpl(tpl, index, W, Math.round(W * 9 / 16), env, { canvas: ref.current })); };
    draw();
    const p = needFonts(texts); if (p) p.then(draw);
    return () => { alive = false; cancel(key); };
  }, [slots, texts, border, index, W, env]);
  return (
    <article className={'card' + (tpl.pick ? ' picked' : '')}>
      <button className="thumb" onClick={onEdit} aria-label={`Editar ${name}`}>
        <canvas ref={ref} /><span className="edited" hidden={!tpl.edited}>editado</span><span className="open">Editar</span>
      </button>
      <div className="meta">
        <div><h3>{name}</h3><p>{n} {n > 1 ? 'imagens' : 'imagem'}</p></div>
        <div className="meta-r">
          <label className="check"><input type="checkbox" checked={tpl.pick} onChange={e => onPick(e.target.checked)} /> Selecionar</label>
          <button className="icon-btn" onClick={onDownload} aria-label={`Baixar ${name}`} title="Baixar"><IconDownload /></button>
        </div>
      </div>
    </article>
  );
}

export default function TemplateGrid({ tpls, env, onEdit, onPick, onExport }){
  const ref = useRef(null);
  const [W, setW] = useState(0);
  // Largura de desenho dos cards: a largura real do primeiro card na tela, em pixels do dispositivo
  useLayoutEffect(() => {
    const measure = () => {
      const th = ref.current.querySelector('.thumb'), cw = th ? th.clientWidth || 360 : 360;
      setW(clamp(Math.round(cw * (window.devicePixelRatio || 1)), 480, 960));
    };
    measure();
    let t = 0;
    const onResize = () => { clearTimeout(t); t = setTimeout(measure, 200); };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
  }, []);
  return (
    <section id="grid" className="grid" ref={ref}>
      {tpls.map((t, i) => <TemplateCard key={t.def.id} tpl={t} index={i} W={W} env={env} onEdit={() => onEdit(i)} onPick={on => onPick(i, on)} onDownload={() => onExport([i])} />)}
    </section>
  );
}
