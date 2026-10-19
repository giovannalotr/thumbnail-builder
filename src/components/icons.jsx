const P = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' };
const PJ = { ...P, strokeLinejoin: 'round' };

export const IconDownload = () => <svg {...P}><path d="M12 4v12M6 10l6 6 6-6M4 20h16" /></svg>;
export const IconShuffle = () => <svg {...PJ}><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>;
export const IconUndo = () => <svg {...PJ}><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>;
export const IconRedo = () => <svg {...PJ}><path d="m15 14 5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></svg>;
export const IconUpload = () => <svg {...P}><path d="M12 16V4M6 10l6-6 6 6M4 20h16" /></svg>;
export const IconSave = () => <svg {...PJ}><path d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6" /></svg>;
export const IconMore = () => <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>;
export const IconThemeAuto = () => <svg {...P}><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" /></svg>;
export const IconSun = () => <svg {...P}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" /></svg>;
export const IconMoon = () => <svg {...PJ}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>;
export const IconCheck = () => <svg {...PJ}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
export const IconSwap = () => <svg {...PJ}><path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" /></svg>;
export const IconChevron = () => <svg {...PJ}><path d="m6 9 6 6 6-6" /></svg>;
/* Âncoras: centro de uma foto (moldura com cruz) e alinhamento com outros textos (T sobre uma linha) */
export const IconSnapPhoto = () => <svg {...PJ}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M12 9v6M9 12h6" /></svg>;
export const IconSnapText = () => <svg {...PJ}><path d="M6 4h12M12 4v11M3 20h18" /></svg>;
