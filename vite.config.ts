import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// The UCP client (agent) service. Requests are proxied so the browser talks to
// the dev server same-origin and never needs to deal with CORS.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_UCP_CLIENT_URL ?? 'http://localhost:7000'

  const proxy = {
    '/api': { target, changeOrigin: true },
    '/profile': { target, changeOrigin: true },
  }

  return {
    plugins: [react()],
    server: { port: 5173, strictPort: true, proxy },
    preview: { port: 4173, strictPort: true, proxy },
  }
})
