import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Local development uses the live API by default. These can still be
  // overridden in .env.local when working against a local backend.
  const apiTarget = env.VITE_DEV_API_TARGET || 'https://mrfarm-api.skbahmd.dev'
  const apiPrefix = env.VITE_DEV_API_PREFIX ?? ''

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          followRedirects: true,
          secure: true,
          rewrite: (path) => `${apiPrefix}${path}`,
        },
      },
    },
  }
})
