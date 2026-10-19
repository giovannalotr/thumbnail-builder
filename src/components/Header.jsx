import { Fragment } from 'react';
import { LANGS, getLang, setLang } from '../lib/i18n.js';
import { useTr } from '../state.js';

export default function Header(){
  const tr = useTr(), lang = getLang();
  return (
    <header className="top"><div className="top-in gut">
      <div className="brand"><span className="mark">Thumbnail Builder</span><span className="by">by <a href="https://giovannafilms.com" target="_blank" rel="noopener noreferrer">giovannafilms</a></span></div>
      <div className="lang" role="group" aria-label={tr('header.language')}>
        {LANGS.map((L, i) => (
          <Fragment key={L.id}>
            {i > 0 && <span className="sep" aria-hidden="true" />}
            <button lang={L.id} title={L.name} className={L.id === lang ? 'on' : undefined} aria-pressed={L.id === lang} onClick={() => setLang(L.id)}>{L.short}</button>
          </Fragment>
        ))}
      </div>
    </div></header>
  );
}
