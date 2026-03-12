<script lang="ts">
  import Icon from '@iconify/svelte'
  import { attendance, overwrite, rollRegex } from './shared.svelte'

  interface Props {
    onModalOpen?: () => void
    onModalClose?: () => void
  }
  let { onModalOpen, onModalClose }: Props = $props()

  let modal: HTMLDialogElement

  let rollNo = $state('')
  let comment = $state('')

  let isOverwrite = $derived(rollNo.length != 0 && !overwrite.value && rollNo in attendance)
  let isInvalid = $derived(
    rollNo.length != 0 && rollRegex.value.length != 0 && rollNo.match(rollRegex.value) === null
  )

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
      <input
        bind:value={rollNo}
        type="text"
        class="input w-full"
        required
        placeholder="Enter Roll No"
      />
      {#if isOverwrite}
        <p class="text-warning mt-1 text-sm">⚠️ Roll No is already marked present</p>
      {/if}
      {#if isInvalid}
        <p class="text-warning mt-1 text-sm">⚠️ Must be valid Roll No</p>
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
        disabled={rollNo.length == 0 || isOverwrite || isInvalid}
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
