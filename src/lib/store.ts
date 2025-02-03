import { writable } from 'svelte/store'

export type ComponentType = 'scanner' | 'attendance' | 'settings'
export let selectedComponent = writable<ComponentType>('scanner')

export let devices = writable<MediaDeviceInfo[]>([])
export let selectedDeviceId = writable('')

export let fps = writable(60)

export let rollRegex = writable('')

interface AttendanceRecord {
  auto: boolean
  reason: string
}
type AttendanceStore = Record<string, AttendanceRecord>
export const attendance = writable<AttendanceStore>({})
