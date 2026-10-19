import { fontByName } from './fonts.js';
import { FILTERS, makeFilter } from './grade.js';
import { tr } from './i18n.js';
import { DEFS, countSlots, makeBorder, makeText, tplName } from './templates.js';
import { TEXTURES } from './textures.js';
import { clamp } from './util.js';

/* "Meus templates": cópias salvas de um template padrão (base), guardadas no localStorage
   e exportadas/importadas como .json. As stills não fazem parte do template: os espaços
   guardam só zoom, posição e espelhamento. */
export const FORMAT = 'thumb-builder-template';
const VERSION = 1, STORE = 'tb-mine';

/* Faixas aceitas ao ler um template (as mesmas dos controles do editor); valores fora delas são trazidos para dentro */
const SLOT = { zoom: [1, 4], px: [-1, 1], py: [-1, 1] };
const TEXT = { weight: [100, 900], size: [12, 320], ls: [-.05, .5], lh: [.6, 1.8], x: [0, 1], y: [0, 1] };
const SHADOW = { blur: [0, 80], ox: [-30, 30], oy: [-30, 30], op: [0, 1] };
const BOX = { op: [0, 1], blur: [0, 40], px: [0, 200], py: [0, 140], ox: [-200, 200], oy: [-150, 150], r: [0, 60] };
const BORDER = { outer: [0, 90], gap: [0, 60], radius: [0, 48], amt: [0, 1], blend: [0, 360] };
const FILTER = { amt: [0, 1.5], grain: [0, 1], vig: [0, 1] };
const ENUM = { align: ['left', 'center', 'right'], mode: ['none', 'box', 'band-h', 'band-v'], tex: TEXTURES, id: FILTERS.map(f => f.id) };
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/* Parte de base e copia de src só as chaves que base tem, com o mesmo tipo e dentro das faixas */
function pick(base, src, ranges){
  const out = { ...base };
  if (!src || typeof src !== 'object') return out;
  for (const k of Object.keys(base)){
    const v = src[k], d = base[k];
    if (typeof d === 'number' && typeof v === 'number' && Number.isFinite(v)) out[k] = ranges[k] ? clamp(v, ...ranges[k]) : v;
    else if (typeof d === 'boolean' && typeof v === 'boolean') out[k] = v;
    else if (typeof d === 'string' && typeof v === 'string' && (ENUM[k] ? ENUM[k].includes(v) : k !== 'color' || HEX.test(v))) out[k] = v;
  }
  return out;
}
function readText(o){
  const d = makeText({}), L = { ...pick(d, o, TEXT), shadow: pick(d.shadow, o && o.shadow, SHADOW), box: pick(d.box, o && o.box, BOX) };
  // Fonte fora da lista vira a padrão; peso e itálico precisam existir na fonte, como no seletor do editor
  const f = fontByName(L.font);
  L.font = f.n;
  if (!f.w.includes(L.weight)) L.weight = f.w.reduce((a, w) => Math.abs(w - L.weight) < Math.abs(a - L.weight) ? w : a, f.w[0]);
  if (L.italic && !f.iw.includes(L.weight)) L.italic = false;
  return L;
}

/* Lê os dados de um template (de arquivo ou do localStorage); lança erro se não der para usar */
function readTemplate(o){
  const def = o && typeof o === 'object' && DEFS.find(d => d.id === o.base);
  if (!def) throw new Error('base');
  const n = countSlots(def.layout);
  if (!Array.isArray(o.slots) || o.slots.length !== n || !Array.isArray(o.texts)) throw new Error('shape');
  const name = typeof o.name === 'string' ? o.name.trim().slice(0, 80) : '';
  return { name, base: def.id, slots: o.slots.map(s => pick({ zoom: 1, px: 0, py: 0, flip: false }, s, SLOT)), texts: o.texts.slice(0, 40).map(readText), border: pick(makeBorder({}), o.border, BORDER), filter: pick(makeFilter(), o.filter, FILTER) };
}

