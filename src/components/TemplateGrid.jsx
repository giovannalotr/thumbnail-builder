import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { needFonts } from '../lib/fonts.js';
import { renderTpl } from '../lib/render.js';
import { cancel, schedule } from '../lib/scheduler.js';
import { tplName } from '../lib/templates.js';
import { isDirty } from '../lib/userTemplates.js';
import { clamp } from '../lib/util.js';
import { useTr } from '../state.js';
import { Menu } from './controls.jsx';
import { IconDownload } from './icons.jsx';

function TemplateCard({ tpl, index, W, env, archived, onEdit, onPick, onDownload, onArchive, onDelete, onExportJson }){
  const tr = useTr(), ref = useRef(null);
  const { slots, texts, border } = tpl, n = slots.length, name = tplName(tpl);
  // Só fotos, textos, bordas, stills e filtro mudam o desenho; marcar o card não redesenha.
  useEffect(() => {
    if (!W) return;
    const key = 'card:' + tpl.key;
    let alive = true;
    const draw = () => { if (alive) schedule(key, () => renderTpl(tpl, index, W, Math.round(W * 9 / 16), env, { canvas: ref.current })); };
    draw();
    const p = needFonts(texts); if (p) p.then(draw);
    return () => { alive = false; cancel(key); };
  }, [slots, texts, border, index, W, env]);
  const badge = tpl.mine ? (isDirty(tpl) ? tr('card.unsaved') : '') : (tpl.edited ? tr('card.edited') : '');
  const items = [{ id: 'json', label: tr('card.exportJson'), run: onExportJson }];
  if (tpl.mine) items.push({ id: 'del', label: tr('card.delete'), confirm: tr('card.deleteConfirm'), danger: true, run: onDelete });
  else items.push({ id: 'arch', label: tr(archived ? 'card.unarchive' : 'card.archive'), run: onArchive });
  return (
    <article className={'card' + (tpl.pick ? ' picked' : '')}>
      <button className="thumb" onClick={onEdit} aria-label={tr('card.editLabel', { name })}>
        <canvas ref={ref} /><span className="edited" hidden={!badge}>{badge}</span><span className="open">{tr('card.edit')}</span>
      </button>
      <div className="meta">
        <div>
          <h3>{name}</h3>
          <p>{tr('card.images', { n })}{tpl.mine && ' · ' + tr('card.base', { name: tr('tpl.' + tpl.def.id) })}</p>
        </div>
        <div className="meta-r">
          {!archived && <label className="check"><input type="checkbox" checked={tpl.pick} onChange={e => onPick(e.target.checked)} /> {tr('card.select')}</label>}
          <Menu label={tr('card.menu', { name })} items={items} />
          <button className="icon-btn" onClick={onDownload} aria-label={tr('card.downloadLabel', { name })} title={tr('common.download')}><IconDownload /></button>
        </div>
      </div>
    </article>
  );
}

/* items: índices (em tpls) dos templates mostrados; o índice segue sendo a posição na lista completa */
export default function TemplateGrid({ tpls, items, archived, env, onEdit, onPick, onExport, onArchive, onDelete, onExportJson }){
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
    <section className="grid" ref={ref}>
      {items.map(i => (
        <TemplateCard key={tpls[i].key} tpl={tpls[i]} index={i} W={W} env={env} archived={archived}
          onEdit={() => onEdit(i)} onPick={on => onPick(i, on)} onDownload={() => onExport([i])}
          onArchive={() => onArchive(i, !archived)} onDelete={() => onDelete(i)} onExportJson={() => onExportJson(i)} />
      ))}
    </section>
  );
}
