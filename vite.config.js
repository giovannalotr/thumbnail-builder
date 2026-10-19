import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' gera caminhos relativos: o mesmo build funciona em
// https://<usuário>.github.io/<repositório>/ e num domínio próprio.
export default defineConfig({
  base: './',
  plugins: [react()],
});
