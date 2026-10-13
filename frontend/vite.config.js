import { defineConfig } from 'vite';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  build:{rollupOptions:{input:{app:fileURLToPath(new URL('./index.html',import.meta.url)),landing:fileURLToPath(new URL('./landing.html',import.meta.url))}}},
  server: {
    port: 5173,
    strictPort: true,
    open: '/landing.html'
  },
  plugins: [
    {
      name: 'default-to-landing',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url === '/index.html') {
            req.url = '/landing.html';
          }
          next();
        });
      }
    }
  ]
});
