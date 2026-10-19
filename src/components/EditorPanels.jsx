import { Fragment, useId } from 'react';
import { FCATS, FONTS, fontByName } from '../lib/fonts.js';
import { imgFor } from '../lib/render.js';
import { makeText } from '../lib/templates.js';
import { TEXTURES } from '../lib/textures.js';
import { getIn, patchIn } from '../lib/util.js';
import { Range, Seg, Swatches, TexSwatch } from './controls.jsx';

const TEXT_COLORS = ['#FFFFFF', '#F7EFDF', '#F3E7C9', '#E8D3A9', '#CDB48C', '#8C6E52', '#5B4334', '#2E2621'];
const SHADOW_COLORS = ['#1E1610', '#000000', '#4A3222', '#FFF4E0'];
const BOX_COLORS = ['#1E1A16', '#3A2E25', '#4B5638', '#6B5544', '#EFE6D4', '#FFFFFF'];
const BORDER_COLORS = [['Off-white', '#F7F4EE'], ['Creme', '#F3EDE1'], ['Linho', '#EDE6D6'], ['Pergaminho', '#EFE4CC'], ['Areia', '#E3D5BC'], ['Aveia', '#D9CBB0'], ['Kraft', '#C8B08A'], ['Sálvia', '#BDBFA4'], ['Taupe', '#A89A86'], ['Cacau', '#6B5544'], ['Nogueira', '#4A3A2F'], ['Grafite quente', '#33302C']];
const WEIGHTS = { 300: 'Leve', 400: 'Regular', 500: 'Médio', 600: 'Seminegrito', 700: 'Negrito', 800: 'Extra' };
const family = font => `'${font}',Georgia,serif`;

/* Controle deslizante ligado a um caminho do template, como "texts.0.size" */
const bindRange = (tpl, setPath) => (label, path, min, max, step, fmt) =>
  <Range label={label} value={getIn(tpl, path)} min={min} max={max} step={step} fmt={fmt} onChange={v => setPath(path, v)} />;

