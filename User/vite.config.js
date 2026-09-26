import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      '^/(auth|users|projects|workspaces|folders|files|chat|notifications|ws|billing|api|admin)/.*': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
