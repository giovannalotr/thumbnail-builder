import { hex2rgb } from '../lib/util.js';
import { useTr } from '../state.js';

const PREV_BGS = [['auto', null], ['branco', '#FFFFFF'], ['claro', '#CFCCC7'], ['medio', '#85817B'], ['grafite', '#2E2C29'], ['preto', '#0B0B0B']];

/* Pinta o fundo da grade e do palco do editor; v é um id de PREV_BGS ou uma cor #rrggbb */
export function applyPrevBg(v){
  const hex = v.startsWith('#') ? v : (PREV_BGS.find(b => b[0] === v) || PREV_BGS[0])[1], root = document.documentElement.style;
  if (!hex){ ['--stage', '--stage-ink', '--stage-fg'].forEach(k => root.removeProperty(k)); return; }
  const [r, g, b] = hex2rgb(hex), light = (.299 * r + .587 * g + .114 * b) / 255 > .55;
  root.setProperty('--stage', hex);
  root.setProperty('--stage-ink', light ? 'rgba(30,26,22,.68)' : 'rgba(245,240,232,.72)');
  root.setProperty('--stage-fg', light ? '#2A2521' : '#F2ECE2');
}

export default function PreviewBgPicker({ value, onChange }){
  const tr = useTr(), custom = value.startsWith('#');
  return (
    <div className="bgpick">
      <span className="lbl">{tr('prevBg.label')}</span>
      {PREV_BGS.map(([id, c]) => (
        <button key={id} className={'bgs' + (id === 'auto' ? ' auto' : '') + (value === id ? ' on' : '')} style={c ? { background: c } : undefined}
          title={tr('prevBg.' + id)} aria-label={tr('prevBg.option', { name: tr('prevBg.' + id) })} aria-pressed={value === id} onClick={() => onChange(id)} />
      ))}
      <input type="color" className={custom ? 'on' : undefined} value={custom ? value : '#B9B3AA'} title={tr('prevBg.custom')} aria-label={tr('prevBg.customLabel')} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
