import type { Config } from 'prettier'

const config: Config = {
  arrowParens: 'avoid',
  semi: false,
  singleQuote: true,
  trailingComma: 'none',
  printWidth: 100,
  tabWidth: 2,
  plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss']
}

export default config
