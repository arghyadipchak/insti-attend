import { devices, selectedDevice } from './shared.svelte'

export async function getCameraDevices() {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true })

    const mediaDevices = await navigator.mediaDevices.enumerateDevices()
    const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput')

    if (videoDevices.length == 0) return

    if (!(selectedDevice.id && videoDevices.find(device => device.deviceId === selectedDevice.id)))
      selectedDevice.id =
        videoDevices.find(device => device.label.toLowerCase().includes('back'))?.deviceId ||
        videoDevices[0].deviceId

    console.log(videoDevices.find(device => device.label.toLowerCase().includes('Camera')))

    videoDevices.forEach(
      device =>
        (devices.label[device.deviceId] =
          device.label || `Camera ${videoDevices.indexOf(device) + 1}`)
    )
  } catch (err) {
    console.error('Error fetching camera devices:', err)
  }
}
