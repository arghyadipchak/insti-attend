<script lang="ts">
  import Icon from '@iconify/svelte'
  import { convert_imagedata_to_luma, decode_barcode } from 'rxing-wasm'
  import { onDestroy, onMount } from 'svelte'
  import { attendance, fps, rollRegex, selectedDevice } from './shared.svelte'

  let videoElement: HTMLVideoElement
  let stream: MediaStream
  let intervalId = 0

  let offscreen = new OffscreenCanvas(1, 1)
  let ctx = offscreen.getContext('2d', { willReadFrequently: true })!

  let autoModal: HTMLDialogElement
  let manualModal: HTMLDialogElement

  let rollNo = $state('')
  let manualReason = $state('no id card')
  let rollNoValid = $derived(!rollNo || rollNo.match(rollRegex.value) !== null)

  $effect(() => {
    if (selectedDevice.id) startCamera()
  })

  window.addEventListener('resize', resizeOffscreenCanvas)

  onMount(startInterval)

  onDestroy(async () => {
    stopInterval()
    await stopCamera()
  })

  function startInterval() {
    if (intervalId) return
    intervalId = setInterval(decodeBarcode, 1000 / fps.value)
  }

  function stopInterval() {
    clearInterval(intervalId)
    intervalId = 0
  }

  function resizeOffscreenCanvas() {
    if (videoElement && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
      offscreen.width = videoElement.videoWidth
      offscreen.height = videoElement.videoHeight
    }
  }

  async function startCamera() {
    try {
      if (stream) stream.getTracks().forEach(track => track.stop())

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedDevice.id ? { exact: selectedDevice.id } : undefined
        }
      })

      videoElement.onloadedmetadata = resizeOffscreenCanvas
      videoElement.srcObject = stream
      videoElement.play()
    } catch (err) {
      console.error('Error accessing camera:', err)
    }
  }

  async function stopCamera() {
    videoElement.pause()
    videoElement.srcObject = null

    if (stream) stream.getTracks().forEach(track => track.stop())
  }

  function decodeBarcode() {
    ctx.drawImage(videoElement, 0, 0)

    let imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height)
    let luma8Data = convert_imagedata_to_luma(imgData)

    try {
      let decoded = decode_barcode(luma8Data, offscreen.width, offscreen.height).text()
      if (!rollRegex.value || decoded.match(rollRegex.value) !== null) {
        rollNo = decoded
        autoOpen()
      }
    } catch {}
  }

  function autoOpen() {
    stopInterval()
    autoModal.showModal()
  }

  function manualOpen() {
    stopInterval()
    rollNo = ''
    manualModal.showModal()
  }

  function autoPresent() {
    attendance[rollNo] = { timestamp: new Date(), auto: true, reason: '' }
  }

  function manualPresent() {
    attendance[rollNo] = { timestamp: new Date(), auto: false, reason: manualReason }
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

  <button
    class="btn bg-primary text-primary-content transform transition-transform duration-300 ease-in-out hover:scale-110"
    onclick={manualOpen}
  >
    <Icon icon="mdi:pen" class="h-5 w-5" />
    <span class="mt-0.5">Manual Entry</span>
  </button>

  <dialog bind:this={autoModal} class="modal modal-bottom" onclose={startInterval}>
    <div class="modal-box items-center gap-y-4">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
      </form>

      <h3 class="text-center font-bold">{rollNo}</h3>

      <form method="dialog">
        <button class="btn btn-secondary mt-4 w-full" onclick={autoPresent}>Mark Present</button>
      </form>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>

  <dialog bind:this={manualModal} class="modal modal-bottom" onclose={startInterval}>
    <div class="modal-box">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
      </form>

      <h3 class="text-lg font-bold">Enter Student Details</h3>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Roll Number</legend>
        <input bind:value={rollNo} type="text" class="input w-full" placeholder="Enter Roll No" />
        <span class="text-error font-bold" class:invisible={rollNoValid}>
          Invalid Roll No! Fix Regex?
        </span>

        <legend class="fieldset-legend">Reason</legend>
        <div class="flex items-center gap-x-2">
          <input
            bind:group={manualReason}
            type="radio"
            name="reason-radio"
            class="radio"
            value="no id card"
          />
          <span>ID card unavailable</span>
        </div>
        <div class="flex items-center space-x-2">
          <input
            bind:group={manualReason}
            type="radio"
            name="reason-radio"
            class="radio"
            value="not scanable"
          />
          <span>ID card available</span>
        </div>
      </fieldset>

      <form method="dialog">
        <button
          class="btn btn-secondary mt-4 w-full"
          class:btn-disabled={!rollNoValid}
          onclick={manualPresent}
        >
          Mark Present
        </button>
      </form>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</div>

<style>
  .animate-blink {
    animation: blink 1s infinite ease-in-out;
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
</style>
