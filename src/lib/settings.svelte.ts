export const devices = $state({
  label: {} as Record<string, string>
})
export const selectedDevice = $state({ id: localStorage.getItem('deviceId') || '' })

export const fps = $state({ value: Number(localStorage.getItem('fps') || '10') })

function parseStoredList(key: string): Set<string> {
  const rawValue = localStorage.getItem(key)
  if (!rawValue) return new Set()

  try {
    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) return new Set()

    return new Set(parsed.filter((item): item is string => typeof item === 'string'))
  } catch {
    return new Set()
  }
}

function parseStoredRollRegex(): RegExp | null {
  const rawValue = localStorage.getItem('rollRegex') || ''
  if (rawValue.length === 0) return null

  try {
    return new RegExp(rawValue)
  } catch {
    return null
  }
}

export const rollRegex = $state({ value: parseStoredRollRegex() })

export function setRollRegex(source: string): boolean {
  if (source.length === 0) {
    rollRegex.value = null
    return true
  }

  try {
    rollRegex.value = new RegExp(source)
    return true
  } catch {
    return false
  }
}

export const allowlist = $state({ value: parseStoredList('allowlist') })
export const blocklist = $state({ value: parseStoredList('blocklist') })
export const overwrite = $state({ value: localStorage.getItem('overwrite') !== 'false' })

interface WebHook {
  url: string
  authToken: string
}
export const webhook = $state<WebHook>(JSON.parse(localStorage.getItem('webhook') || '{}'))

interface Theme {
  value: 'system' | 'light' | 'dark'
}

export const theme = $state<Theme>({
  value: (localStorage.getItem('theme') as Theme['value'] | null) || 'system'
})
