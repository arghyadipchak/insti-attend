<script lang="ts">
  import { decodeBarcode } from 'rxing-wasm'
  import { onDestroy, onMount } from 'svelte'

  import Modal from './Modal.svelte'
  import { fps, rollRegex, selectedDevice } from './settings.svelte'

  let videoElement: HTMLVideoElement
  let stream: MediaStream

  let frameInterval = $derived(1000 / fps.value)
  let cameraSession = 0
  let scanning = false
  let timeoutId = 0
  let isDestroyed = false

  let offscreen = new OffscreenCanvas(1, 1)
  let ctx = offscreen.getContext('2d', { willReadFrequently: true })!

  let rollNo = $state('')

  $effect(() => {
    if (selectedDevice.id) startCamera()
  })

  onMount(() => {
    window.addEventListener('resize', resizeOffscreenCanvas)
    startScanning()

    return () => window.removeEventListener('resize', resizeOffscreenCanvas)
  })

  onDestroy(() => {
    isDestroyed = true
    stopScanning()
    void stopCamera()
  })

  export function startScanning() {
    if (scanning) return
    scanning = true
    scheduleNextScan()
  }

  export function stopScanning() {
    scanning = false
    clearTimeout(timeoutId)
    timeoutId = 0
  }

  function scheduleNextScan() {
    if (!scanning) return

    const start = performance.now()
    scanCurrentFrame()

    if (!scanning) return

    const remaining = frameInterval - (performance.now() - start)
    timeoutId = setTimeout(scheduleNextScan, Math.max(0, remaining))
  }

  function resizeOffscreenCanvas() {
    if (videoElement && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
      offscreen.width = videoElement.videoWidth
      offscreen.height = videoElement.videoHeight
    }
  }

  async function startCamera() {
    const session = ++cameraSession

    try {
      if (stream) stream.getTracks().forEach(track => track.stop())

      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedDevice.id ? { exact: selectedDevice.id } : undefined
        }
      })

      if (isDestroyed || session !== cameraSession) {
        nextStream.getTracks().forEach(track => track.stop())
        return
      }

      stream = nextStream

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
    cameraSession++

    if (videoElement) {
      videoElement.onloadedmetadata = null
      videoElement.pause()
      videoElement.srcObject = null
    }

    if (stream) stream.getTracks().forEach(track => track.stop())
  }

  function scanCurrentFrame() {
    if (rollNo.length != 0) return
    if (!videoElement || videoElement.readyState < 2 || videoElement.videoWidth === 0) return

    if (
      offscreen.width !== videoElement.videoWidth ||
      offscreen.height !== videoElement.videoHeight
    )
      resizeOffscreenCanvas()

    ctx.drawImage(videoElement, 0, 0)

    try {
      const decoded = decodeBarcode(ctx, offscreen.width, offscreen.height)

      if (decoded.length == 0) return
      if (rollRegex.value && !rollRegex.value.test(decoded)) return

      stopScanning()
      rollNo = decoded
    } catch (err) {}
  }

  function closeModal() {
    rollNo = ''
    startScanning()
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

{#if rollNo.length != 0}
  <Modal {rollNo} onClose={closeModal} />
{/if}

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
