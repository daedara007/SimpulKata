import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:3000'

  return {
    plugins: [vue()],
    server: {
      host: '0.0.0.0',
      port: 8080,
      allowedHosts: true, // Mengizinkan akses host eksternal / Cloudflare Tunnel (simpulkata.fragpoint.my.id)
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 8080,
      allowedHosts: true,
    },
  }
})
