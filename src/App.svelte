<script lang="ts">
  import Attendance from './lib/Attendance.svelte'
  import Dock from './lib/Dock.svelte'
  import Navbar from './lib/Navbar.svelte'
  import Scanner from './lib/Scanner.svelte'
  import Settings from './lib/Settings.svelte'
  import { selectedComponent } from './lib/store'
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
