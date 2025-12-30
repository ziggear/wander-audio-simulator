import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages deployment:
// - If repository name is 'username.github.io', set base to '/'
// - Otherwise, set base to '/repository-name/'
// In development, use '/' for easier local testing
const base = process.env.VITE_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/wander-audio-simulator/' : '/')

export default defineConfig({
  plugins: [react()],
  base: base,
  server: {
    port: 3000
  }
})

