<script lang="ts">
  import { onMount } from 'svelte'

  let videoElement: HTMLVideoElement
  let stream: MediaStream
  let devices: MediaDeviceInfo[] = []
  let selectedDeviceId = ''

  onMount(getCameraDevices)

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
