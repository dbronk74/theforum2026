import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const repository = process.env.GITHUB_REPOSITORY ?? ''
const repositoryName = repository.split('/')[1] ?? ''
const defaultBase = process.env.GITHUB_ACTIONS === 'true' && repositoryName ? `/${repositoryName}/` : '/'
const base = process.env.VITE_BASE_PATH ?? defaultBase

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: { port: 5173 },
})
