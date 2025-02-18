<script lang="ts">
  import { onMount } from 'svelte'
  import Attendance from './lib/Attendance.svelte'
  import Dock from './lib/Dock.svelte'
  import Navbar from './lib/Navbar.svelte'
  import NoCamera from './lib/NoCamera.svelte'
  import Scanner from './lib/Scanner.svelte'
  import Settings from './lib/Settings.svelte'
  import {
    attendance,
    component,
    devices,
    fps,
    rollRegex,
    selectedDevice
  } from './lib/shared.svelte'

  $effect(() => {
    localStorage.setItem('deviceId', selectedDevice.id)
  })

  $effect(() => {
    localStorage.setItem('fps', fps.value.toString())
  })

  $effect(() => {
    localStorage.setItem('rollRegex', rollRegex.value)
  })

  $effect(() => {
    localStorage.setItem('attendance', JSON.stringify(attendance))
  })

  onMount(getCameraDevices)

  async function getCameraDevices() {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })

      const mediaDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput')

      if (videoDevices.length == 0) return

      if (
        !(selectedDevice.id && videoDevices.find(device => device.deviceId === selectedDevice.id))
      )
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
</script>

<main class="flex h-screen flex-col">
  <Navbar />

  {#if component.selected === 'scanner'}
    {#if Object.keys(devices.label).length > 0}
      <Scanner />
    {:else}
      <NoCamera />
    {/if}
  {:else if component.selected === 'attendance'}
    <Attendance />
  {:else if component.selected === 'settings'}
    <Settings />
  {/if}

  <Dock />
</main>
