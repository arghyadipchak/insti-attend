/** @type {import("prettier").Config} */
export default {
  arrowParens: 'avoid',
  semi: false,
  singleQuote: true,
  trailingComma: 'none',
  printWidth: 100,
  tabWidth: 2,
  plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss']
}
