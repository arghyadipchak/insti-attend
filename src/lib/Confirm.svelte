<script lang="ts">
  import Icon from '@iconify/svelte'

  import { confirmState, resolveConfirm } from './stores/confirm.svelte'

  let dialog: HTMLDialogElement

  $effect(() => {
    if (!dialog) return
    if (confirmState.open && !dialog.open) dialog.showModal()
    else if (!confirmState.open && dialog.open) dialog.close()
  })
</script>

<dialog
  bind:this={dialog}
  class="modal modal-bottom sm:modal-middle"
  onclose={() => resolveConfirm(false)}
>
  <div class="modal-box">
    <h3 class="flex items-center gap-2 text-lg font-bold">
      <Icon icon="mingcute:alert-line" class="text-error h-5 w-5 shrink-0" />
      {confirmState.title}
    </h3>
    <p class="text-base-content/70 py-3 text-sm">{confirmState.message}</p>
    <div class="modal-action">
      <button type="button" class="btn btn-ghost" onclick={() => resolveConfirm(false)}>
        Cancel
      </button>
      <button type="button" class="btn btn-error" onclick={() => resolveConfirm(true)}>
        {confirmState.confirmLabel}
      </button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
