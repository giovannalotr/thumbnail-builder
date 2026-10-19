import { tr } from './i18n.js';
import { makePreview, thumbURL } from './images.js';
import bosque from '../assets/samples/bosque.jpg';
import colinas from '../assets/samples/colinas.jpg';
import janela from '../assets/samples/janela.jpg';
import ovelhas from '../assets/samples/ovelhas.jpg';
import trilha from '../assets/samples/trilha.jpg';
import vela from '../assets/samples/vela.jpg';

/* Fotos de exemplo do Unsplash (Unsplash License: uso livre, sem atribuição obrigatória),
   recortadas em 1600×900. A ordem define qual foto cai em cada espaço dos templates (imgFor). */
const SCENES = [
  { scene: 'colinas', url: colinas, author: 'Vital Adi', page: 'https://unsplash.com/photos/hlI7x6blRNg' },
  { scene: 'bosque', url: bosque, author: 'James Wainscoat', page: 'https://unsplash.com/photos/dsll1jgW_FA' },
  { scene: 'vela', url: vela, author: 'Svitlana', page: 'https://unsplash.com/photos/o1CJ6cdd0U0' },
  { scene: 'ovelhas', url: ovelhas, author: 'Clovis Wood', page: 'https://unsplash.com/photos/Rtr1WwcwkoU' },
  { scene: 'trilha', url: trilha, author: 'Wolfgang Hasselmann', page: 'https://unsplash.com/photos/KS7vJpNPqRA' },
  { scene: 'janela', url: janela, author: 'Kristīne Kozaka', page: 'https://unsplash.com/photos/-vvWGNq1qIk' },
];

let samples = null;
/* Baixa e decodifica as fotos uma única vez; uma foto que não carregar fica de fora */
export function loadSamples(){
  return samples || (samples = Promise.all(SCENES.map(async ({ scene, url, author }) => {
    const img = new Image(); img.src = url;
    try { await img.decode(); } catch (e){ return null; }
    const w = img.naturalWidth, h = img.naturalHeight;
    return { id: 'ex-' + scene, scene, author, w, h, src: img, prev: makePreview(img, w, h), thumb: thumbURL(img, w, h), sample: true };
  })).then(list => list.filter(Boolean)));
}
/* Nome de uma still para a interface: o do arquivo ou, nos exemplos, o nome traduzido da cena */
export const imgName = im => im.sample ? tr('stills.sample', { name: tr('scene.' + im.scene) }) : im.name;
