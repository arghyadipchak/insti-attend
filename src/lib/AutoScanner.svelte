<script lang="ts">
  import { decode_barcode } from 'rxing-wasm'
  import { onDestroy, onMount } from 'svelte'
  import { attendance, fps, rollRegex, selectedDevice } from './shared.svelte'

  let videoElement: HTMLVideoElement
  let stream: MediaStream
  let intervalId = 0

  let offscreen = new OffscreenCanvas(1, 1)
  let ctx = offscreen.getContext('2d', { willReadFrequently: true })!

  let modal: HTMLDialogElement

  let rollNo = $state('')
  let comment = $state('')

  $effect(() => {
    if (selectedDevice.id) startCamera()
  })

  window.addEventListener('resize', resizeOffscreenCanvas)

  onMount(startScanning)

  onDestroy(async () => {
    stopScanning()
    await stopCamera()
  })

  export function startScanning() {
    if (intervalId) return
    intervalId = setInterval(decodeBarcode, 1000 / fps.value)
  }

  export function stopScanning() {
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

      const track = stream.getVideoTracks()[0]
      // @ts-ignore
      if (track.getCapabilities().focusDistance)
        await track.applyConstraints({
          // @ts-ignore
          advanced: [{ focusMode: 'continuous' }]
        })

      videoElement.onloadedmetadata = resizeOffscreenCanvas
      videoElement.srcObject = stream
      videoElement.play()
    } catch (err) {
      console.error('error accessing camera:', err)
    }
  }

  async function stopCamera() {
    videoElement.pause()
    videoElement.srcObject = null

    if (stream) stream.getTracks().forEach(track => track.stop())
  }

  function decodeBarcode() {
    if (!videoElement || videoElement.readyState < 2 || videoElement.videoWidth === 0) return

    if (
      offscreen.width !== videoElement.videoWidth ||
      offscreen.height !== videoElement.videoHeight
    )
      resizeOffscreenCanvas()

    ctx.drawImage(videoElement, 0, 0)

    const decoded = decode_barcode(ctx, offscreen.width, offscreen.height)
    if (!decoded || (!!rollRegex.value && decoded.match(rollRegex.value) === null)) return

    rollNo = decoded
    openModal()
  }

  function openModal() {
    stopScanning()
    modal.showModal()
  }

  function markPresent() {
    attendance[rollNo] = { timestamp: new Date(), auto: true, comment: comment }
    rollNo = ''
    comment = ''
  }
</script>

<div class="relative w-full max-w-md">
  <div class="relative aspect-4/3 overflow-hidden">
    <video
      bind:this={videoElement}
      class="absolute inset-0 h-full w-full object-cover p-8"
      autoplay
      playsinline
    >
      <track kind="captions" />
    </video>
  </div>
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

<dialog bind:this={modal} class="modal modal-bottom" onclose={startScanning}>
  <div class="modal-box items-center gap-y-4">
    <form method="dialog">
      <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
    </form>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">Roll Number</legend>
      <input bind:value={rollNo} type="text" class="input validator w-full" required readonly />

      <legend class="fieldset-legend">Comment</legend>
      <input
        bind:value={comment}
        type="text"
        class="input w-full"
        required
        placeholder="Enter Comment"
      />
    </fieldset>

    <form method="dialog">
      <button class="btn btn-secondary mt-4 w-full" onclick={markPresent}>Mark Present</button>
    </form>
  </div>

  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>

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
