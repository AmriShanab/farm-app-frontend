import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Dev-only API proxy target. Defaults to production; override locally via
  // VITE_DEV_API_TARGET in .env.local (e.g. http://127.0.0.1:8000 for a local backend).
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://localhost'
  // Path prefix the backend lives under. Apache/XAMPP serves it at
  // /mrfarm/backend/api/public (default). For the built-in PHP server rooted at
  // that public dir, set VITE_DEV_API_PREFIX= (empty) in .env.local.
  const apiPrefix = env.VITE_DEV_API_PREFIX ?? '/mrfarm/backend/api/public'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          followRedirects: true,
          secure: false,
          rewrite: (path) => `${apiPrefix}${path}`,
        },
      },
    },
  }
})
