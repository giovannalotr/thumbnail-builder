import { hex2rgb } from '../lib/util.js';

const PREV_BGS = [['auto', 'Automático (segue o tema)', null], ['branco', 'Branco', '#FFFFFF'], ['claro', 'Cinza claro', '#CFCCC7'], ['medio', 'Cinza médio', '#85817B'], ['grafite', 'Grafite', '#2E2C29'], ['preto', 'Preto', '#0B0B0B']];

/* Pinta o fundo da grade e do palco do editor; v é um id de PREV_BGS ou uma cor #rrggbb */
export function applyPrevBg(v){
  const hex = v.startsWith('#') ? v : (PREV_BGS.find(b => b[0] === v) || PREV_BGS[0])[2], root = document.documentElement.style;
  if (!hex){ ['--stage', '--stage-ink', '--stage-fg'].forEach(k => root.removeProperty(k)); return; }
  const [r, g, b] = hex2rgb(hex), light = (.299 * r + .587 * g + .114 * b) / 255 > .55;
  root.setProperty('--stage', hex);
  root.setProperty('--stage-ink', light ? 'rgba(30,26,22,.68)' : 'rgba(245,240,232,.72)');
  root.setProperty('--stage-fg', light ? '#2A2521' : '#F2ECE2');
}

export default function PreviewBgPicker({ value, onChange }){
  const custom = value.startsWith('#');
  return (
    <div className="bgpick">
      <span className="lbl">Fundo da prévia</span>
      {PREV_BGS.map(([id, name, c]) => (
        <button key={id} className={'bgs' + (id === 'auto' ? ' auto' : '') + (value === id ? ' on' : '')} style={c ? { background: c } : undefined}
          title={name} aria-label={`Fundo da prévia: ${name}`} aria-pressed={value === id} onClick={() => onChange(id)} />
      ))}
      <input type="color" className={custom ? 'on' : undefined} value={custom ? value : '#B9B3AA'} title="Outra cor" aria-label="Fundo da prévia: outra cor" onChange={e => onChange(e.target.value)} />
    </div>
  );
}
