import { useCallback, useEffect, useMemo, useState } from 'react';
import Editor from './components/Editor.jsx';
import GridView from './components/GridView.jsx';
import Header from './components/Header.jsx';
import { applyPrevBg } from './components/PreviewBgPicker.jsx';
import Toast from './components/Toast.jsx';
import { exportTpls } from './lib/exporter.js';
import { makeGrade } from './lib/grade.js';
import { decodeImages, isImageFile } from './lib/images.js';
import { toast } from './lib/toast.js';
import { useStore } from './state.js';

function useDebounced(value, ms){
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export default function App(){
  const [state, actions] = useStore();
  const [editing, setEditing] = useState(null);
  const [edTab, setEdTab] = useState('imagens');
  const [dropping, setDropping] = useState(false);
  const [histories] = useState(() => state.tpls.map(() => ({ undo: [], redo: [], last: null })));
  const { images, imgVer, filter, amt, grain, vig, prevBg } = state;
  const grade = useMemo(() => makeGrade(filter, amt, grain, vig), [filter, amt, grain, vig]);
  const env = useMemo(() => ({ images, imgVer, grade }), [images, imgVer, grade]);
  // A grade redesenha os 12 templates; espera o controle deslizante parar por 90 ms
  const gridGrade = useDebounced(grade, 90);
  const gridEnv = useMemo(() => ({ images, imgVer, grade: gridGrade }), [images, imgVer, gridGrade]);

  useEffect(() => {
    applyPrevBg(prevBg);
    try { localStorage.setItem('tb-prevbg', prevBg); } catch (e){}
  }, [prevBg]);

  const loadFiles = useCallback(async files => {
    const list = [...files].filter(isImageFile);
    if (!list.length){ toast('Nenhuma imagem encontrada. Envie arquivos JPG, PNG ou WebP.'); return; }
    toast(`Carregando ${list.length} ${list.length > 1 ? 'stills' : 'still'}…`, 1600);
    const { added, failed } = await decodeImages(list);
    if (!added.length){ toast('Não consegui abrir essas imagens. Envie em JPG, PNG ou WebP.'); return; }
    actions.addImages(added);
    if (failed.length) toast(`Não abri: ${failed.join(', ')}. Use JPG, PNG ou WebP.`, 4200);
  }, [actions]);

  // Arrastar arquivos para qualquer ponto da janela
  useEffect(() => {
    let depth = 0;
    const enter = e => { if ([...(e.dataTransfer.types || [])].includes('Files')){ depth++; setDropping(true); } };
    const leave = () => { depth = Math.max(0, depth - 1); if (!depth) setDropping(false); };
    const over = e => e.preventDefault();
    const drop = e => { e.preventDefault(); depth = 0; setDropping(false); if (e.dataTransfer.files.length) loadFiles(e.dataTransfer.files); };
    const evs = [['dragenter', enter], ['dragleave', leave], ['dragover', over], ['drop', drop]];
    evs.forEach(([n, f]) => window.addEventListener(n, f));
    return () => evs.forEach(([n, f]) => window.removeEventListener(n, f));
  }, [loadFiles]);

  const removeImage = id => {
    const im = images.find(i => i.id === id); if (im && im.url) URL.revokeObjectURL(im.url);
    actions.removeImage(id);
  };
  const onExport = idxs => exportTpls(idxs, { tpls: state.tpls, size: state.size, fmt: state.fmt, env });
  const setPrevBg = v => actions.set('prevBg', v);

  return (
    <>
      <Header onFiles={loadFiles} />
      {editing == null
        ? <GridView state={state} actions={actions} env={gridEnv} onEdit={setEditing} onExport={onExport} onRemoveImage={removeImage} />
        : <Editor key={editing} index={editing} tpl={state.tpls[editing]} images={images} env={env} actions={actions} history={histories[editing]}
            tab={edTab} setTab={setEdTab} prevBg={prevBg} onPrevBg={setPrevBg} onClose={() => setEditing(null)} onExport={onExport} />}
      <div id="drop" hidden={!dropping}>Solte as stills aqui</div>
      <Toast />
    </>
  );
}
