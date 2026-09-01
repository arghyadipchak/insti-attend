export interface Alert {
  type: 'error' | 'warning' | 'settings' | 'download' | 'webhook'
  text: string
  subtext?: string
}

export const alerts = $state<Record<string, Alert>>({})

let alertCount = 0
const alertDuration = 3000
const alertTimers = new Map<string, ReturnType<typeof setTimeout>>()

export function removeAlert(id: string) {
  const timer = alertTimers.get(id)
  if (timer) {
    clearTimeout(timer)
    alertTimers.delete(id)
  }

  delete alerts[id]
}

export function showAlert(type: Alert['type'], text: string, subtext?: string) {
  const alertId = (alertCount++).toString()

  alerts[alertId] = { type, text, subtext }
  alertTimers.set(
    alertId,
    setTimeout(() => removeAlert(alertId), alertDuration)
  )
}

export function alertClass(type: Alert['type']): string {
  switch (type) {
    case 'error':
      return 'alert-error'
    case 'warning':
      return 'alert-warning'
    case 'settings':
    case 'download':
    case 'webhook':
      return 'alert-success'
  }
}

export function alertIcon(type: Alert['type']): string {
  switch (type) {
    case 'error':
    case 'warning':
      return 'lucide:alert-triangle'
    case 'settings':
      return 'lucide:save'
    case 'download':
      return 'lucide:download'
    case 'webhook':
      return 'lucide:webhook'
  }
}
