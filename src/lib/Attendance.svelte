<script lang="ts">
  import Icon from '@iconify/svelte'

  import { showAlert } from './stores/alert.svelte'
  import { attendance } from './stores/attendance.svelte'
  import { currentEvent, events } from './stores/events.svelte'
  import { webhook } from './stores/settings.svelte'
  import { download, postWebhook, toISOStringTZ } from './utils'

  import Modal from './Modal.svelte'

  let records = $derived(attendance[currentEvent.id] ?? {})
  let event = $derived(events.find(e => e.id === currentEvent.id))
  let attendanceEntries = $derived(Object.entries(records))
  let stats = $derived.by(() => {
    const total = attendanceEntries.length
    let auto = 0

    for (const [, record] of attendanceEntries) if (record.auto) auto++

    return { total, auto, manual: total - auto }
  })

  function getPercentage(count: number, total: number): string {
    return total > 0 ? ((count / total) * 100).toFixed(2) : '0.00'
  }

  function csvCell(value: string): string {
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  }

  function attendanceCSV() {
    let str = 'rollNo,timestamp,auto,comment\n'
    for (const [rollNo, record] of attendanceEntries)
      str +=
        [
          csvCell(rollNo),
          toISOStringTZ(record.timestamp),
          String(record.auto),
          csvCell(record.comment)
        ].join(',') + '\n'

    return str
  }

  const tstampReplacer = (key: string, value: any) =>
    key === 'timestamp' ? toISOStringTZ(new Date(value)) : value

  function slug(text: string): string {
    return text.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'event'
  }

  function downloadAttendance(type: 'csv' | 'json') {
    const blob =
      type === 'csv'
        ? new Blob([attendanceCSV()], { type: 'text/csv;charset=utf-8;' })
        : new Blob([JSON.stringify(records, tstampReplacer, 2)], {
            type: 'application/json;charset=utf-8;'
          })
    const fname = `${slug(event?.name ?? 'event')}-${event?.date ?? ''}.${type}`

    download(blob, fname)
    showAlert('download', 'Downloading Attendance!', fname)
  }

  async function uploadWebhook() {
    await postWebhook(webhook.url, webhook.authToken, JSON.stringify(records, tstampReplacer))
  }

  let allChecked = $state(false)
  let selectedRollNo = $state(new Set([] as string[]))

  function toggleAll() {
    selectedRollNo = allChecked ? new Set(Object.keys(records)) : new Set([])
  }

  function toggle(rollNo: string) {
    const next = new Set(selectedRollNo)
    if (next.has(rollNo)) next.delete(rollNo)
    else next.add(rollNo)
    selectedRollNo = next
  }

  function deleteSelected() {
    const recs = attendance[currentEvent.id]
    if (recs) for (const rollNo of selectedRollNo) delete recs[rollNo]
    selectedRollNo = new Set([])
    allChecked = false
  }

  let editRollNo = $state<string>('')

  function editOpen(rollNo: string) {
    editRollNo = rollNo
  }

  function editClose() {
    editRollNo = ''
  }
</script>

<div class="app-panel flex flex-1 flex-col items-center justify-center gap-y-4 py-4">
  <div class="stats bg-base-300 w-fit border border-gray-700">
    <div class="stat text-center">
      <div class="stat-title">Entries</div>
      <div class="stat-value text-info">{stats.total}</div>
      <div class="stat-desc text-info">
        Auto: {stats.auto} ({getPercentage(stats.auto, stats.total)}%)
      </div>
      <div class="stat-desc text-info">
        Manual: {stats.manual} ({getPercentage(stats.manual, stats.total)}%)
      </div>
    </div>

    <div class="stat text-center">
      <div class="stat-title">Export</div>
      <div class="stat-actions">
        <button class="btn btn-xs btn-success" onclick={() => downloadAttendance('csv')}>
          <Icon icon="fa6-solid:download" class="h-3 w-3" />
          <span class="mt-1">CSV</span>
        </button>
        <button class="btn btn-xs btn-success" onclick={() => downloadAttendance('json')}>
          <Icon icon="fa6-solid:download" class="h-3 w-3" />
          <span class="mt-1">JSON</span>
        </button>
      </div>
      {#if webhook.url}
        <div class="stat-actions">
          <button class="btn btn-xs btn-success" onclick={uploadWebhook}>
            <Icon icon="fa6-solid:upload" class="h-3 w-3" />
            <span class="mt-0.5">WebHook</span>
          </button>
        </div>
      {/if}
    </div>
  </div>

  <div class="w-full flex-1 overflow-x-auto">
    <table class="table-pin-rows table-xs table w-full">
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
          <th>Comment</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        {#each attendanceEntries as [rollNo, record] (rollNo)}
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
            <td>{record.comment || '-'}</td>
            <td>
              <button
                class="btn btn-xs btn-accent btn-square transform transition-transform duration-300 hover:scale-110"
                onclick={() => editOpen(rollNo)}
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
      class="btn btn-sm btn-error btn-square fixed bottom-24 left-1/2 -translate-x-1/2 transform transition-transform duration-300 ease-in-out hover:scale-110"
      onclick={deleteSelected}
    >
      <Icon icon="mingcute:delete-line" class="h-4 w-4" />
    </button>
  {/if}

  {#if editRollNo !== ''}
    <Modal edit rollNo={editRollNo} onClose={editClose} />
  {/if}
</div>
