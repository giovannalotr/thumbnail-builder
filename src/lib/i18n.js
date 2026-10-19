import en from '../locales/en.js';
import ptBR from '../locales/pt-BR.js';

/* Idioma da interface. tr() lê o idioma atual na hora da chamada, então serve tanto para
   componentes (que usam useTr, em state.js, para redesenhar na troca) quanto para módulos sem React. */
export const LANGS = [{ id: 'pt-BR', short: 'PT', name: 'Português (Brasil)' }, { id: 'en', short: 'EN', name: 'English' }];
const DICTS = { 'pt-BR': ptBR, en };
/* Sem escolha salva, usa o primeiro idioma do dispositivo que o app tem (qualquer português vira pt-BR);
   se nenhum servir, inglês */
function deviceLang(){
  for (const v of navigator.languages || [navigator.language]){
    const base = String(v).toLowerCase().split('-')[0];
    if (base === 'pt') return 'pt-BR';
    if (base === 'en') return 'en';
  }
  return 'en';
}
function readLang(){ try { const v = localStorage.getItem('tb-lang'); return DICTS[v] ? v : deviceLang(); } catch (e){ return deviceLang(); } }
let lang = readLang(), plurals = new Intl.PluralRules(lang);
document.documentElement.lang = lang;
const listeners = new Set();

export const getLang = () => lang;
export const onLang = fn => { listeners.add(fn); return () => listeners.delete(fn); };
export function setLang(v){
  if (!DICTS[v] || v === lang) return;
  lang = v; plurals = new Intl.PluralRules(v); document.documentElement.lang = v;
  try { localStorage.setItem('tb-lang', v); } catch (e){}
  listeners.forEach(fn => fn());
}

/* tr('card.images', { n: 3 }): com n, usa a forma de plural do idioma (card.images_one ou card.images_other).
   {nome} no texto é trocado pelo parâmetro de mesmo nome. Chave ausente cai no pt-BR e depois na própria chave. */
export function tr(key, params){
  const d = DICTS[lang], pk = params && params.n != null ? key + '_' + plurals.select(params.n) : null;
  const s = (pk && (d[pk] ?? ptBR[pk])) ?? d[key] ?? ptBR[key] ?? key;
  return params ? s.replace(/\{(\w+)\}/g, (m, k) => params[k] ?? m) : s;
}
export const fmtNum = (v, digits) => v.toLocaleString(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits });
