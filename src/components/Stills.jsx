import { imgName } from '../lib/samples.js';
import { useTr } from '../state.js';

export default function Stills({ images, onFiles, onRemove }){
  const tr = useTr(), n = images.filter(i => !i.sample).length;
  return (
    <div className="block">
      <div className="block-head"><h2>{tr('stills.title')}</h2><span className="note">{n ? tr('stills.count', { n }) : tr('stills.formats')}</span></div>
      <div className="sample-flag" hidden={!images.some(i => i.sample)}>{tr('stills.samples')}</div>
      <div className="tray">
        {images.map(i => (
          <div className="still" key={i.id} title={imgName(i)}>
            <img src={i.thumb} alt={imgName(i)} /><span className="res">{i.w}×{i.h}</span>
            <button className="x" onClick={() => onRemove(i.id)} aria-label={tr('stills.remove', { name: imgName(i) })}>×</button>
          </div>
        ))}
        <label className="add" htmlFor="file">{tr('stills.add')}</label>
        <input id="file" type="file" accept="image/*" multiple hidden onChange={e => { if (e.target.files.length) onFiles(e.target.files); e.target.value = ''; }} />
      </div>
    </div>
  );
}
