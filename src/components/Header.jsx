import { IconUpload } from './icons.jsx';

export default function Header({ onFiles }){
  return (
    <header className="top"><div className="top-in gut">
      <div className="brand"><span className="mark">Thumb Builder</span><span className="tag">thumbnails a partir das suas stills</span></div>
      <div className="row">
        <label className="btn primary" htmlFor="file"><IconUpload />Enviar stills</label>
        <input id="file" type="file" accept="image/*" multiple hidden onChange={e => { if (e.target.files.length) onFiles(e.target.files); e.target.value = ''; }} />
      </div>
    </div></header>
  );
}
