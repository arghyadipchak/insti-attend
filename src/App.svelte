<script lang="ts">
  import { onMount } from 'svelte'

  import { theme } from './lib/settings.svelte'
  import { component, preferDark } from './lib/system.svelte'
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
  class="flex flex-col"
  style="height: calc(100dvh + env(safe-area-inset-bottom)); padding-top: env(safe-area-inset-top);"
  data-theme={(theme.value === 'system' && preferDark.value) || theme.value === 'dark'
    ? 'dim'
    : 'cupcake'}
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
