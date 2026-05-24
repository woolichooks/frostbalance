import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// Set VITE_SHIP_MUSIC=true at build time to bundle the public/music mp3s
// (e.g. for local previews of the full sound build). Unset / "false" /
// any other value strips them from dist/ — the public deploy plays SFX
// only and references no licensed audio.
const shipMusic = process.env.VITE_SHIP_MUSIC === 'true'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'frostbalance:strip-music',
      apply: 'build',
      closeBundle() {
        if (shipMusic) return
        const dir = path.resolve(__dirname, 'dist', 'music')
        if (fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true, force: true })
          // eslint-disable-next-line no-console
          console.log('[frostbalance] stripped public/music from dist (VITE_SHIP_MUSIC unset)')
        }
      },
    },
  ],
})
