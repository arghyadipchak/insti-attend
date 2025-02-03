<script lang="ts">
  import Icon from '@iconify/svelte'
  import { attendance } from './shared.svelte'

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
        <button class="btn btn-xs btn-success" onclick={downloadCSV}>
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
              <input type="checkbox" class="checkbox checkbox-xs" />
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
                <input type="checkbox" class="checkbox checkbox-xs" />
              </label>
            </th>
            <td>{rollNo}</td>
            <td>{record.auto ? 'Yes' : 'No'}</td>
            <td>{record.reason ? record.reason : '-'}</td>
            <td>
              <button class="btn btn-xs btn-accent btn-square">
                <Icon icon="tabler:edit" class="h-4 w-4" />
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <button class="btn btn-sm btn-error btn-square fixed bottom-20">
    <Icon icon="mingcute:delete-line" class="h-4 w-4" />
  </button>
</div>
