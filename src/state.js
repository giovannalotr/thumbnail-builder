import { useMemo, useState } from 'react';
import { imgFor } from './lib/render.js';
import { sampleImages } from './lib/samples.js';
import { DEFS, makeTpl } from './lib/templates.js';

function readPrevBg(){ try { return localStorage.getItem('tb-prevbg') || 'auto'; } catch (e){ return 'auto'; } }
const initialState = () => ({
  images: sampleImages(), imgVer: 0, filter: 'natural', amt: 1, grain: 0, vig: 0, size: 1920, fmt: 'jpg',
  prevBg: readPrevBg(), tpls: DEFS.map(makeTpl),
});
const replaceAt = (a, i, v) => a.map((x, k) => k === i ? v : x);
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
   comparam slots, textos e bordas por referência para saber o que redesenhar. */
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
    removeImage: id => setState(s => ({ ...s, images: s.images.filter(i => i.id !== id), tpls: clearSlots(s.tpls, sl => sl.img === id), imgVer: s.imgVer + 1 })),
    setTpl: (i, fn) => setState(s => ({ ...s, tpls: replaceAt(s.tpls, i, fn(s.tpls[i])) })),
    editTpl: (i, fn) => setState(s => ({ ...s, tpls: replaceAt(s.tpls, i, { ...fn(s.tpls[i]), edited: true }) })),
    setPick: (i, pick) => setState(s => ({ ...s, tpls: replaceAt(s.tpls, i, { ...s.tpls[i], pick }) })),
    toggleAll: () => setState(s => { const all = s.tpls.every(t => t.pick); return { ...s, tpls: s.tpls.map(t => ({ ...t, pick: !all })) }; }),
    shuffleAll: () => setState(s => ({ ...s, tpls: s.tpls.map((t, ti) => shuffleTpl(t, ti, s.images)) })),
    borderAll: i => setState(s => ({ ...s, tpls: s.tpls.map((t, k) => k === i ? t : { ...t, border: { ...s.tpls[i].border }, edited: true }) })),
  }), []);
  return [state, actions];
}
