import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json' with { type: 'json' };

export default defineConfig(({ mode, command }) => {
  const e = loadEnv(mode, process.cwd(), '');
  if (command === 'build' && mode !== 'fixtures' && e.VITE_USE_MOCK === 'true')
    throw Error(
      'Production build requires HTTP. Use npm run build:fixtures for isolated fixtures.',
    );
  if (mode === 'live' && e.VITE_USE_MOCK !== 'false')
    throw Error('Live builds require VITE_USE_MOCK=false.');
  return {
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
    },
    plugins: [react()],
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
    },
    build: { target: 'es2022', emptyOutDir: true },
    resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
    server: {
      host: '127.0.0.1',
      proxy:
        e.VITE_USE_MOCK === 'false'
          ? {
              '/backend': {
                target: e.API_PROXY_TARGET || 'http://127.0.0.1:3000',
                changeOrigin: true,
                rewrite: (p) =>
                  p.replace(/^\/backend/, e.API_PROXY_PATH || '/api/v1'),
              },
            }
          : {},
    },
  };
});
