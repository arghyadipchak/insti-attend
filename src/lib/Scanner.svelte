<script lang="ts">
  import Icon from '@iconify/svelte'

  import { devices } from './settings.svelte'

  import AutoScanner from './AutoScanner.svelte'
  import Modal from './Modal.svelte'

  let autoScanner = $state<AutoScanner | undefined>(undefined)
  let isManualModalOpen = $state(false)

  function openManualModal() {
    autoScanner?.stopScanning()
    isManualModalOpen = true
  }

  function closeManualModal() {
    isManualModalOpen = false
    autoScanner?.startScanning()
  }
</script>

<div class="bg-base-200 flex flex-1 flex-col items-center justify-center gap-y-10">
  {#if Object.keys(devices.label).length > 0}
    <AutoScanner bind:this={autoScanner} />
  {:else}
    <span class="text-lg font-medium">No Camera</span>
  {/if}

  <button
    class="btn bg-primary text-primary-content transform transition-transform duration-300 ease-in-out hover:scale-110"
    onclick={openManualModal}
  >
    <Icon icon="mdi:pen" class="h-5 w-5" />
    <span class="mt-0.5">Manual Entry</span>
  </button>

  {#if isManualModalOpen}
    <Modal onClose={closeManualModal} />
  {/if}
</div>
