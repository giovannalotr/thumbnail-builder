import { saveFile } from '../lib/exporter.js';
import { tplName } from '../lib/templates.js';
import { toast } from '../lib/toast.js';
import { makeMine, parseTemplateFile, templateFile } from '../lib/userTemplates.js';
import { slug } from '../lib/util.js';
import { useTr } from '../state.js';
import ColorFilter from './ColorFilter.jsx';
import PreviewBgPicker from './PreviewBgPicker.jsx';
import Stills from './Stills.jsx';
import TemplateGrid from './TemplateGrid.jsx';
import { IconDownload, IconShuffle, IconUpload } from './icons.jsx';

const SIZES = [1280, 1920, 2560, 3840];

export default function GridView({ state, actions, env, onEdit, onExport, onFiles, onRemoveImage }){
  const tr = useTr(), { tpls } = state, n = tpls.filter(t => t.pick).length;
  const idx = tpls.map((_, i) => i), mine = idx.filter(i => tpls[i].mine), defs = idx.filter(i => !tpls[i].mine);
  const live = defs.filter(i => !state.archived.includes(tpls[i].key)), arch = defs.filter(i => !live.includes(i)), selectable = mine.length + live.length;
  const shuffleAll = () => {
    if (!state.images.length){ toast(tr('shuffle.noStills')); return; }
    actions.shuffleAll(); toast(tr('grid.shuffled'));
  };
  const archive = (i, on) => {
    actions.archive(i, on);
    toast(tr(on ? 'card.archivedToast' : 'card.unarchivedToast', { name: tplName(tpls[i]) }));
  };
  const remove = i => { actions.removeTemplate(tpls[i].key); toast(tr('mine.deleted', { name: tplName(tpls[i]) })); };
  const exportJson = i => {
    const file = `template-${slug(tplName(tpls[i])) || 'thumb'}.json`;
    saveFile(file, new Blob([templateFile(tpls[i])], { type: 'application/json' }));
    toast(tr('card.exported', { file }));
  };
  async function importFiles(files){
    const added = [], failed = [];
    for (const f of files){
      try { const d = parseTemplateFile(await f.text()); added.push(makeMine({ ...d, name: d.name || f.name.replace(/\.json$/i, '') })); }
      catch (e){ failed.push(f.name); }
    }
    if (added.length) actions.addTemplates(added);
    if (failed.length) toast(tr('mine.importFailed', { names: failed.join(', ') }), 4200);
    else toast(tr('mine.imported', { n: added.length }));
  }
  const cardProps = { tpls, env, onEdit, onPick: actions.setPick, onExport, onArchive: archive, onDelete: remove, onExportJson: exportJson };
  return (
    <main id="gridView" className="gut">
      <section className="deck">
        <Stills images={state.images} onFiles={onFiles} onRemove={onRemoveImage} />
        <ColorFilter state={state} actions={actions} />
      </section>

      <section className="bar">
        <div className="bar-l">
          <h2>{tr('grid.title')}</h2>
          <button className="btn ghost" disabled={!selectable} onClick={actions.toggleAll}>{tr(selectable && n === selectable ? 'grid.clearSelection' : 'grid.selectAll')}</button>
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
      <section className="lib">
        <div className="lib-head">
          <h3>{tr('grid.mine')}</h3>{mine.length > 0 && <span className="note">{tr('lib.count', { n: mine.length })}</span>}
          <label className="btn" htmlFor="tplFile"><IconUpload />{tr('mine.import')}</label>
          <input id="tplFile" type="file" accept=".json,application/json" multiple hidden onChange={e => { if (e.target.files.length) importFiles([...e.target.files]); e.target.value = ''; }} />
        </div>
        {mine.length ? <TemplateGrid {...cardProps} items={mine} /> : <p className="note lib-empty">{tr('mine.empty')}</p>}
      </section>
      <section className="lib">
        <div className="lib-head"><h3>{tr('grid.defaults')}</h3></div>
        {live.length ? <TemplateGrid {...cardProps} items={live} /> : <p className="note lib-empty">{tr('grid.allArchived')}</p>}
      </section>
      {arch.length > 0 && (
        <section className="lib">
          <div className="lib-head">
            <h3>{tr('archived.title')}</h3><span className="note">{tr('lib.count', { n: arch.length })}</span>
            <button className="btn ghost" aria-expanded={state.showArchived} onClick={() => actions.set('showArchived', !state.showArchived)}>{tr(state.showArchived ? 'archived.hide' : 'archived.show')}</button>
          </div>
          {state.showArchived && <TemplateGrid {...cardProps} items={arch} archived />}
        </section>
      )}
    </main>
  );
}
