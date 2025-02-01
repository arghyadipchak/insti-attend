<script lang="ts">
  import { convert_imagedata_to_luma, decode_barcode } from 'rxing-wasm'
  import { onMount } from 'svelte'

  let videoElement: HTMLVideoElement
  let stream: MediaStream
  let devices: MediaDeviceInfo[] = []
  let selectedDeviceId = ''

  let offscreen = new OffscreenCanvas(1, 1)
  let ctx = offscreen.getContext('2d', { willReadFrequently: true })!

  const fps = 60

  onMount(async () => {
    window.addEventListener('resize', resizeOffscreenCanvas)

    if (await getCameraDevices()) setInterval(decodeBarcode, 1000 / fps)
  })

  function resizeOffscreenCanvas() {
    if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
      offscreen.width = videoElement.videoWidth
      offscreen.height = videoElement.videoHeight
    }
  }

  async function getCameraDevices() {
    try {
      devices = (await navigator.mediaDevices.enumerateDevices()).filter(
        device => device.kind === 'videoinput'
      )
      if (devices.length > 0) {
        selectedDeviceId = devices[0].deviceId
        await startCamera()
      }
    } catch (err) {
      console.error('Error fetching camera devices:', err)
      return false
    }

    return true
  }

  async function startCamera() {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
        }
      })

      videoElement.srcObject = stream
      videoElement.play()
      videoElement.onloadedmetadata = resizeOffscreenCanvas
    } catch (err) {
      console.error('Error accessing camera:', err)
    }
  }

  function decodeBarcode() {
    ctx.drawImage(videoElement, 0, 0)

    let imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height)
    let luma8Data = convert_imagedata_to_luma(imgData)

    try {
      let parsedBarcode = decode_barcode(luma8Data, offscreen.width, offscreen.height)
      console.log('Parsed:', parsedBarcode.text())
    } catch {}
  }
</script>

<main class="space-y-4 p-4">
  <div class="space-y-2">
    <label for="camera-select" class="block font-medium">Select Camera:</label>
    <select
      id="camera-select"
      bind:value={selectedDeviceId}
      on:change={startCamera}
      class="w-full rounded border border-gray-300 p-2"
    >
      {#each devices as device}
        <option value={device.deviceId}>
          {device.label || `Camera ${devices.indexOf(device) + 1}`}
        </option>
      {/each}
    </select>
  </div>

  <video bind:this={videoElement} class="w-full border border-gray-300" autoplay>
    <track kind="captions" />
  </video>
</main>
