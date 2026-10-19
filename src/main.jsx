import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { loadFontStyles } from './lib/fonts.js';
import './styles.css';

loadFontStyles();
createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
