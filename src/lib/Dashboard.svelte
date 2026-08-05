<script lang="ts">
  import Icon from '@iconify/svelte'

  import { attendance } from './stores/attendance.svelte'
  import { events, sortedEvents } from './stores/events.svelte'
  import { students } from './stores/students.svelte'

  let studentCount = $derived(Object.keys(students).length)
  let classEvents = $derived(events.filter(e => e.type === 'class'))
  let examEvents = $derived(events.filter(e => e.type === 'exam'))

  function presentCount(id: string): number {
    return Object.keys(attendance[id] ?? {}).length
  }

  let perEvent = $derived(
    sortedEvents().map(ev => ({
      ...ev,
      present: presentCount(ev.id),
      rate: studentCount > 0 ? presentCount(ev.id) / studentCount : 0
    }))
  )

  let eventMax = $derived(Math.max(studentCount, ...perEvent.map(e => e.present), 1))

  let totalMarks = $derived(events.reduce((s, ev) => s + presentCount(ev.id), 0))

  let source = $derived.by(() => {
    let auto = 0
    let manual = 0
    for (const ev of events)
      for (const rec of Object.values(attendance[ev.id] ?? {})) rec.auto ? auto++ : manual++
    return { auto, manual, total: auto + manual }
  })

  let avgClassRate = $derived.by(() => {
    if (classEvents.length === 0 || studentCount === 0) return 0
    const sum = classEvents.reduce((s, ev) => s + presentCount(ev.id), 0)
    return sum / (classEvents.length * studentCount)
  })

  let studentStats = $derived.by(() =>
    Object.keys(students)
      .map(roll => {
        let attended = 0
        for (const ev of classEvents) if (attendance[ev.id]?.[roll]) attended++
        return {
          roll,
          name: students[roll]?.name ?? '',
          attended,
          rate: classEvents.length > 0 ? attended / classEvents.length : 0
        }
      })
      .sort((a, b) => a.rate - b.rate || a.roll.localeCompare(b.roll))
  )

  const BANDS = [
    { label: '0–20%', lo: 0, hi: 0.2 },
    { label: '20–40%', lo: 0.2, hi: 0.4 },
    { label: '40–60%', lo: 0.4, hi: 0.6 },
    { label: '60–80%', lo: 0.6, hi: 0.8 },
    { label: '80–100%', lo: 0.8, hi: 1.01 }
  ]
  let distribution = $derived.by(() =>
    BANDS.map(b => ({
      ...b,
      count: studentStats.filter(s => s.rate >= b.lo && s.rate < b.hi).length
    }))
  )
  let distMax = $derived(Math.max(...distribution.map(b => b.count), 1))

  let atRisk = $derived(studentStats.filter(s => s.rate < 0.5 && classEvents.length > 0))

  function pct(x: number): string {
    return `${Math.round(x * 100)}%`
  }
</script>

