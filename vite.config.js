import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/chat': {
        target: new URL(process.env.DATA_ROOM_CHAT_URL || 'http://localhost:3001').origin,
        changeOrigin: true,
      },
    },
  },
})
