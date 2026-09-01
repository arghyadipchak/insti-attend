/// <reference types="svelte" />
/// <reference types="vite/client" />

interface Developer {
  name: string
  email?: string
  url?: string
  website?: string
}

declare const __APP_VERSION__: string
declare const __APP_REPO__: string
declare const __APP_DEVELOPERS__: readonly Developer[]
