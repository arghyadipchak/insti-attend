import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'

import packageJson from './package.json' with { type: 'json' }

const repoUrl =
  typeof packageJson.repository === 'string'
    ? packageJson.repository
    : packageJson.repository?.url?.replace(/\.git$/, '') || packageJson.homepage || ''

const developers = [
  ...(packageJson.author ? [packageJson.author] : []),
  ...((packageJson.contributors as (typeof packageJson.author)[]) || [])
]

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_REPO__: JSON.stringify(repoUrl),
    __APP_DEVELOPERS__: JSON.stringify(developers)
  },
  plugins: [wasm(), svelte(), tailwindcss()],
  build: { target: 'esnext' }
})
