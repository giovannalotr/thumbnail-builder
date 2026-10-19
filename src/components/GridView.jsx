import { toast } from '../lib/toast.js';
import ColorFilter from './ColorFilter.jsx';
import PreviewBgPicker from './PreviewBgPicker.jsx';
import Stills from './Stills.jsx';
import TemplateGrid from './TemplateGrid.jsx';
import { IconDownload, IconShuffle } from './icons.jsx';

const SIZES = [1280, 1920, 2560, 3840];

export default function GridView({ state, actions, env, onEdit, onExport, onRemoveImage }){
  const { tpls } = state, n = tpls.filter(t => t.pick).length;
  const shuffleAll = () => {
    if (!state.images.length){ toast('Envie stills para embaralhar.'); return; }
    actions.shuffleAll(); toast('Imagens embaralhadas em todos os templates.');
  };
  return (
    <main id="gridView" className="gut">
      <section className="deck">
        <Stills images={state.images} onRemove={onRemoveImage} />
        <ColorFilter state={state} actions={actions} />
      </section>

      <section className="bar">
        <div className="bar-l">
          <h2>Templates</h2>
          <button className="btn ghost" onClick={actions.toggleAll}>{n === tpls.length ? 'Limpar seleção' : 'Selecionar todos'}</button>
          <span id="selCount">{n ? `${n} selecionado${n > 1 ? 's' : ''}` : ''}</span>
        </div>
        <div className="bar-r">
          <label className="note" htmlFor="expSize">Exportar</label>
          <select id="expSize" className="sel" value={state.size} onChange={e => actions.set('size', +e.target.value)}>
            {SIZES.map(w => <option key={w} value={w}>{w} × {w * 9 / 16}</option>)}
          </select>
          <select className="sel" aria-label="Formato" value={state.fmt} onChange={e => actions.set('fmt', e.target.value)}>
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
          </select>
          <button className="btn primary" disabled={!n} onClick={() => onExport(tpls.map((t, i) => t.pick ? i : -1).filter(i => i >= 0))}>
            <IconDownload />{n > 1 ? `Baixar ${n} selecionados` : 'Baixar selecionados'}
          </button>
        </div>
      </section>
      <div className="tools">
        <PreviewBgPicker value={state.prevBg} onChange={v => actions.set('prevBg', v)} />
        <button className="btn" onClick={shuffleAll}><IconShuffle />Embaralhar imagens</button>
      </div>
      <TemplateGrid tpls={tpls} env={env} onEdit={onEdit} onPick={actions.setPick} onExport={onExport} />
    </main>
  );
}
