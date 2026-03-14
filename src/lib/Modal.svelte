<script lang="ts">
  import Icon from '@iconify/svelte'
  import { onMount } from 'svelte'

  import { attendance } from './attendance.svelte'
  import { allowlist, blocklist, overwrite, rollRegex } from './settings.svelte'

  interface Props {
    rollNo?: string
    edit?: boolean
    onSubmit?: () => void
    onClose?: () => void
  }
  let { rollNo = '', edit = false, onSubmit, onClose }: Props = $props()

  let modal: HTMLDialogElement

  let newRollNo = $state('')
  let comment = ''
  let newComment = $state('')

  function initializeFields() {
    newRollNo = rollNo
    comment = edit ? attendance[rollNo].comment : ''
    newComment = comment
  }

  let isMarkMode = $derived(!edit && rollNo.length != 0)

  let isInvalid = $derived(
    newRollNo.length != 0 && rollRegex.value !== null && !rollRegex.value.test(newRollNo)
  )
  let isOverwrite = $derived(
    !overwrite.value &&
      newRollNo.length != 0 &&
      newRollNo in attendance &&
      (!edit || newRollNo !== rollNo)
  )
  let isNotAllowed = $derived(
    newRollNo.length != 0 && allowlist.value.size != 0 && !allowlist.value.has(newRollNo)
  )
  let isBlocked = $derived(
    newRollNo.length != 0 && blocklist.value.size != 0 && blocklist.value.has(newRollNo)
  )

  let disableEdit = $derived(
    newRollNo.length == 0 ||
      isInvalid ||
      isOverwrite ||
      isNotAllowed ||
      isBlocked ||
      (edit && newRollNo === rollNo && newComment === comment)
  )

  function saveRecord() {
    attendance[newRollNo] = {
      timestamp: new Date(),
      auto: !edit && rollNo.length != 0,
      comment: newComment
    }

    if (edit && newRollNo !== rollNo) delete attendance[rollNo]

    if (onSubmit) onSubmit()
    modal.close()
  }

  onMount(() => {
    initializeFields()
    modal.showModal()
  })
</script>

<dialog bind:this={modal} class="modal modal-bottom" onclose={onClose}>
  <div class="modal-box">
    <form method="dialog">
      <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
    </form>

    <h3 class="text-lg font-bold">Student Details</h3>

    <fieldset class="fieldset">
      <legend class="fieldset-legend">Roll Number</legend>
      <input
        bind:value={newRollNo}
        type="text"
        class="input w-full"
        required
        readonly={isMarkMode}
        placeholder="Enter Roll No"
      />

      {#if isInvalid}
        <p class="text-warning mt-1 text-sm">⚠️ Roll No is not valid</p>
      {/if}
      {#if isOverwrite}
        <p class="text-warning mt-1 text-sm">⚠️ Roll No is already marked present</p>
      {/if}
      {#if isNotAllowed}
        <p class="text-warning mt-1 text-sm">⚠️ Roll No is not in allowlist</p>
      {/if}
      {#if isBlocked}
        <p class="text-error mt-1 text-sm">⛔ Roll No is in blocklist</p>
      {/if}

      <legend class="fieldset-legend">Comment</legend>
      <input bind:value={newComment} type="text" class="input w-full" placeholder="Enter Comment" />
    </fieldset>

    <form method="dialog" class="mt-4">
      {#if edit}
        <button class="btn btn-primary w-full" disabled={disableEdit} onclick={saveRecord}>
          <Icon icon="mdi:content-save" class="h-6 w-6" />
          <span class="mt-0.5">Save</span>
        </button>
      {:else}
        <button class="btn btn-secondary w-full" disabled={disableEdit} onclick={saveRecord}>
          Mark Present
        </button>
      {/if}
    </form>
  </div>

  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
