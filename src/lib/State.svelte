<script lang="ts">
  import { onDestroy } from 'svelte'

  import { attendance } from './attendance.svelte'
  import {
    allowlist,
    blocklist,
    fps,
    overwrite,
    rollRegex,
    selectedDevice,
    theme,
    webhook
  } from './settings.svelte'
  import { preferDark } from './system.svelte'

  $effect(() => {
    localStorage.setItem('theme', theme.value)
  })

  const systemDarkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const onSystemDarkChange = (ev: MediaQueryListEvent) => {
    preferDark.value = ev.matches
  }

  systemDarkMediaQuery.addEventListener('change', onSystemDarkChange)

  $effect(() => {
    localStorage.setItem('deviceId', selectedDevice.id)
  })

  $effect(() => {
    localStorage.setItem('fps', fps.value.toString())
  })

  $effect(() => {
    localStorage.setItem('rollRegex', rollRegex.value?.source || '')
  })

  $effect(() => {
    localStorage.setItem('allowlist', JSON.stringify([...allowlist.value]))
  })

  $effect(() => {
    localStorage.setItem('blocklist', JSON.stringify([...blocklist.value]))
  })

  $effect(() => {
    localStorage.setItem('overwrite', overwrite.value.toString())
  })

  $effect(() => {
    localStorage.setItem('webhook', JSON.stringify(webhook))
  })

  function deepRead(val: unknown): void {
    if (val !== null && typeof val === 'object') {
      for (const key of Object.keys(val)) {
        deepRead((val as Record<string, unknown>)[key])
      }
    }
  }

  let attendanceSaveTimer = 0
  $effect(() => {
    deepRead(attendance)
    clearTimeout(attendanceSaveTimer)

    attendanceSaveTimer = setTimeout(
      () => localStorage.setItem('attendance', JSON.stringify($state.snapshot(attendance))),
      500
    )
  })

  onDestroy(() => {
    systemDarkMediaQuery.removeEventListener('change', onSystemDarkChange)
    clearTimeout(attendanceSaveTimer)
  })
</script>
