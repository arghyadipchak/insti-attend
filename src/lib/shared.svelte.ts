interface ComponentType {
  selected: 'scanner' | 'attendance' | 'settings'
}
export let component = $state<ComponentType>({ selected: 'scanner' })

export let devices = $state({
  label: {} as Record<string, string>
})
export let selectedDevice = $state({ id: '' })

export let fps = $state({ value: Number(localStorage.getItem('fps') || '60') })

export let rollRegex = $state({ value: localStorage.getItem('rollRegex') || '' })

interface AttendanceRecord {
  auto: boolean
  reason: string
}
export const attendance = $state<Record<string, AttendanceRecord>>(
  JSON.parse(localStorage.getItem('attendance') || '{}')
)
