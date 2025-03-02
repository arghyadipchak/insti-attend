<script lang="ts">
  import { attendance, fps, rollRegex, selectedDevice, webhook } from './shared.svelte'

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
    localStorage.setItem('webhook', JSON.stringify(webhook))
  })

  $effect(() => {
    localStorage.setItem('attendance', JSON.stringify(attendance))
  })
</script>
