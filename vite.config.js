import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Dev-only API proxy target. Defaults to production; override locally via
  // VITE_DEV_API_TARGET in .env.local (e.g. http://127.0.0.1:8000 for a local backend).
  const apiTarget = env.VITE_DEV_API_TARGET || 'https://mrfarm-api.skbahmd.dev'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          followRedirects: true,
          secure: false,
        },
      },
    },
  }
})
