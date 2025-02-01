<script>
  import Dock from './lib/Dock.svelte'
  import Navbar from './lib/Navbar.svelte'
  import Scanner from './lib/Scanner.svelte'
</script>

<main class="flex min-h-screen flex-col">
  <Navbar />

  <Scanner />

  <Dock />
</main>
