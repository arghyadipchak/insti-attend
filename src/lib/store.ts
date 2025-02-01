import { writable, type Writable } from 'svelte/store'

export type ComponentType = 'scanner' | 'attendance' | 'settings'
export let selectedComponent: Writable<ComponentType> = writable('scanner')
export function selectComponent(component: ComponentType) {
  selectedComponent.set(component)
}
