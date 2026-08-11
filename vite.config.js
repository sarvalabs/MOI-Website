import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const DATA_ROOM_DEFAULT = 'https://dataroom.moi.technology'

// Never throw out of the config: this module is evaluated by `vite build`
// too, so a malformed DATA_ROOM_CHAT_URL would fail the production build
// over a value only the dev proxy ever reads.
function dataRoomOrigin() {
  const raw = process.env.DATA_ROOM_CHAT_URL?.trim()
  if (!raw) return DATA_ROOM_DEFAULT

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    return new URL(candidate).origin
  } catch {
    console.warn(`[vite] ignoring malformed DATA_ROOM_CHAT_URL (${raw}), using ${DATA_ROOM_DEFAULT}`)
    return DATA_ROOM_DEFAULT
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/chat': {
        target: dataRoomOrigin(),
        changeOrigin: true,
      },
      '/api/community-calls': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
