<script lang="ts">
  import Icon from '@iconify/svelte'
  import { attendance, rollRegex } from './shared.svelte'

  interface Props {
    onModalOpen?: () => void
    onModalClose?: () => void
  }
  let { onModalOpen, onModalClose }: Props = $props()

  let modal: HTMLDialogElement

  let rollNo = $state('')
  let comment = $state('')

  function openModal() {
    if (onModalOpen) onModalOpen()
    modal.showModal()
  }

  function markPresent() {
    attendance[rollNo] = { timestamp: new Date(), auto: false, comment: comment }
    rollNo = ''
    comment = ''
  }
</script>

<button
  class="btn bg-primary text-primary-content transform transition-transform duration-300 ease-in-out hover:scale-110"
  onclick={openModal}
>
  <Icon icon="mdi:pen" class="h-5 w-5" />
  <span class="mt-0.5">Manual Entry</span>
</button>

<dialog bind:this={modal} class="modal modal-bottom" onclose={onModalClose}>
  <div class="modal-box">
    <form method="dialog">
      <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
    </form>

    <h3 class="text-lg font-bold">Enter Student Details</h3>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">Roll Number</legend>
      {#if rollRegex.value}
        <input
          bind:value={rollNo}
          type="text"
          class="input validator w-full"
          required
          placeholder="Enter Roll No"
          pattern={rollRegex.value}
        />
        <p class="validator-hint hidden">Must be valid Roll No</p>
      {:else}
        <input
          bind:value={rollNo}
          type="text"
          class="input w-full"
          required
          placeholder="Enter Roll No"
        />
      {/if}

      <legend class="fieldset-legend">Comment</legend>
      <input
        bind:value={comment}
        type="text"
        class="input w-full"
        required
        placeholder="Enter Comment"
      />
    </fieldset>

    <form method="dialog">
      <button
        class="btn btn-secondary mt-4 w-full"
        disabled={!rollNo || (!!rollRegex.value && rollNo.match(rollRegex.value) === null)}
        onclick={markPresent}
      >
        Mark Present
      </button>
    </form>
  </div>

  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
