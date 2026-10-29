import path from 'path';
import react from '@vitejs/plugin-react';
import {
  defineConfig,
  loadEnv,
  type Plugin,
  type ViteDevServer,
} from 'vite';
import { handleNewsRequest } from './server/news';

function localApiRoutes(
  server: Pick<ViteDevServer, 'middlewares'>,
  env: Record<string, string>
): void {
  server.middlewares.use((request, response, next) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (url.pathname !== '/api/news') {
      next();
      return;
    }

    const result = handleNewsRequest(request.method, env);

    void result.then(
      (apiResult) => {
        response.statusCode = apiResult.status;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', apiResult.cacheControl);
        response.end(JSON.stringify(apiResult.body));
      },
      next
    );
  });
}

function serverApiPlugin(): Plugin {
  let env: Record<string, string> = {};
  return {
    name: 'niftypulse-server-api',
    config(_config, { mode }) {
      env = loadEnv(mode, process.cwd(), '');
    },
    configureServer(server) {
      localApiRoutes(server, env);
    },
    configurePreviewServer(server) {
      localApiRoutes(server, env);
    },
  };
}

export default defineConfig({
  plugins: [react(), serverApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    proxy: {
      // Yahoo Finance chart API (avoids browser CORS)
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) => {
          const queryStart = requestPath.indexOf('?');
          const params = new URLSearchParams(
            queryStart === -1 ? '' : requestPath.slice(queryStart + 1)
          );
          const symbol = params.get('symbol');
          const range = params.get('range') ?? '1d';
          const interval = params.get('interval') ?? '5m';
          return `/v8/finance/chart/${encodeURIComponent(symbol ?? '')}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;
        },
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      },
    },
  },
  preview: {
    proxy: {
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) => {
          const queryStart = requestPath.indexOf('?');
          const params = new URLSearchParams(
            queryStart === -1 ? '' : requestPath.slice(queryStart + 1)
          );
          const symbol = params.get('symbol');
          const range = params.get('range') ?? '1d';
          const interval = params.get('interval') ?? '5m';
          return `/v8/finance/chart/${encodeURIComponent(symbol ?? '')}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;
        },
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['framer-motion', 'motion-dom', 'motion-utils'],
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'charts': ['recharts'],
          'motion': ['framer-motion'],
          'ui-primitives': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
          ],
        },
      },
    },
  },
});
