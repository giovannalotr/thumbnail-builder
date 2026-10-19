import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor from './components/Editor.jsx';
import GridView from './components/GridView.jsx';
import Header from './components/Header.jsx';
import { applyPrevBg } from './components/PreviewBgPicker.jsx';
import Toast from './components/Toast.jsx';
import { exportTpls } from './lib/exporter.js';
import { makeGrade } from './lib/grade.js';
import { decodeImages, isImageFile } from './lib/images.js';
import { loadSamples } from './lib/samples.js';
import { toast } from './lib/toast.js';
import { editedStore, makeMine, mineStore, writeEdited, writeMine } from './lib/userTemplates.js';
import { useStore, useTr } from './state.js';

let loadSeq = 0;
/* Rota no hash (funciona no GitHub Pages sem configurar o servidor): #/edit/<key> abre o editor; sem hash, a grade */
const routeKey = () => { const m = /^#\/edit\/(.+)$/.exec(location.hash); return m ? decodeURIComponent(m[1]) : null; };
const editHash = key => '#/edit/' + encodeURIComponent(key);
const gridUrl = () => location.pathname + location.search;

function useDebounced(value, ms){
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export default function App(){
  const [state, actions] = useStore();
  const tr = useTr();
  // editing é a key do template aberto no editor; o histórico de desfazer fica guardado por key
  const [editing, setEditing] = useState(routeKey);
  const [edTab, setEdTab] = useState('imagens');
  const [dropping, setDropping] = useState(false);
  // Stills ainda decodificando ({ id, name }): a faixa de stills mostra um esqueleto para cada uma
  const [loading, setLoading] = useState([]);
  const histories = useRef({}).current;
  const { images, imgVer, filter, amt, grain, vig, prevBg, archived } = state;
  const grade = useMemo(() => makeGrade(filter, amt, grain, vig), [filter, amt, grain, vig]);
  const env = useMemo(() => ({ images, imgVer, grade }), [images, imgVer, grade]);
  // A grade redesenha os 12 templates; espera o controle deslizante parar por 90 ms
  const gridGrade = useDebounced(grade, 90);
  const gridEnv = useMemo(() => ({ images, imgVer, grade: gridGrade }), [images, imgVer, gridGrade]);

  useEffect(() => {
    applyPrevBg(prevBg);
    try { localStorage.setItem('tb-prevbg', prevBg); } catch (e){}
  }, [prevBg]);
  useEffect(() => { try { localStorage.setItem('tb-archived', JSON.stringify(archived)); } catch (e){} }, [archived]);
  useEffect(() => { loadSamples().then(actions.addSamples); }, [actions]);
  const mineJson = useMemo(() => mineStore(state.tpls), [state.tpls]);
  useEffect(() => writeMine(mineJson), [mineJson]);
  const editedJson = useMemo(() => editedStore(state.tpls), [state.tpls]);
  useEffect(() => writeEdited(editedJson), [editedJson]);

  const loadFiles = useCallback(async files => {
    const list = [...files].filter(isImageFile);
    if (!list.length){ toast(tr('files.none')); return; }
    toast(tr('files.loading', { n: list.length }), 1600);
    const pending = list.map(f => ({ id: 'load' + (++loadSeq), name: f.name }));
    setLoading(l => [...l, ...pending]);
    // Cada still entra no app assim que fica pronta
    const { added, failed } = await decodeImages(list, (k, im) => {
      setLoading(l => l.filter(x => x !== pending[k]));
      if (im) actions.addImages([im]);
    });
    if (!added.length){ toast(tr('files.failedAll')); return; }
    if (failed.length) toast(tr('files.failedSome', { names: failed.join(', ') }), 4200);
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
  const ei = editing == null ? -1 : state.tpls.findIndex(t => t.key === editing);
  // Voltar e avançar do navegador trocam entre a grade e o editor
  useEffect(() => {
    const onPop = () => setEditing(routeKey());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  // Endereço de um template que não existe (apagado, ou de outro navegador) cai na grade
  useEffect(() => { if (editing != null && ei < 0){ history.replaceState(null, '', gridUrl()); setEditing(null); } }, [editing, ei]);
  // Abrir o editor cria uma entrada no histórico; fechar volta a ela, para o voltar do navegador não sair do app
  const openEditor = key => { history.pushState({ tb: 'edit' }, '', editHash(key)); setEditing(key); };
  const closeEditor = () => {
    if (history.state && history.state.tb === 'edit') history.back();
    else { history.replaceState(null, '', gridUrl()); setEditing(null); }
  };
  // Salvar um template padrão cria uma cópia em "Meus templates", e o editor passa a editar a cópia
  const saveAs = name => {
    const t = state.tpls[ei], m = makeMine({ name, base: t.def.id, slots: t.slots, texts: t.texts, border: t.border });
    actions.addTemplates([m]); history.replaceState(history.state, '', editHash(m.key)); setEditing(m.key);
  };

  return (
    <>
      <Header />
      {ei < 0
        ? <GridView state={state} actions={actions} env={gridEnv} onEdit={i => openEditor(state.tpls[i].key)} onExport={onExport} loading={loading} onFiles={loadFiles} onRemoveImage={removeImage} />
        : <Editor key={editing} index={ei} tpl={state.tpls[ei]} images={images} env={env} actions={actions} history={histories[editing] || (histories[editing] = { undo: [], redo: [], last: null })}
            tab={edTab} setTab={setEdTab} prevBg={prevBg} onPrevBg={setPrevBg} onClose={closeEditor} onExport={onExport} onSaveAs={saveAs} />}
      <div id="drop" hidden={!dropping}>{tr('files.drop')}</div>
      <Toast />
    </>
  );
}
