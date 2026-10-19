import { Fragment, useEffect, useState } from 'react';
import { LANGS, getLang, setLang } from '../lib/i18n.js';
import { useTr } from '../state.js';
import { IconMoon, IconSun, IconThemeAuto } from './icons.jsx';

/* Tema: auto segue o sistema; light e dark viram data-theme no <html>, que o CSS respeita */
const THEMES = ['auto', 'light', 'dark'], THEME_ICONS = { auto: IconThemeAuto, light: IconSun, dark: IconMoon };
function readTheme(){ try { const v = localStorage.getItem('tb-theme'); return THEMES.includes(v) ? v : 'auto'; } catch (e){ return 'auto'; } }

export default function Header(){
  const tr = useTr(), lang = getLang();
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'auto') delete root.dataset.theme; else root.dataset.theme = theme;
    try { localStorage.setItem('tb-theme', theme); } catch (e){}
  }, [theme]);
  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length], Icon = THEME_ICONS[theme];
  const themeLabel = tr('theme.change', { name: tr('theme.' + theme), next: tr('theme.' + next) });
  return (
    <header className="top"><div className="top-in gut">
      <div className="brand"><span className="mark">Thumbnail Builder</span><span className="by">by <a href="https://giovannafilms.com" target="_blank" rel="noopener noreferrer">giovannafilms</a></span></div>
      <div className="top-r">
        <button className="theme-btn" title={themeLabel} aria-label={themeLabel} onClick={() => setTheme(next)}><Icon /></button>
        <div className="lang" role="group" aria-label={tr('header.language')}>
          {LANGS.map((L, i) => (
            <Fragment key={L.id}>
              {i > 0 && <span className="sep" aria-hidden="true" />}
              <button lang={L.id} title={L.name} className={L.id === lang ? 'on' : undefined} aria-pressed={L.id === lang} onClick={() => setLang(L.id)}>{L.short}</button>
            </Fragment>
          ))}
        </div>
      </div>
    </div></header>
  );
}
