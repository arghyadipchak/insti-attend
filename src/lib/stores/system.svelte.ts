export const preferDark = $state({
  value: window.matchMedia('(prefers-color-scheme: dark)').matches
})

interface ComponentType {
  selected: 'scanner' | 'attendance' | 'settings'
}
export const component = $state<ComponentType>({ selected: 'scanner' })
export const onboardingSeen = $state({
  value: localStorage.getItem('onboardingSeen') === 'true'
})
