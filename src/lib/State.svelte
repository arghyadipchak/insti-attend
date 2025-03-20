<script lang="ts">
  import {
    attendance,
    fps,
    rollRegex,
    selectedDevice,
    systemDark,
    theme,
    webhook
  } from './shared.svelte'

  $effect(() => {
    localStorage.setItem('theme', theme.value)
  })

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ev => {
    systemDark.value = ev.matches
    console.log(systemDark.value)
  })

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
