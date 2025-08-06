import { devices, selectedDevice, showAlert } from './shared.svelte'

export async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach(track => track.stop())

    const mediaDevices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput')

    if (videoDevices.length == 0) return

    selectedDevice.id && videoDevices.some(device => device.deviceId === selectedDevice.id)

    if (!(selectedDevice.id && videoDevices.find(device => device.deviceId === selectedDevice.id)))
      selectedDevice.id =
        videoDevices.find(
          device =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('rear')
        )?.deviceId || videoDevices[0].deviceId

    videoDevices.forEach(
      device =>
        (devices.label[device.deviceId] =
          device.label || `Camera ${videoDevices.indexOf(device) + 1}`)
    )
  } catch (err) {
    console.error('error fetching camera devices:', err)
  }
}

const offset = -new Date().getTimezoneOffset()
const sign = offset >= 0 ? '+' : '-'

const pad = (num: number) => String(num).padStart(2, '0')
export const toISOStringTZ = offset
  ? (date: Date) => {
      const year = date.getFullYear()
      const month = pad(date.getMonth() + 1)
      const day = pad(date.getDate())
      const hours = pad(date.getHours())
      const minutes = pad(date.getMinutes())
      const seconds = pad(date.getSeconds())

      const offsetHours = pad(Math.floor(Math.abs(offset) / 60))
      const offsetMinutes = pad(Math.abs(offset) % 60)

      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMinutes}`
    }
  : (date: Date) => date.toISOString()

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.setAttribute('href', url)
  link.setAttribute('download', name)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function postWebhook(url: string, token: string, body: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && {
          Authorization: `Bearer ${token}`
        })
      },
      body: body
    })

    if (response.ok) {
      showAlert('webhook-success', 'WebHook Success!')
      return true
    } else
      showAlert('webhook-error', 'WebHook Failed!', `${response.status}: ${response.statusText}`)
  } catch {
    showAlert('webhook-error', 'WebHook Error!')
  }

  return false
}