<div class="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
  {#if events.length === 0 || (studentCount === 0 && totalMarks === 0)}
    <div class="text-base-content/60 grid h-full place-items-center text-center">
      <div>
        <Icon icon="mdi:chart-box-outline" class="mx-auto mb-2 h-12 w-12 opacity-50" />
        <p>Import students or collect attendance to see a summary.</p>
      </div>
    </div>
  {:else}
    <!-- KPI cards -->
    <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
      <div class="rounded-box border border-gray-500/20 p-4">
        <div class="text-base-content/60 flex items-center gap-1 text-xs">
          <Icon icon="ph:student" class="h-4 w-4" /> Students
        </div>
        <div class="mt-1 text-2xl font-bold">{studentCount}</div>
      </div>
      <div class="rounded-box border border-gray-500/20 p-4">
        <div class="text-base-content/60 flex items-center gap-1 text-xs">
          <Icon icon="mdi:calendar-check" class="h-4 w-4" /> Classes / Exams
        </div>
        <div class="mt-1 text-2xl font-bold">{classEvents.length} / {examEvents.length}</div>
      </div>
      <div class="rounded-box border border-gray-500/20 p-4">
        <div class="text-base-content/60 flex items-center gap-1 text-xs">
          <Icon icon="mdi:check-decagram-outline" class="h-4 w-4" /> Marks recorded
        </div>
        <div class="mt-1 text-2xl font-bold">{totalMarks}</div>
      </div>
      <div class="rounded-box border border-gray-500/20 p-4">
        <div class="text-base-content/60 flex items-center gap-1 text-xs">
          <Icon icon="mdi:chart-line" class="h-4 w-4" /> Avg class attendance
        </div>
        <div class="mt-1 text-2xl font-bold">
          {studentCount > 0 && classEvents.length > 0 ? pct(avgClassRate) : '—'}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section class="rounded-box border border-gray-500/20 p-4">
        <h2 class="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Icon icon="mdi:chart-bar" class="h-4 w-4" /> Attendance per event
        </h2>
        <div class="space-y-2">
          {#each perEvent as ev (ev.id)}
            <div class="flex items-center gap-2 text-xs">
              <div class="flex w-40 shrink-0 items-center gap-1 truncate">
                <Icon
                  icon={ev.type === 'exam' ? 'mdi:file-document-outline' : 'mdi:school-outline'}
                  class="h-3.5 w-3.5 shrink-0 opacity-70"
                />
                <span class="truncate" title="{ev.name} · {ev.date}">{ev.name}</span>
              </div>
              <div class="bg-base-200 relative h-4 flex-1 overflow-hidden rounded">
                <div
                  class="{ev.type === 'exam' ? 'bg-secondary' : 'bg-primary'} h-full rounded"
                  style="width: {(ev.present / eventMax) * 100}%"
                ></div>
              </div>
              <div class="w-20 shrink-0 text-right tabular-nums">
                {ev.present}{studentCount > 0 ? ` · ${pct(ev.rate)}` : ''}
              </div>
            </div>
          {/each}
        </div>
      </section>

      <div class="space-y-6">
        <section class="rounded-box border border-gray-500/20 p-4">
          <h2 class="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Icon icon="mdi:gesture-tap" class="h-4 w-4" /> How marks were taken
          </h2>
          {#if source.total > 0}
            <div class="bg-base-200 flex h-4 overflow-hidden rounded">
              <div
                class="bg-success h-full"
                style="width: {(source.auto / source.total) * 100}%"
              ></div>
              <div
                class="bg-warning h-full"
                style="width: {(source.manual / source.total) * 100}%"
              ></div>
            </div>
            <div class="mt-2 flex justify-between text-xs">
              <span class="inline-flex items-center gap-1">
                <span class="bg-success h-2 w-2 rounded-full"></span>
                Scanned {source.auto} ({pct(source.auto / source.total)})
              </span>
              <span class="inline-flex items-center gap-1">
                <span class="bg-warning h-2 w-2 rounded-full"></span>
                Manual {source.manual} ({pct(source.manual / source.total)})
              </span>
            </div>
          {:else}
            <p class="text-base-content/50 text-xs">No marks yet.</p>
          {/if}
        </section>

        <section class="rounded-box border border-gray-500/20 p-4">
          <h2 class="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Icon icon="mdi:chart-histogram" class="h-4 w-4" /> Students by class attendance
          </h2>
          {#if studentCount > 0 && classEvents.length > 0}
            <div class="space-y-2">
              {#each distribution as band (band.label)}
                <div class="flex items-center gap-2 text-xs">
                  <div class="w-16 shrink-0 tabular-nums">{band.label}</div>
                  <div class="bg-base-200 h-4 flex-1 overflow-hidden rounded">
                    <div
                      class="bg-info h-full rounded"
                      style="width: {(band.count / distMax) * 100}%"
                    ></div>
                  </div>
                  <div class="w-8 shrink-0 text-right tabular-nums">{band.count}</div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-base-content/50 text-xs">
              Add students and at least one class to see the distribution.
            </p>
          {/if}
        </section>
      </div>
    </div>

    {#if atRisk.length > 0}
      <section class="rounded-box border border-gray-500/20 p-4">
        <h2 class="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Icon icon="mdi:account-alert-outline" class="text-error h-4 w-4" /> Below 50% class attendance
          <span class="badge badge-sm badge-error badge-outline">{atRisk.length}</span>
        </h2>
        <div class="overflow-x-auto">
          <table class="table-xs table">
            <thead>
              <tr>
                <th>Roll</th>
                <th>Name</th>
                <th class="text-right">Attended</th>
                <th class="text-right">Rate</th>
              </tr>
            </thead>
            <tbody>
              {#each atRisk as s (s.roll)}
                <tr>
                  <td class="font-mono">{s.roll}</td>
                  <td>{s.name || '—'}</td>
                  <td class="text-right tabular-nums">{s.attended} / {classEvents.length}</td>
                  <td class="text-error text-right font-medium tabular-nums">{pct(s.rate)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    {/if}
  {/if}
</div>
