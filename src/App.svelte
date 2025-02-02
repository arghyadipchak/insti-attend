<script lang="ts">
  import { onMount } from 'svelte'
  import Attendance from './lib/Attendance.svelte'
  import Dock from './lib/Dock.svelte'
  import Navbar from './lib/Navbar.svelte'
  import Scanner from './lib/Scanner.svelte'
  import Settings from './lib/Settings.svelte'
  import { devices, selectedComponent, selectedDeviceId } from './lib/store'

  onMount(() => {
    getCameraDevices()
  })

  async function getCameraDevices() {
    try {
      let localDevices = (await navigator.mediaDevices.enumerateDevices()).filter(
        device => device.kind === 'videoinput'
      )
      devices.set(localDevices)
      if (localDevices.length > 0) selectedDeviceId.set(localDevices[0].deviceId)
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
