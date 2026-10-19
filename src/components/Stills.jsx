import { imgName } from '../lib/samples.js';
import { useTr } from '../state.js';

export default function Stills({ images, loading, onFiles, onRemove }){
  const tr = useTr(), n = images.filter(i => !i.sample).length;
  return (
    <div className="block wide">
      <div className="block-head start"><h2>{tr('stills.title')}</h2><span className="note">{loading.length ? tr('files.loading', { n: loading.length }) : n ? tr('stills.count', { n }) : tr('stills.formats')}</span></div>
      <div className="sample-flag" hidden={!images.some(i => i.sample)}>{tr('stills.samples')}</div>
      <div className="tray">
        {images.map(i => (
          <div className="still" key={i.id} title={i.sample ? `${imgName(i)} — ${tr('stills.credit', { author: i.author })}` : imgName(i)}>
            <img src={i.thumb} alt={imgName(i)} /><span className="res">{i.w}×{i.h}</span>
            <button className="x" onClick={() => onRemove(i.id)} aria-label={tr('stills.remove', { name: imgName(i) })}>×</button>
          </div>
        ))}
        {loading.map(l => (
          <div className="still skel" key={l.id} title={l.name} role="status" aria-label={tr('stills.loadingOne', { name: l.name })}><span className="res">{l.name}</span></div>
        ))}
        <label className="add" htmlFor="file">{tr('stills.add')}</label>
        <input id="file" type="file" accept="image/*" multiple hidden onChange={e => { if (e.target.files.length) onFiles(e.target.files); e.target.value = ''; }} />
      </div>
    </div>
  );
}
