import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/chat': {
        target: process.env.DATA_ROOM_CHAT_URL
          ? new URL(process.env.DATA_ROOM_CHAT_URL).origin
          : 'https://dataroom.moi.technology',
        changeOrigin: true,
      },
    },
  },
})
