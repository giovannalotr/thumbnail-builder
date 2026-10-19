import { useMemo, useState, useSyncExternalStore } from 'react';
import { getLang, onLang, tr } from './lib/i18n.js';
import { imgFor } from './lib/render.js';
import { DEFS, makeTpl } from './lib/templates.js';
import { readEdited, readMine, saveMine } from './lib/userTemplates.js';

function readPrevBg(){ try { return localStorage.getItem('tb-prevbg') || 'auto'; } catch (e){ return 'auto'; } }
function readArchived(){
  try { const v = JSON.parse(localStorage.getItem('tb-archived') || '[]'); return Array.isArray(v) ? v.filter(id => DEFS.some(d => d.id === id)) : []; } catch (e){ return []; }
}
/* Templates padrão com as edições guardadas da última visita */
function readDefaults(){
  const edits = readEdited();
  return DEFS.map(d => {
    const t = makeTpl(d), e = edits[d.id];
    return e ? { ...t, slots: e.slots.map(s => ({ img: null, ...s })), texts: e.texts, border: e.border, edited: true } : t;
  });
}
const initialState = () => ({
  images: [], imgVer: 0, filter: 'natural', amt: 1, grain: 0, vig: 0, size: 1920, fmt: 'jpg',
  prevBg: readPrevBg(), tpls: [...readDefaults(), ...readMine()], archived: readArchived(), showArchived: false,
});
const replaceAt = (a, i, v) => a.map((x, k) => k === i ? v : x);
const isArchived = (s, t) => s.archived.includes(t.key);
const clearSlots = (tpls, test) => tpls.map(t => t.slots.some(test) ? { ...t, slots: t.slots.map(sl => test(sl) ? { ...sl, img: null } : sl) } : t);

function shuffled(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
/* Sorteia stills para os espaços do template, evitando repetir a combinação atual */
export function shuffleTpl(t, ti, images){
  if (!images.length) return t;
  const ids = x => x.slots.map((_, i) => (imgFor(x, i, images, ti) || {}).id).join('|'), before = ids(t);
  let out = t;
  for (let tries = 0; tries < 8; tries++){
    let pool = [];
    while (pool.length < t.slots.length) pool = pool.concat(shuffled(images));
    out = { ...t, slots: t.slots.map((sl, i) => ({ ...sl, img: pool[i].id, zoom: 1, px: 0, py: 0, flip: false })) };
    if (images.length < 2 || ids(out) !== before) break;
  }
  return out;
}

/* Estado do app inteiro. Toda mudança gera objetos novos, então os componentes
   comparam slots, textos e bordas por referência para saber o que redesenhar.
   tpls tem os 12 templates padrão e, depois deles, os de "Meus templates" (mine: true);
   cada um tem uma key fixa. archived guarda as keys dos templates padrão arquivados;
   as ações em lote (embaralhar, aplicar bordas) não mexem neles, e a grade não oferece selecioná-los. */
export function useStore(){
  const [state, setState] = useState(initialState);
  const actions = useMemo(() => ({
    set: (k, v) => setState(s => ({ ...s, [k]: v })),
    addImages: added => setState(s => {
      const hadSamples = s.images.some(i => i.sample);
      const images = hadSamples ? s.images.filter(i => !i.sample) : s.images;
      const tpls = hadSamples ? clearSlots(s.tpls, sl => sl.img && sl.img.startsWith('ex-')) : s.tpls;
      return { ...s, images: [...images, ...added], tpls, imgVer: s.imgVer + 1 };
    }),
    // As fotos de exemplo chegam depois do primeiro desenho; se a pessoa já enviou stills, ficam de fora
    addSamples: list => setState(s => s.images.length ? s : { ...s, images: list, imgVer: s.imgVer + 1 }),
    removeImage: id => setState(s => ({ ...s, images: s.images.filter(i => i.id !== id), tpls: clearSlots(s.tpls, sl => sl.img === id), imgVer: s.imgVer + 1 })),
    setTpl: (i, fn) => setState(s => ({ ...s, tpls: replaceAt(s.tpls, i, fn(s.tpls[i])) })),
    editTpl: (i, fn) => setState(s => ({ ...s, tpls: replaceAt(s.tpls, i, { ...fn(s.tpls[i]), edited: true }) })),
    setPick: (i, pick) => setState(s => ({ ...s, tpls: replaceAt(s.tpls, i, { ...s.tpls[i], pick }) })),
    pickAll: (keys, pick) => setState(s => ({ ...s, tpls: s.tpls.map(t => keys.includes(t.key) ? { ...t, pick } : t) })),
    shuffleAll: () => setState(s => ({ ...s, tpls: s.tpls.map((t, ti) => isArchived(s, t) ? t : shuffleTpl(t, ti, s.images)) })),
    borderAll: i => setState(s => ({ ...s, tpls: s.tpls.map((t, k) => k === i || isArchived(s, t) ? t : { ...t, border: { ...s.tpls[i].border }, edited: true }) })),
    // Template arquivado sai da seleção, para não entrar no "Baixar selecionados"
    archive: (i, on) => setState(s => {
      const t = s.tpls[i], archived = s.archived.filter(k => k !== t.key);
      if (on) archived.push(t.key);
      return { ...s, archived, tpls: on && t.pick ? replaceAt(s.tpls, i, { ...t, pick: false }) : s.tpls };
    }),
    addTemplates: added => setState(s => ({ ...s, tpls: [...s.tpls, ...added] })),
    saveTemplate: i => setState(s => ({ ...s, tpls: replaceAt(s.tpls, i, saveMine(s.tpls[i])) })),
    renameTemplate: (i, name) => setState(s => ({ ...s, tpls: replaceAt(s.tpls, i, { ...s.tpls[i], name }) })),
    removeTemplate: key => setState(s => ({ ...s, tpls: s.tpls.filter(t => t.key !== key) })),
  }), []);
  return [state, actions];
}

/* Tradução para componentes: devolve tr e redesenha o componente quando o idioma muda */
export function useTr(){ useSyncExternalStore(onLang, getLang); return tr; }