/* O que é salvo de um template: sem as stills e sem lastBlend, que só lembra a última suavidade usada */
function tplData(t){
  const { lastBlend, ...border } = t.border;
  return { slots: t.slots.map(({ zoom, px, py, flip }) => ({ zoom, px, py, flip })), texts: t.texts, border, filter: t.filter };
}
const snapshot = t => JSON.stringify(tplData(t));
/* Template salvo com alterações que ainda não foram salvas */
export const isDirty = t => t.mine && snapshot(t) !== t.saved;

let seq = 0;
const newKey = () => 'm-' + Date.now().toString(36) + (seq++).toString(36);
/* Monta um template de "Meus templates". slots pode trazer img (as stills escolhidas na sessão); saved é a versão salva */
export function makeMine({ key = newKey(), name, base, slots, texts, border, filter }){
  const t = {
    key, mine: true, name: name || tr('mine.untitled'), def: DEFS.find(d => d.id === base),
    slots: slots.map(s => ({ img: s.img || null, zoom: s.zoom, px: s.px, py: s.py, flip: s.flip })),
    texts: JSON.parse(JSON.stringify(texts)), border: { ...border }, filter: { ...(filter || makeFilter()) }, pick: false, edited: false,
  };
  t.saved = snapshot(t);
  return t;
}
export const saveMine = t => ({ ...t, saved: snapshot(t) });
/* Volta à versão salva, mantendo as stills escolhidas em cada espaço */
export function revertMine(t){
  const d = JSON.parse(t.saved);
  return { ...t, slots: d.slots.map((s, i) => ({ img: t.slots[i] ? t.slots[i].img : null, ...s })), texts: d.texts, border: d.border, filter: d.filter };
}

/* Arquivo .json de um template (padrão ou salvo), com o template padrão de origem em base */
export function templateFile(t){
  return JSON.stringify({ format: FORMAT, version: VERSION, name: tplName(t), base: t.def.id, ...tplData(t) }, null, 2);
}
export function parseTemplateFile(text){
  let o;
  try { o = JSON.parse(text); } catch (e){ throw new Error('json'); }
  if (!o || o.format !== FORMAT) throw new Error('format');
  return readTemplate(o);
}

export function readMine(){
  let list;
  try { list = JSON.parse(localStorage.getItem(STORE) || '[]'); } catch (e){ return []; }
  if (!Array.isArray(list)) return [];
  return list.flatMap(o => {
    try { return [makeMine({ ...readTemplate(o), key: typeof o.key === 'string' ? o.key : undefined })]; } catch (e){ return []; }
  });
}
/* Conteúdo do localStorage para os templates salvos de tpls: nome atual e a última versão salva */
export const mineStore = tpls => JSON.stringify(tpls.filter(t => t.mine).map(t => ({ key: t.key, name: t.name, base: t.def.id, ...JSON.parse(t.saved) })));
export function writeMine(json){ try { localStorage.setItem(STORE, json); } catch (e){} }

/* Edições dos templates padrão feitas sem salvar como meu template: ficam no localStorage, sem as stills,
   para continuar depois de recarregar a página. Restaurar o template no editor tira edited e apaga a edição. */
const EDITED = 'tb-edited';
export function readEdited(){
  let o;
  try { o = JSON.parse(localStorage.getItem(EDITED) || '{}'); } catch (e){ return {}; }
  const out = {};
  if (!o || typeof o !== 'object' || Array.isArray(o)) return out;
  for (const [id, d] of Object.entries(o)){ try { out[id] = readTemplate({ ...d, base: id }); } catch (e){} }
  return out;
}
export const editedStore = tpls => JSON.stringify(Object.fromEntries(tpls.filter(t => !t.mine && t.edited).map(t => [t.key, tplData(t)])));
export function writeEdited(json){ try { localStorage.setItem(EDITED, json); } catch (e){} }