export function ImagesPanel({ tpl, index, images, slotSel, setSlotSel, edit, setPath }){
  if (!images.length) return <p className="note">Envie stills para preencher este template.</p>;
  const R = bindRange(tpl, setPath);
  const patchSlot = (k, fn) => { edit(t => patchIn(t, `slots.${k}`, fn(t.slots[k]))); setSlotSel(k); };
  return (
    <div className="sec">
      <div className="sec-h"><h4>Fotos do template</h4></div>
      {tpl.slots.map((sl, k) => {
        const c = imgFor(tpl, k, images, index), p = `slots.${k}`;
        return (
          <div key={k} className={'slot' + (k === slotSel ? ' on' : '')} data-slot={k}>
            <div className="sec-h"><strong>Imagem {k + 1}</strong><span className="note">{c ? c.name : ''}</span></div>
            <div className="pick">
              {images.map(im => (
                <button key={im.id} className={'pk' + (c && c.id === im.id ? ' on' : '')} title={im.name} onClick={() => patchSlot(k, () => ({ img: im.id, zoom: 1, px: 0, py: 0 }))}>
                  <img src={im.thumb} alt="" />
                </button>
              ))}
            </div>
            {R('Zoom', p + '.zoom', 1, 4, .01, 'x')}
            <div className="two">{R('Horizontal', p + '.px', -1, 1, .01, 'off')}{R('Vertical', p + '.py', -1, 1, .01, 'off')}</div>
            <div className="row">
              <button className={'mini' + (sl.flip ? ' on' : '')} onClick={() => patchSlot(k, s => ({ flip: !s.flip }))}>Espelhar</button>
              <button className="mini" onClick={() => patchSlot(k, () => ({ px: 0, py: 0, zoom: 1 }))}>Centralizar</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TextsPanel({ tpl, textSel, setTextSel, fontOpen, setFontOpen, edit, setPath, boxesRef }){
  const uid = useId();
  const L = tpl.texts[textSel], p = `texts.${textSel}`, R = bindRange(tpl, setPath);
  const addText = () => {
    edit(t => ({ ...t, texts: [...t.texts, makeText({ text: 'novo texto', font: 'Cormorant Garamond', italic: true, weight: 500, size: 64, y: .5 })] }));
    setTextSel(tpl.texts.length); setFontOpen(false);
  };
  const delText = () => { edit(t => ({ ...t, texts: t.texts.filter((_, k) => k !== textSel) })); setTextSel(Math.max(0, textSel - 1)); };
  const list = (
    <div className="sec">
      <div className="sec-h"><h4>Textos</h4></div>
      <div className="layers">
        {tpl.texts.map((T, k) => (
          <button key={k} className={'layer' + (k === textSel ? ' on' : '')} onClick={() => { setTextSel(k); setFontOpen(false); }}>
            <span className="lt" style={{ fontFamily: family(T.font), fontStyle: T.italic ? 'italic' : 'normal', fontWeight: T.weight }}>{T.text.split('\n')[0] || '(vazio)'}</span>
            <span className="lf">{T.font}</span>
          </button>
        ))}
      </div>
      <div className="row">
        <button className="mini" onClick={addText}>+ Novo texto</button>
        {tpl.texts.length > 0 && <button className="mini danger" onClick={delText}>Remover texto</button>}
      </div>
    </div>
  );
  if (!L) return list;

  const f = fontByName(L.font), canItal = f.iw.includes(L.weight) || L.italic, bm = L.box.mode;
  const setFont = x => {
    edit(t => {
      const T = t.texts[textSel];
      let weight = T.weight;
      if (!x.w.includes(weight)) weight = x.w.reduce((a, w) => Math.abs(w - weight) < Math.abs(a - weight) ? w : a, x.w[0]);
      return patchIn(t, p, { font: x.n, weight, italic: T.italic && x.iw.includes(weight) });
    });
    setFontOpen(false);
  };
  const setWeight = w => edit(t => { const T = t.texts[textSel]; return patchIn(t, p, { weight: w, italic: T.italic && fontByName(T.font).iw.includes(w) }); });
  // Ao trocar o alinhamento, o texto fica no mesmo lugar: a âncora passa para a borda escolhida
  const setAlign = v => {
    const bb = boxesRef.current[textSel];
    edit(t => patchIn(t, p, bb ? { align: v, x: v === 'center' ? bb.x + bb.w / 2 : v === 'left' ? bb.x : bb.x + bb.w } : { align: v }));
  };
  return (
    <>
      {list}
      <div className="hr" />
      <div className="sec">
        <div className="field"><label htmlFor={uid + 'text'}>Texto</label><textarea id={uid + 'text'} rows={2} value={L.text} onChange={e => setPath(p + '.text', e.target.value)} /></div>
        <div className="field">
          <label>Fonte</label>
          <button className="fpick" aria-expanded={fontOpen} onClick={() => setFontOpen(!fontOpen)}>
            <span className="fn" style={{ fontFamily: family(L.font), fontStyle: L.italic ? 'italic' : 'normal' }}>{L.font}</span>
            <span className="chev">{fontOpen ? 'fechar' : 'trocar'}</span>
          </button>
          {fontOpen && (
            <div className="flist" role="listbox">
              {FCATS.map(([k, lab]) => (
                <Fragment key={k}>
                  <div className="fgroup">{lab}</div>
                  {FONTS.filter(x => x.c === k).map(x => (
                    <button key={x.n} className={'fopt' + (x.n === L.font ? ' on' : '')} role="option" aria-selected={x.n === L.font} onClick={() => setFont(x)}>
                      <span className="fs" style={{ fontFamily: family(x.n) }}>{(L.text.split('\n')[0] || x.n).slice(0, 28)}</span>
                      <span className="fl">{x.n}</span>
                    </button>
                  ))}
                </Fragment>
              ))}
            </div>
          )}
        </div>
        <div className="two">
          <div className="field">
            <label htmlFor={uid + 'weight'}>Peso</label>
            <select id={uid + 'weight'} value={L.weight} onChange={e => setWeight(+e.target.value)}>
              {f.w.map(w => <option key={w} value={w}>{WEIGHTS[w] || w}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Estilo</label>
            <label className="tog" aria-disabled={canItal ? undefined : 'true'} style={canItal ? undefined : { opacity: .45 }}>
              <input type="checkbox" checked={L.italic} disabled={!canItal} onChange={e => setPath(p + '.italic', e.target.checked)} /> Itálico
            </label>
          </div>
        </div>
        {R('Tamanho', p + '.size', 12, 320, 1, 'px')}
        <div className="field"><label>Cor</label><Swatches value={L.color} colors={TEXT_COLORS} onChange={v => setPath(p + '.color', v)} /></div>
        <div className="two">{R('Entre letras', p + '.ls', -.05, .5, .005, 'em')}{R('Entre linhas', p + '.lh', .6, 1.8, .01, 'x')}</div>
        <div className="field"><label>Alinhamento</label><Seg value={L.align} options={[['left', 'Esquerda'], ['center', 'Centro'], ['right', 'Direita']]} onChange={setAlign} /></div>
        <div className="two">{R('Posição horizontal', p + '.x', 0, 1, .001, 'pos')}{R('Posição vertical', p + '.y', 0, 1, .001, 'pos')}</div>
        <div className="row">
          <button className="mini" onClick={() => edit(t => patchIn(t, p, { align: 'center', x: .5 }))}>Centralizar na horizontal</button>
          <button className="mini" onClick={() => setPath(p + '.y', .5)}>Na vertical</button>
        </div>
      </div>
      <div className="hr" />
      <div className="sec">
        <div className="sec-h"><h4>Sombra</h4><label className="tog"><input type="checkbox" checked={L.shadow.on} onChange={e => setPath(p + '.shadow.on', e.target.checked)} /> Ativar</label></div>
        <div className="sub" aria-disabled={!L.shadow.on}>
          <div className="field"><label>Cor da sombra</label><Swatches value={L.shadow.color} colors={SHADOW_COLORS} onChange={v => setPath(p + '.shadow.color', v)} /></div>
          <div className="two">{R('Desfoque', p + '.shadow.blur', 0, 80, 1, 'px')}{R('Opacidade', p + '.shadow.op', 0, 1, .01, 'pct')}</div>
          <div className="two">{R('Distância X', p + '.shadow.ox', -30, 30, 1, 'px')}{R('Distância Y', p + '.shadow.oy', -30, 30, 1, 'px')}</div>
        </div>
      </div>
      <div className="hr" />
      <div className="sec">
        <div className="sec-h"><h4>Fundo do texto</h4></div>
        <Seg value={bm} options={[['none', 'Nenhum'], ['box', 'Caixa'], ['band-h', 'Faixa ↔'], ['band-v', 'Faixa ↕']]} onChange={v => setPath(p + '.box.mode', v)} />
        <div className="sub" aria-disabled={bm === 'none'}>
          <div className="field"><label>Cor do vidro</label><Swatches value={L.box.color} colors={BOX_COLORS} onChange={v => setPath(p + '.box.color', v)} /></div>
          <div className="two">{R('Opacidade da cor', p + '.box.op', 0, 1, .01, 'pct')}{R('Fosco (desfoque)', p + '.box.blur', 0, 40, 1, 'px')}</div>
          <div className="two">{R(bm === 'band-h' ? 'Largura (faixa)' : 'Largura extra', p + '.box.px', 0, 200, 1, 'px')}{R(bm === 'band-v' ? 'Altura (faixa)' : 'Altura extra', p + '.box.py', 0, 140, 1, 'px')}</div>
          {bm === 'box' && R('Cantos', p + '.box.r', 0, 60, 1, 'px')}
          <label className="tog"><input type="checkbox" checked={L.box.line} onChange={e => setPath(p + '.box.line', e.target.checked)} /> Contorno fino</label>
        </div>
      </div>
    </>
  );
}

export function BordersPanel({ tpl, edit, setPath, onBorderAll }){
  const b = tpl.border, multi = tpl.slots.length > 1, bl = multi && b.blend > 0, R = bindRange(tpl, setPath);
  const spacer = JSON.stringify(tpl.def.layout).includes('"x"');
  const setBlend = on => edit(t => {
    const nb = { ...t.border };
    if (!on && nb.blend > 0) nb.lastBlend = nb.blend;
    nb.blend = on ? (nb.blend || nb.lastBlend || 140) : 0;
    return { ...t, border: nb };
  });
  return (
    <>
      {multi && (
        <>
          <div className="sec">
            <div className="sec-h"><h4>Entre as imagens</h4></div>
            <Seg value={bl ? '1' : '0'} options={[['0', 'Com bordas'], ['1', 'Transição suave']]} onChange={v => setBlend(v === '1')} />
            {bl && <>{R('Suavidade da transição', 'border.blend', 20, 360, 1, 'px')}<p className="note">As fotos se fundem umas nas outras. Moldura, espaço entre imagens e cantos ficam desativados enquanto a transição suave estiver ligada.</p></>}
          </div>
          <div className="hr" />
        </>
      )}
      {!bl && (
        <>
          <div className="sec">
            <div className="sec-h"><h4>Espessura</h4></div>
            {R('Moldura externa', 'border.outer', 0, 90, 1, 'px')}
            {multi && R('Entre as imagens', 'border.gap', 0, 60, 1, 'px')}
            {R('Cantos das imagens', 'border.radius', 0, 48, 1, 'px')}
            <p className="note">Use a moldura, o espaço entre imagens ou os dois. Com 0 px a borda some.</p>
          </div>
          <div className="hr" />
        </>
      )}
      {!(bl && !spacer) && (
        <>
          <div className="sec">
            <div className="sec-h"><h4>{bl ? 'Cor da faixa' : 'Cor'}</h4></div>
            <div className="sw">
              {BORDER_COLORS.map(([n, c]) => (
                <button key={c} className={'swl' + (b.color.toLowerCase() === c.toLowerCase() ? ' on' : '')} onClick={() => setPath('border.color', c)}>
                  <i style={{ background: c }} /><span>{n}</span>
                </button>
              ))}
            </div>
            <div className="row"><input type="color" value={b.color} onChange={e => setPath('border.color', e.target.value)} aria-label="Escolher qualquer cor" /><span className="note">Qualquer outra cor</span></div>
          </div>
          <div className="hr" />
          <div className="sec">
            <div className="sec-h"><h4>Textura</h4></div>
            <div className="texgrid">
              {TEXTURES.map(x => (
                <button key={x.id} className={'tex' + (b.tex === x.id ? ' on' : '')} onClick={() => setPath('border.tex', x.id)}>
                  <TexSwatch id={x.id} color={b.color} amt={b.amt} /><span>{x.name}</span>
                </button>
              ))}
            </div>
            {b.tex !== 'none' && R('Intensidade da textura', 'border.amt', 0, 1, .01, 'pct')}
          </div>
          <div className="hr" />
        </>
      )}
      <button className="btn" onClick={onBorderAll}>Aplicar {bl ? 'esta transição' : 'estas bordas'} a todos os templates</button>
    </>
  );
}
