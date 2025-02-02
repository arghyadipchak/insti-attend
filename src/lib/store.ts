import { writable, type Writable } from 'svelte/store'

export type ComponentType = 'scanner' | 'attendance' | 'settings'
export let selectedComponent: Writable<ComponentType> = writable('scanner')

export let devices: Writable<MediaDeviceInfo[]> = writable([])
export let selectedDeviceId = writable('')

export let fps = writable(60)

export let rollRegex = writable('')
