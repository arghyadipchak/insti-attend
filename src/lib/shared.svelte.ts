interface ComponentType {
  selected: 'scanner' | 'attendance' | 'settings'
}
export const component = $state<ComponentType>({ selected: 'scanner' })

export const devices = $state({
  label: {} as Record<string, string>
})
export const selectedDevice = $state({ id: localStorage.getItem('deviceId') || '' })

export const fps = $state({ value: Number(localStorage.getItem('fps') || '60') })

export const rollRegex = $state({ value: localStorage.getItem('rollRegex') || '' })

interface WebHook {
  url: string
  authToken: string
}
export const webhook = $state<WebHook>(JSON.parse(localStorage.getItem('webhook') || '{}'))

interface AttendanceRecord {
  timestamp: Date
  auto: boolean
  reason: string
}
export const attendance = $state<Record<string, AttendanceRecord>>(
  JSON.parse(localStorage.getItem('attendance') || '{}', (key, value) => {
    return key === 'timestamp' && typeof value === 'string' ? new Date(value) : value
  })
)

interface Alert {
  type: 'settings' | 'download' | 'webhook-success' | 'webhook-error'
  text: string
  subtext?: string
}
export const alerts = $state<Record<string, Alert>>({})

let alertCount = 0
const alertDuration = 3000

export function removeAlert(id: string) {
  delete alerts[id]
}

export function showAlert(type: Alert['type'], text: string, subtext?: string) {
  const alertId = (alertCount++).toString()
  alerts[alertId] = { type, text, subtext }
  setTimeout(() => removeAlert(alertId), alertDuration)
}
