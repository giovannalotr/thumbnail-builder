const P = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' };
const PJ = { ...P, strokeLinejoin: 'round' };

export const IconDownload = () => <svg {...P}><path d="M12 4v12M6 10l6 6 6-6M4 20h16" /></svg>;
export const IconShuffle = () => <svg {...PJ}><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>;
export const IconUndo = () => <svg {...PJ}><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>;
export const IconRedo = () => <svg {...PJ}><path d="m15 14 5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></svg>;
export const IconSwap = () => <svg {...PJ}><path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" /></svg>;
