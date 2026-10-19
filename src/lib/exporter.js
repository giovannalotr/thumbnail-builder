import { needFonts } from './fonts.js';
import { renderTpl } from './render.js';
import { toast } from './toast.js';
import { slug } from './util.js';

export function saveFile(name, blob){ const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
const toBlob = (c, type, q) => new Promise(res => c.toBlob(res, type, q));
let busy = false;
export async function exportTpls(idxs, { tpls, size, fmt, env }){
  if (busy) return; busy = true;
  try {
    const W = size, H = Math.round(W * 9 / 16), png = fmt === 'png', type = png ? 'image/png' : 'image/jpeg', ext = png ? 'png' : 'jpg';
    toast(idxs.length > 1 ? `Preparando ${idxs.length} thumbnails em ${W}×${H}…` : `Preparando thumbnail em ${W}×${H}…`, 6000);
    const files = [];
    for (const i of idxs){
      const t = tpls[i]; const p = needFonts(t.texts); if (p) await p;
      await new Promise(r => setTimeout(r, 0));
      const { canvas } = renderTpl(t, i, W, H, env, { hi: true });
      files.push({ name: `thumb-${String(i + 1).padStart(2, '0')}-${slug(t.def.name)}.${ext}`, blob: await toBlob(canvas, type, .93) });
    }
    if (files.length === 1) saveFile(files[0].name, files[0].blob);
    else {
      const { default: JSZip } = await import('jszip');
      const z = new JSZip(); files.forEach(f => z.file(f.name, f.blob));
      saveFile(`thumbnails-${W}x${H}.zip`, await z.generateAsync({ type: 'blob' }));
    }
    toast(files.length > 1 ? `${files.length} thumbnails salvas em um .zip.` : 'Thumbnail salva.');
  } catch (e){
    toast('Não foi possível baixar agora. Tente um tamanho de exportação menor ou JPG.');
  } finally { busy = false; }
}
