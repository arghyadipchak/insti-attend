<script lang="ts">
  import { devices } from './settings.svelte'

  import AutoScanner from './AutoScanner.svelte'
  import ManualEntry from './ManualEntry.svelte'

  let autoScanner: AutoScanner
</script>

<div class="bg-base-200 flex flex-1 flex-col items-center justify-center gap-y-10">
  {#if Object.keys(devices.label).length > 0}
    <AutoScanner bind:this={autoScanner} />
  {:else}
    <span class="text-lg font-medium">No Camera</span>
  {/if}

  <ManualEntry
    onModalOpen={() => autoScanner?.stopScanning()}
    onModalClose={() => autoScanner?.startScanning()}
  />
</div>
