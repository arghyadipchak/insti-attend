<script lang="ts">
  import { convert_imagedata_to_luma, decode_barcode } from 'rxing-wasm'
  import { onMount } from 'svelte'

  let videoElement: HTMLVideoElement
  let stream: MediaStream
  let devices: MediaDeviceInfo[] = []
  let selectedDeviceId = ''
  const fps = 60

  onMount(async () => {
    await getCameraDevices()

    setInterval(decodeBarcode, 1000 / fps)
  })

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
    }
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
    } catch (err) {
      console.error('Error accessing camera:', err)
    }
  }

  function decodeBarcode() {
    let width = videoElement.videoWidth
    let height = videoElement.videoHeight

    let offscreen = new OffscreenCanvas(width, height)
    let ctx = offscreen.getContext('2d')

    if (!ctx) return
    ctx.drawImage(videoElement, 0, 0)

    let imgData = ctx.getImageData(0, 0, width, height)
    let luma8Data = convert_imagedata_to_luma(imgData)

    try {
      let parsedBarcode = decode_barcode(luma8Data, width, height)
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
