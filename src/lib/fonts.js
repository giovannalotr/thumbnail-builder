function F(n, c, w = [400], iw = []){
  const enc = n.replace(/ /g, '+');
  let q;
  if (!iw.length) q = (w.length === 1 && w[0] === 400) ? enc : `${enc}:wght@${w.join(';')}`;
  else q = `${enc}:ital,wght@${w.map(x => '0,' + x).join(';')};${iw.map(x => '1,' + x).join(';')}`;
  return { n, c, w, iw, q };
}
export const FONTS = [
  F('Cormorant Garamond', 'texto', [300, 400, 500, 600, 700], [300, 400, 500, 600, 700]),
  F('EB Garamond', 'texto', [400, 500, 600, 700], [400, 500, 600, 700]),
  F('Libre Caslon Text', 'texto', [400, 700], [400]),
  F('Libre Baskerville', 'texto', [400, 700], [400]),
  F('Lora', 'texto', [400, 500, 600, 700], [400, 500, 600, 700]),
  F('Spectral', 'texto', [300, 400, 500, 600], [300, 400, 500, 600]),
  F('Old Standard TT', 'texto', [400, 700], [400]),
  F('IM Fell English', 'texto', [400], [400]),
  F('Playfair Display', 'titulo', [400, 500, 600, 700, 800], [400, 500, 600, 700]),
  F('Bodoni Moda', 'titulo', [400, 500, 600, 700], [400, 500, 600, 700]),
  F('DM Serif Display', 'titulo', [400], [400]),
  F('Gilda Display', 'titulo'),
  F('Prata', 'titulo'),
  F('Cinzel', 'titulo', [400, 500, 600, 700]),
  F('Marcellus', 'titulo'),
  F('Italiana', 'titulo'),
  F('Pinyon Script', 'cali'), F('Great Vibes', 'cali'), F('Italianno', 'cali'), F('Parisienne', 'cali'),
  F('Allura', 'cali'), F('Mrs Saint Delafield', 'cali'), F('Monsieur La Doulaise', 'cali'), F('Corinthia', 'cali', [400, 700]),
  F('Ephesis', 'cali'), F('WindSong', 'cali', [400, 500]), F('Alex Brush', 'cali'), F('Petit Formal Script', 'cali'),
  F('Herr Von Muellerhoff', 'cali'), F('Birthstone', 'cali'), F('Imperial Script', 'cali'), F('Sacramento', 'cali'),
  F('Homemade Apple', 'mao'), F('La Belle Aurore', 'mao'), F('Caveat', 'mao', [400, 500, 600, 700]),
  F('Dancing Script', 'mao', [400, 500, 600, 700]), F('Nothing You Could Do', 'mao'), F('Cedarville Cursive', 'mao'),
];
export const FCATS = [['texto', 'Serifadas de texto'], ['titulo', 'Serifadas de título'], ['cali', 'Caligráficas'], ['mao', 'Escrita à mão']];
export const fontByName = n => FONTS.find(f => f.n === n) || FONTS[0];
/* CSS do Google Fonts de cada família; document.fonts.load só encontra a fonte depois que esse CSS carrega */
const sheets = new Map();
export function loadFontStyles(){
  FONTS.forEach(f => sheets.set(f.n, new Promise(res => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = `https://fonts.googleapis.com/css2?family=${f.q}&display=swap`; l.onload = l.onerror = res; document.head.appendChild(l); })));
}
export const fstr = (L, px) => `${L.italic ? 'italic ' : ''}${L.weight} ${px}px "${L.font}", Georgia, serif`;
const fontReady = new Set(), fontPending = new Map();
export function needFonts(layers){
  const ps = [];
  layers.forEach(L => {
    const k = fstr(L, 40);
    if (fontReady.has(k)) return;
    if (!fontPending.has(k)) fontPending.set(k, (sheets.get(L.font) || Promise.resolve()).then(() => document.fonts.load(k, 'Aa ' + (L.text || ''))).catch(() => {}).then(() => { fontReady.add(k); fontPending.delete(k); }));
    ps.push(fontPending.get(k));
  });
  return ps.length ? Promise.all(ps) : null;
}
