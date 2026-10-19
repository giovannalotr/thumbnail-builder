export default function Stills({ images, onRemove }){
  const n = images.filter(i => !i.sample).length;
  return (
    <div className="block">
      <div className="block-head"><h2>Stills</h2><span className="note">{n ? `${n} ${n > 1 ? 'stills enviadas' : 'still enviada'} · resolução original preservada na exportação` : 'JPG, PNG ou WebP em resolução original'}</span></div>
      <div className="sample-flag" hidden={!images.some(i => i.sample)}>Estas são imagens de exemplo. Envie suas stills originais (ou arraste para a janela) e elas substituem os exemplos.</div>
      <div className="tray">
        {images.map(i => (
          <div className="still" key={i.id} title={i.name}>
            <img src={i.thumb} alt={i.name} /><span className="res">{i.w}×{i.h}</span>
            <button className="x" onClick={() => onRemove(i.id)} aria-label={`Remover ${i.name}`}>×</button>
          </div>
        ))}
        <label className="add" htmlFor="file">+ adicionar<br />stills</label>
      </div>
    </div>
  );
}
