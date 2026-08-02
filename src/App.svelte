<script lang="ts">
  import { onMount } from 'svelte'

  import { theme } from './lib/stores/settings.svelte'
  import { component, preferDark } from './lib/stores/system.svelte'
  import { initCamera } from './lib/utils'

  import Alert from './lib/Alert.svelte'
  import Attendance from './lib/Attendance.svelte'
  import Confirm from './lib/Confirm.svelte'
  import Dock from './lib/Dock.svelte'
  import EventBar from './lib/EventBar.svelte'
  import Navbar from './lib/Navbar.svelte'
  import Settings from './lib/Settings.svelte'
  import State from './lib/State.svelte'

  // lazy loading the scanner
  const loadScanner = () => import('./lib/Scanner.svelte')

  onMount(initCamera)
</script>

<State />

<main
  class="flex flex-col"
  style="height: calc(100dvh + env(safe-area-inset-bottom)); padding-top: env(safe-area-inset-top);"
  data-theme={(theme.value === 'system' && preferDark.value) || theme.value === 'dark'
    ? 'dim'
    : 'cupcake'}
>
  <Navbar />

  {#if component.selected === 'scanner' || component.selected === 'attendance'}
    <EventBar />
  {/if}

  {#if component.selected === 'scanner'}
    {#await loadScanner() then { default: Scanner }}
      <Scanner />
    {/await}
  {:else if component.selected === 'attendance'}
    <Attendance />
  {:else if component.selected === 'settings'}
    <Settings />
  {/if}

  <Dock />

  <Alert />
  <Confirm />
</main>
