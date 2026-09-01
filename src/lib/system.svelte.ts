import { theme } from './settings.svelte'

export const preferDark = $state({
  value: window.matchMedia('(prefers-color-scheme: dark)').matches
})

export function getResolvedTheme(): 'dim' | 'cupcake' {
  return (theme.value === 'system' && preferDark.value) || theme.value === 'dark'
    ? 'dim'
    : 'cupcake'
}

interface ComponentType {
  selected: 'scanner' | 'attendance' | 'settings'
}
export const component = $state<ComponentType>({ selected: 'scanner' })
