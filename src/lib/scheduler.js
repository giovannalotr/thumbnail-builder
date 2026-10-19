/* Fila de desenhos pesados: executa um por vez e devolve o controle ao navegador entre eles.
   Agendar de novo a mesma chave substitui o pedido que ainda não foi executado. */
const jobs = new Map();
let running = false;
function run(){
  const next = jobs.entries().next();
  if (next.done){ running = false; return; }
  const [key, fn] = next.value; jobs.delete(key);
  try { fn(); } finally { setTimeout(run, 0); }
}
export function schedule(key, fn){
  jobs.delete(key); jobs.set(key, fn);
  if (!running){ running = true; setTimeout(run, 0); }
}
export const cancel = key => { jobs.delete(key); };
