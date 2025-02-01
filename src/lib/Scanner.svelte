<script lang="ts">
  import Icon from '@iconify/svelte'
  import { convert_imagedata_to_luma, decode_barcode } from 'rxing-wasm'
  import { onDestroy, onMount } from 'svelte'

  let videoElement: HTMLVideoElement
  let stream: MediaStream
  let devices: MediaDeviceInfo[] = []
  let selectedDeviceId = ''
  let intervalId: number

  let offscreen = new OffscreenCanvas(1, 1)
  let ctx = offscreen.getContext('2d', { willReadFrequently: true })!

  const fps = 60

  let popupModal: HTMLDialogElement

  onMount(async () => {
    window.addEventListener('resize', resizeOffscreenCanvas)

    if (await getCameraDevices()) {
      intervalId = setInterval(decodeBarcode, 1000 / fps)
    }
  })

  onDestroy(() => {
    window.removeEventListener('resize', resizeOffscreenCanvas)

    if (stream) stream.getTracks().forEach(track => track.stop())

    clearInterval(intervalId)
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

<div class="bg-base-300 flex flex-1 flex-col items-center justify-center gap-y-10">
  <div class="relative w-full max-w-md">
    <video bind:this={videoElement} class="h-full w-full p-8" autoplay>
      <track kind="captions" />
    </video>
    <div class="pointer-events-none absolute inset-0 m-10 flex items-center justify-between">
      <div
        class="animate-blink absolute top-4 left-4 h-10 w-10 rounded-tl-lg border-t-4 border-l-4 border-white"
      ></div>
      <div
        class="animate-blink absolute top-4 right-4 h-10 w-10 rounded-tr-lg border-t-4 border-r-4 border-white"
      ></div>
      <div
        class="animate-blink absolute bottom-4 left-4 h-10 w-10 rounded-bl-lg border-b-4 border-l-4 border-white"
      ></div>
      <div
        class="animate-blink absolute right-4 bottom-4 h-10 w-10 rounded-br-lg border-r-4 border-b-4 border-white"
      ></div>
    </div>
  </div>

  <span class="text-lg font-medium">Scan Barcode to Mark Attendance</span>

  <button class="btn bg-primary text-primary-content" onclick={() => popupModal.showModal()}>
    <Icon icon="mdi:pen" height="1.2rem" />
    Take Manual Entry
  </button>

  <dialog bind:this={popupModal} class="modal modal-bottom">
    <div class="modal-box">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
      </form>
      <h3 class="text-lg font-bold">Enter student details</h3>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Roll Number</legend>
        <input type="text" class="input mb-4" placeholder="Type here" />
        <div class="flex items-center space-x-2">
          <input type="radio" name="radio-1" class="radio" checked={true} />
          <span>ID card unavailable</span>
        </div>
        <div class="flex items-center space-x-2">
          <input type="radio" name="radio-1" class="radio" />
          <span>ID card available</span>
        </div>
        <button class="btn btn-neutral mt-4">Present</button>
      </fieldset>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>

  <!-- dummy div to take some space -->
  <div class="h-20"></div>
</div>

<!-- <div class="space-y-2">
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
  </div> -->
