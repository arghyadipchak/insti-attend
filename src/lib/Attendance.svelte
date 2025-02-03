<script lang="ts">
  import Icon from '@iconify/svelte'
  import { attendance, rollRegex } from './shared.svelte'

  let totalCount = $derived(Object.keys(attendance).length)
  let autoCount = $derived(Object.keys(attendance).filter(id => attendance[id].auto).length)
  let manualCount = $derived(totalCount - autoCount)

  function getPercentage(count: number, total: number): string {
    return total > 0 ? ((count / total) * 100).toFixed(2) : '0.00'
  }

  function convertToCSV() {
    let str = 'rollNo,auto,reason\n'

    for (const [rollNo, record] of Object.entries(attendance)) {
      str += `${rollNo},${record.auto},${record.reason}\n`
    }

    return str
  }

  function downloadCSV() {
    const csv = convertToCSV()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'attendance.csv')
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  let allChecked = $state(false)
  let selectedRollNo = $state(new Set([] as string[]))

  function toggleAll() {
    selectedRollNo = allChecked ? new Set(Object.keys(attendance)) : new Set([])
  }

  function toggle(rollNo: string) {
    selectedRollNo = selectedRollNo.has(rollNo)
      ? new Set([...selectedRollNo].filter(rn => rn !== rollNo))
      : new Set([...selectedRollNo, rollNo])
  }

  function deleteSelected() {
    for (const rollNo of selectedRollNo) delete attendance[rollNo]
    selectedRollNo = new Set([])
    allChecked = false
  }

  let editModal: HTMLDialogElement
  let oldRollNo = ''
  let editRollNo = $state('')
  let editAuto = $state(false)
  let editReason = $state('')
  let rollNoValid = $derived(editRollNo.match(rollRegex.value) !== null)

  function editOpen(rollNo: string) {
    oldRollNo = rollNo
    editRollNo = rollNo
    editAuto = attendance[rollNo].auto
    editReason = attendance[rollNo].reason || 'no id card'

    editModal.showModal()
  }

  function editSave() {
    attendance[editRollNo] = {
      auto: editAuto,
      reason: editAuto ? '' : editReason
    }

    if (oldRollNo !== editRollNo) delete attendance[oldRollNo]

    editModal.close()
  }
</script>

<div class="flex flex-1 flex-col items-center justify-center gap-y-4">
  <div class="stats bg-base-200 border-base-300 w-fit border">
    <div class="stat place-items-center">
      <div class="stat-title">Entries</div>
      <div class="stat-value text-info">{totalCount}</div>
      <div class="stat-desc text-info">
        Auto: {autoCount} ({getPercentage(autoCount, totalCount)}%)
      </div>
      <div class="stat-desc text-info">
        Manual: {manualCount} ({getPercentage(manualCount, totalCount)}%)
      </div>
    </div>
    <div class="stat place-items-center">
      <div class="stat-title">Export</div>
      <div class="stat-actions">
        <button
          class="btn btn-xs btn-success transform transition-transform duration-300 ease-in-out hover:scale-110"
          onclick={downloadCSV}
        >
          <Icon icon="fa6-solid:download" class="h-3 w-3" />
          <span class="mt-1">CSV</span>
        </button>
      </div>
    </div>
  </div>

  <div class="w-full overflow-x-auto" style="height: calc(100vh - 300px);">
    <table class="table-pin-rows table-xs table-zebra table w-full">
      <thead>
        <tr>
          <th>
            <label>
              <input
                bind:checked={allChecked}
                type="checkbox"
                class="checkbox checkbox-xs"
                onchange={toggleAll}
              />
            </label>
          </th>
          <th>Roll No</th>
          <th>Auto</th>
          <th>Reason</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        {#each Object.entries(attendance) as [rollNo, record]}
          <tr>
            <th>
              <label>
                <input
                  type="checkbox"
                  class="checkbox checkbox-xs"
                  checked={selectedRollNo.has(rollNo)}
                  onchange={() => {
                    toggle(rollNo)
                  }}
                />
              </label>
            </th>
            <td>{rollNo}</td>
            <td>{record.auto ? 'Yes' : 'No'}</td>
            <td>{record.reason ? record.reason : '-'}</td>
            <td>
              <button
                class="btn btn-xs btn-accent btn-square transform transition-transform duration-300 hover:scale-110"
                onclick={() => {
                  editOpen(rollNo)
                }}
              >
                <Icon icon="tabler:edit" class="h-4 w-4" />
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if selectedRollNo.size > 0}
    <button
      class="btn btn-sm btn-error btn-square fixed bottom-20 transform transition-transform duration-300 ease-in-out hover:scale-110"
    >
      <Icon icon="mingcute:delete-line" class="h-4 w-4" onclick={deleteSelected} />
    </button>
  {/if}

  <dialog bind:this={editModal} class="modal modal-bottom">
    <div class="modal-box">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
      </form>

      <h3 class="text-lg font-bold">Edit Student Details</h3>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Roll Number</legend>
        <input
          bind:value={editRollNo}
          type="text"
          class="input w-full"
          placeholder="Enter Roll No"
        />
        <span class="text-error font-bold" class:invisible={rollNoValid}>
          Invalid Roll No! Fix Regex?
        </span>

        <legend class="fieldset-legend">Auto</legend>
        <input bind:checked={editAuto} type="checkbox" class="toggle" />

        {#if !editAuto}
          <legend class="fieldset-legend">Reason</legend>
          <div class="flex items-center gap-x-2">
            <input
              bind:group={editReason}
              type="radio"
              name="reason-radio"
              class="radio"
              value="no id card"
            />
            <span>ID card unavailable</span>
          </div>
          <div class="flex items-center space-x-2">
            <input
              bind:group={editReason}
              type="radio"
              name="reason-radio"
              class="radio"
              value="not scanable"
            />
            <span>ID card available</span>
          </div>
        {/if}
      </fieldset>

      <form method="dialog" class="mt-4">
        <button class="btn btn-primary w-full" class:btn-disabled={!rollNoValid} onclick={editSave}>
          <Icon icon="mdi:content-save" class="h-6 w-6" />
          <span class="mt-0.5">Save</span>
        </button>
      </form>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</div>
