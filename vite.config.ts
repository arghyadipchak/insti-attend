import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))
const version = 'v' + (process.env.APP_VERSION ?? pkg.version).replace(/^v/, '')

export default defineConfig({
  plugins: [wasm(), svelte(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(version)
  },
  build: {
    target: 'esnext'
  }
})
