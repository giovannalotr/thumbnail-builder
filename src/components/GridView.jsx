import { tplName } from '../lib/templates.js';
import { toast } from '../lib/toast.js';
import { useTr } from '../state.js';
import ColorFilter from './ColorFilter.jsx';
import PreviewBgPicker from './PreviewBgPicker.jsx';
import Stills from './Stills.jsx';
import TemplateGrid from './TemplateGrid.jsx';
import { IconDownload, IconShuffle } from './icons.jsx';

const SIZES = [1280, 1920, 2560, 3840];

export default function GridView({ state, actions, env, onEdit, onExport, onFiles, onRemoveImage }){
  const tr = useTr(), { tpls } = state, n = tpls.filter(t => t.pick).length;
  const idx = tpls.map((_, i) => i), live = idx.filter(i => !state.archived.includes(tpls[i].def.id)), arch = idx.filter(i => !live.includes(i));
  const shuffleAll = () => {
    if (!state.images.length){ toast(tr('shuffle.noStills')); return; }
    actions.shuffleAll(); toast(tr('grid.shuffled'));
  };
  const archive = (i, on) => {
    actions.archive(i, on);
    toast(tr(on ? 'card.archivedToast' : 'card.unarchivedToast', { name: tplName(tpls[i]) }));
  };
  return (
    <main id="gridView" className="gut">
      <section className="deck">
        <Stills images={state.images} onFiles={onFiles} onRemove={onRemoveImage} />
        <ColorFilter state={state} actions={actions} />
      </section>

      <section className="bar">
        <div className="bar-l">
          <h2>{tr('grid.title')}</h2>
          <button className="btn ghost" disabled={!live.length} onClick={actions.toggleAll}>{tr(live.length && n === live.length ? 'grid.clearSelection' : 'grid.selectAll')}</button>
          <span id="selCount">{n ? tr('grid.selected', { n }) : ''}</span>
        </div>
        <div className="bar-r">
          <label className="note" htmlFor="expSize">{tr('grid.export')}</label>
          <select id="expSize" className="sel" value={state.size} onChange={e => actions.set('size', +e.target.value)}>
            {SIZES.map(w => <option key={w} value={w}>{w} × {w * 9 / 16}</option>)}
          </select>
          <select className="sel" aria-label={tr('grid.format')} value={state.fmt} onChange={e => actions.set('fmt', e.target.value)}>
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
          </select>
          <button className="btn primary" disabled={!n} onClick={() => onExport(tpls.map((t, i) => t.pick ? i : -1).filter(i => i >= 0))}>
            <IconDownload />{n > 1 ? tr('grid.downloadN', { n }) : tr('grid.download')}
          </button>
        </div>
      </section>
      <div className="tools">
        <PreviewBgPicker value={state.prevBg} onChange={v => actions.set('prevBg', v)} />
        <button className="btn" onClick={shuffleAll}><IconShuffle />{tr('grid.shuffle')}</button>
      </div>
      {live.length
        ? <TemplateGrid tpls={tpls} items={live} env={env} onEdit={onEdit} onPick={actions.setPick} onExport={onExport} onArchive={archive} />
        : <p className="note">{tr('grid.allArchived')}</p>}
      {arch.length > 0 && (
        <section className="arch">
          <div className="bar">
            <div className="bar-l"><h2>{tr('archived.title')}</h2><span className="note">{tr('archived.count', { n: arch.length })}</span></div>
            <button className="btn ghost" aria-expanded={state.showArchived} onClick={() => actions.set('showArchived', !state.showArchived)}>{tr(state.showArchived ? 'archived.hide' : 'archived.show')}</button>
          </div>
          {state.showArchived && <TemplateGrid tpls={tpls} items={arch} archived env={env} onEdit={onEdit} onExport={onExport} onArchive={archive} />}
        </section>
      )}
    </main>
  );
}
