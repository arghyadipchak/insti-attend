export interface ConfirmState {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  resolve: ((ok: boolean) => void) | null
}

export const confirmState = $state<ConfirmState>({
  open: false,
  title: 'Are you sure?',
  message: '',
  confirmLabel: 'Confirm',
  resolve: null
})

export function confirmAction(
  message: string,
  opts?: { title?: string; confirmLabel?: string }
): Promise<boolean> {
  return new Promise(resolve => {
    confirmState.resolve?.(false)

    confirmState.title = opts?.title ?? 'Are you sure?'
    confirmState.message = message
    confirmState.confirmLabel = opts?.confirmLabel ?? 'Confirm'
    confirmState.resolve = resolve
    confirmState.open = true
  })
}

export function resolveConfirm(ok: boolean) {
  confirmState.resolve?.(ok)
  confirmState.resolve = null
  confirmState.open = false
}
