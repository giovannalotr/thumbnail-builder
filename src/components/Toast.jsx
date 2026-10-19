import { useEffect, useState } from 'react';
import { onToast } from '../lib/toast.js';

export default function Toast(){
  const [state, setState] = useState({ msg: '', show: false });
  useEffect(() => {
    let timer = 0;
    onToast((msg, ms) => {
      setState({ msg, show: true });
      clearTimeout(timer); timer = setTimeout(() => setState(s => ({ ...s, show: false })), ms);
    });
    return () => { onToast(null); clearTimeout(timer); };
  }, []);
  return <div id="toast" className={state.show ? 'show' : undefined} role="status" aria-live="polite">{state.msg}</div>;
}
