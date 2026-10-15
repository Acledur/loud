import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Na versão publicada (build), o navegador é proibido de fazer qualquer
// requisição de rede: nenhum dado pode sair da página.
const csp = {
  name: 'csp-sem-rede',
  apply: 'build' as const,
  transformIndexHtml: (html: string) =>
    html.replace(
      '</head>',
      `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:" /></head>`,
    ),
};

export default defineConfig({
  base: './',
  plugins: [react(), csp],
  test: { environment: 'node' },
});
