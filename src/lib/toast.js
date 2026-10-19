/* Aviso curto no rodapé. O componente Toast se registra como ouvinte; qualquer módulo pode chamar toast(). */
let listener = null;
export const toast = (msg, ms = 2800) => { if (listener) listener(msg, ms); };
export const onToast = fn => { listener = fn; };
