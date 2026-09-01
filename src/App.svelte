<script lang="ts">
  import { onMount } from 'svelte'

  import { component, getResolvedTheme } from './lib/system.svelte'
  import { initCamera } from './lib/utils'

  import Alert from './lib/Alert.svelte'
  import Attendance from './lib/Attendance.svelte'
  import Dock from './lib/Dock.svelte'
  import Navbar from './lib/Navbar.svelte'
  import Scanner from './lib/Scanner.svelte'
  import Settings from './lib/Settings.svelte'
  import State from './lib/State.svelte'

  onMount(initCamera)
</script>

<State />

<main
  class="flex w-full flex-col overflow-x-hidden"
  style="height: calc(100dvh + env(safe-area-inset-bottom)); padding-top: env(safe-area-inset-top);"
  data-theme={getResolvedTheme()}
>
  <Navbar />

  {#if component.selected === 'scanner'}
    <Scanner />
  {:else if component.selected === 'attendance'}
    <Attendance />
  {:else if component.selected === 'settings'}
    <Settings />
  {/if}

  <Alert />

  <Dock />
</main>
