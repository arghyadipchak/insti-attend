<script lang="ts">
  import { onMount } from 'svelte'
  import Attendance from './lib/Attendance.svelte'
  import Dock from './lib/Dock.svelte'
  import Navbar from './lib/Navbar.svelte'
  import Scanner from './lib/Scanner.svelte'
  import Settings from './lib/Settings.svelte'
  import { devices, fps, rollRegex, selectedComponent, selectedDeviceId } from './lib/store'

  onMount(async () => {
    await getCameraDevices()

    let storedDeviceId = localStorage.getItem('deviceId')
    if ($devices.length > 0) {
      if (storedDeviceId && $devices.find(device => device.deviceId === storedDeviceId))
        selectedDeviceId.set(storedDeviceId)
      else selectedDeviceId.set($devices[0].deviceId)
    }

    let storedFps = localStorage.getItem('fps')
    if (storedFps) fps.set(Number(storedFps))

    let storedRollRegex = localStorage.getItem('rollRegex')
    if (storedRollRegex) rollRegex.set(storedRollRegex)

    selectedDeviceId.subscribe(value => localStorage.setItem('deviceId', value))
    fps.subscribe(value => localStorage.setItem('fps', value.toString()))
    rollRegex.subscribe(value => localStorage.setItem('rollRegex', value))
  })

  async function getCameraDevices() {
    try {
      let mediaDevices = await navigator.mediaDevices.enumerateDevices()
      devices.set(mediaDevices.filter(device => device.kind === 'videoinput'))
    } catch (err) {
      console.error('Error fetching camera devices:', err)
    }
  }
</script>

<main class="flex min-h-screen flex-col">
  <Navbar />

  {#if $selectedComponent === 'scanner'}
    <Scanner />
  {:else if $selectedComponent === 'attendance'}
    <Attendance />
  {:else if $selectedComponent === 'settings'}
    <Settings />
  {/if}

  <Dock />
</main>
