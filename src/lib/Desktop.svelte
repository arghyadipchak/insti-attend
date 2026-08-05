<script lang="ts">
  import Icon from '@iconify/svelte'
  import { onMount } from 'svelte'

  import { showAlert } from './stores/alert.svelte'
  import { attendance, eventRecords, type AttendanceRecord } from './stores/attendance.svelte'
  import { confirmAction } from './stores/confirm.svelte'
  import {
    createEvent,
    currentEvent,
    deleteEvent,
    events,
    sortedEvents,
    todayISO,
    updateEvent,
    type EventType
  } from './stores/events.svelte'
  import {
    clearSeating,
    importSeatingCSV,
    rooms,
    seating,
    type Seat
  } from './stores/seating.svelte'
  import { clearStudents, importStudentsCSV, students } from './stores/students.svelte'
  import { onboardingSeen } from './stores/system.svelte'
  import { download, toISOStringTZ } from './utils'

  import Dashboard from './Dashboard.svelte'

  let view = $state<'attendance' | 'summary'>('attendance')

  let columns = $derived(sortedEvents())

  let rows = $derived.by(() => {
    const rolls = new Set(Object.keys(students))
    for (const ev of events)
      for (const roll of Object.keys(attendance[ev.id] ?? {})) rolls.add(roll)
    return [...rolls]
      .sort((a, b) => a.localeCompare(b))
      .map(roll => ({ roll, name: students[roll]?.name ?? '' }))
  })

  let studentCount = $derived(Object.keys(students).length)
  let classCount = $derived(events.filter(e => e.type === 'class').length)
  let examCount = $derived(events.filter(e => e.type === 'exam').length)

  // Attendance rows reference rolls, so students can only be cleared once every
  // event (and its records) is gone.
  let recordCount = $derived(
    Object.values(attendance).reduce((n, recs) => n + Object.keys(recs).length, 0)
  )
  let hasEventData = $derived(recordCount > 0)
  let eventsWithData = $derived(
    events.filter(ev => Object.keys(attendance[ev.id] ?? {}).length > 0).length
  )
  let canDeleteAllEvents = $derived(events.length > 1 || recordCount > 0)

  let highlightAbsent = $state(false)
  let highlightEventId = $state('')
  let focusEvent = $derived(columns.find(e => e.id === highlightEventId) ?? null)
  let focusIsExam = $derived(focusEvent?.type === 'exam')

  let search = $state('')
  let filteredRows = $derived.by(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r => r.roll.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))
  })

  let sortKey = $state<string>('roll')
  let sortDir = $state<1 | -1>(1)
  function toggleSort(key: string) {
    if (sortKey === key) sortDir = sortDir === 1 ? -1 : 1
    else {
      sortKey = key
      sortDir = 1
    }
  }
  function sortIcon(key: string): string {
    if (sortKey !== key) return 'mdi:unfold-more-horizontal'
    return sortDir === 1 ? 'mdi:menu-up' : 'mdi:menu-down'
  }
  let displayRows = $derived.by(() => {
    const key = sortKey
    const arr = [...filteredRows]
    arr.sort((a, b) => {
      let cmp: number
      if (key === 'roll') cmp = a.roll.localeCompare(b.roll)
      else if (key === 'name') cmp = (a.name || '~').localeCompare(b.name || '~')
      else if (key === 'focus-comment') {
        const ca = attendance[highlightEventId]?.[a.roll]?.comment ?? ''
        const cb = attendance[highlightEventId]?.[b.roll]?.comment ?? ''
        cmp = (ca || '~').localeCompare(cb || '~')
      } else if (key === 'focus-room') {
        const ra = seating[highlightEventId]?.[a.roll]?.room ?? ''
        const rb = seating[highlightEventId]?.[b.roll]?.room ?? ''
        cmp = (ra || '~').localeCompare(rb || '~')
      } else if (key === 'focus-seat') {
        const sa = seating[highlightEventId]?.[a.roll]?.seat ?? ''
        const sb = seating[highlightEventId]?.[b.roll]?.seat ?? ''
        cmp = (sa || '~').localeCompare(sb || '~')
      } else {
        const ta = attendance[key]?.[a.roll]?.timestamp?.getTime() ?? Infinity
        const tb = attendance[key]?.[b.roll]?.timestamp?.getTime() ?? Infinity
        cmp = ta - tb
      }
      if (cmp === 0) cmp = a.roll.localeCompare(b.roll)
      return cmp * sortDir
    })
    return arr
  })

  function onEnter(fn: () => void) {
    return (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        fn()
      }
    }
  }

  function pad(n: number): string {
    return String(n).padStart(2, '0')
  }
  function hhmm(d: Date): string {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  async function onStudentsFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    const n = importStudentsCSV(await file.text())
    showAlert('settings', `Imported ${n} student${n === 1 ? '' : 's'}`, file.name)
    input.value = ''
  }

  let howDialog: HTMLDialogElement
  let studentInfoDialog: HTMLDialogElement
  let collectionInfoDialog: HTMLDialogElement
  let eventsInfoDialog: HTMLDialogElement
  let clearBlockedDialog: HTMLDialogElement
  let addStudentDialog: HTMLDialogElement

  const HOW_STEPS = 4
  let howStep = $state(0)
  function openHow() {
    howStep = 0
    howDialog.showModal()
  }
  function howNext() {
    if (howStep < HOW_STEPS - 1) howStep++
    else howDialog.close()
  }
  function howPrev() {
    if (howStep > 0) howStep--
  }
  onMount(() => {
    if (!onboardingSeen.value) openHow()
  })

  let manualRoll = $state('')
  let manualName = $state('')
  function openAddStudent() {
    manualRoll = ''
    manualName = ''
    addStudentDialog.showModal()
  }
  function addStudent() {
    const roll = manualRoll.trim()
    if (!roll) return
    students[roll] = { name: manualName.trim() }
    showAlert('settings', 'Student added', roll)
    addStudentDialog.close()
  }

  interface RawRecord {
    timestamp: string
    auto?: boolean
    comment?: string
  }
  let importDialog: HTMLDialogElement
  let importFileName = $state('')
  let importRecords = $state<Record<string, RawRecord> | null>(null)
  let importCount = $derived(importRecords ? Object.keys(importRecords).length : 0)
  let importTarget = $state('')
  let importOverwrite = $state(false)
  let importNewName = $state('')
  let importNewType = $state<EventType>('class')
  let importNewDate = $state(todayISO())

  function splitCSVLine(line: string): string[] {
    const out: string[] = []
    let field = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (inQuotes) {
        if (c === '"') {
          if (line[i + 1] === '"') {
            field += '"'
            i++
          } else inQuotes = false
        } else field += c
      } else if (c === '"') inQuotes = true
      else if (c === ',') {
        out.push(field)
        field = ''
      } else field += c
    }
    out.push(field)
    return out.map(f => f.trim())
  }

  function parseAttendanceCSV(text: string): Record<string, RawRecord> | null {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
    if (lines.length === 0) return null
    const header = splitCSVLine(lines[0]).map(h => h.toLowerCase())
    const rollIdx = header.findIndex(h => h === 'rollno' || h === 'roll' || h === 'roll no')
    const tsIdx = header.findIndex(h => h === 'timestamp' || h === 'time')
    const autoIdx = header.findIndex(h => h === 'auto')
    const commentIdx = header.findIndex(h => h === 'comment')
    if (rollIdx === -1 || tsIdx === -1) return null

    const out: Record<string, RawRecord> = {}
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCSVLine(lines[i])
      const roll = cols[rollIdx]?.trim()
      const ts = cols[tsIdx]?.trim()
      if (!roll || !ts) continue
      out[roll] = {
        timestamp: ts,
        auto: autoIdx !== -1 && cols[autoIdx]?.trim().toLowerCase() === 'true',
        comment: commentIdx !== -1 ? (cols[commentIdx] ?? '') : ''
      }
    }
    return Object.keys(out).length ? out : null
  }

  async function onImportFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    const text = await file.text()
    let records: Record<string, RawRecord> | null = null

    if (text.trimStart().startsWith('{')) {
      try {
        const data: unknown = JSON.parse(text)
        const values = data && typeof data === 'object' ? Object.values(data as object) : []
        if (
          values.length > 0 &&
          values.every(v => v && typeof v === 'object' && 'timestamp' in (v as object))
        )
          records = data as Record<string, RawRecord>
      } catch {
        /* fall through to error */
      }
    } else {
      records = parseAttendanceCSV(text)
    }

    if (!records) {
      showAlert('error', 'Unrecognized file', "Expected a phone's event export (JSON or CSV)")
      return
    }

    importRecords = records
    importFileName = file.name

    const base = file.name.replace(/\.json$/i, '')
    const dateMatch = base.match(/(\d{4}-\d{2}-\d{2})/)
    importNewDate = dateMatch ? dateMatch[1] : todayISO()
    importNewName =
      (dateMatch ? base.replace(dateMatch[1], '') : base).replace(/[-_]+/g, ' ').trim() ||
      'Imported'
    importNewType = 'class'
    importOverwrite = false
    importTarget = events.some(e => e.id === currentEvent.id)
      ? currentEvent.id
      : (events[0]?.id ?? '__new__')
    importDialog.showModal()
  }

  function doImport() {
    if (!importRecords) return
    if (importTarget === '__new__' && importNewName.trim() === '') return
    const targetId =
      importTarget === '__new__'
        ? createEvent(importNewName, importNewType, importNewDate).id
        : importTarget

    const target = eventRecords(targetId)
    let added = 0
    let updated = 0
    let skipped = 0
    for (const [roll, rec] of Object.entries(importRecords)) {
      const exists = roll in target
      if (exists && !importOverwrite) {
        skipped++
        continue
      }
      target[roll] = {
        timestamp: new Date(rec.timestamp),
        auto: rec.auto ?? false,
        comment: rec.comment ?? ''
      }
      if (exists) updated++
      else added++
    }

    const parts = [`${added} added`]
    if (updated) parts.push(`${updated} overwritten`)
    if (skipped) parts.push(`${skipped} kept`)
    showAlert('settings', 'Merged attendance', parts.join(', '))
    importRecords = null
    importDialog.close()
  }

  let name = $state('')
  let type = $state<EventType>('class')
  let date = $state(todayISO())
  function addEvent() {
    if (name.trim().length === 0) return
    createEvent(name, type, date)
    name = ''
    type = 'class'
    date = todayISO()
  }

  function removeEvent(id: string) {
    deleteEvent(id)
    delete attendance[id]
    clearSeating(id)
  }

  async function confirmRemoveEvent(id: string) {
    if (
      await confirmAction('Delete this event and all its attendance? This cannot be undone.', {
        title: 'Delete event',
        confirmLabel: 'Delete'
      })
    )
      removeEvent(id)
  }
  async function confirmRemoveAllEvents() {
    const n = events.length
    if (
      !(await confirmAction(
        `Delete all ${n} event${n === 1 ? '' : 's'} along with their attendance and seating? This cannot be undone.`,
        { title: 'Delete all events', confirmLabel: 'Delete all' }
      ))
    )
      return

    for (const ev of [...events]) removeEvent(ev.id)
    for (const id of Object.keys(attendance)) delete attendance[id]
    for (const id of Object.keys(seating)) delete seating[id]
    highlightEventId = ''
    showAlert('settings', `Deleted ${n} event${n === 1 ? '' : 's'}`)
  }
  async function confirmClearStudents() {
    if (hasEventData) {
      clearBlockedDialog.showModal()
      return
    }
    if (
      await confirmAction('Clear the entire students? This cannot be undone.', {
        title: 'Clear students',
        confirmLabel: 'Clear'
      })
    )
      clearStudents()
  }
  async function confirmClearSeating(id: string) {
    if (
      await confirmAction('Clear the seating for this exam?', {
        title: 'Clear seating',
        confirmLabel: 'Clear'
      })
    )
      clearSeating(id)
  }

  // --- edit an event ---
  let editEventDialog: HTMLDialogElement
  let editEventId = $state('')
  let editName = $state('')
  let editType = $state<EventType>('class')
  let editDate = $state(todayISO())
  function openEditEvent(ev: { id: string; name: string; type: EventType; date: string }) {
    editEventId = ev.id
    editName = ev.name
    editType = ev.type
    editDate = ev.date
    editEventDialog.showModal()
  }
  function saveEditEvent() {
    if (editName.trim() === '') return
    updateEvent(editEventId, editName, editType, editDate)
    editEventDialog.close()
  }

  let editSeatCount = $derived(Object.keys(seating[editEventId] ?? {}).length)
  let editRooms = $derived(rooms(editEventId))
  function roomStats(eventId: string, room: string) {
    const seats = seating[eventId] ?? {}
    const recs = attendance[eventId] ?? {}
    let assigned = 0
    let present = 0
    for (const [roll, s] of Object.entries(seats))
      if (s.room === room) {
        assigned++
        if (roll in recs) present++
      }
    return { assigned, present, absent: assigned - present }
  }
  async function onSeatingFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    const n = importSeatingCSV(editEventId, await file.text())
    showAlert('settings', `Imported ${n} seat${n === 1 ? '' : 's'}`, file.name)
  }
  function seatCount(eventId: string): number {
    return Object.keys(seating[eventId] ?? {}).length
  }
  async function onRowSeatingFile(eventId: string, e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    const n = importSeatingCSV(eventId, await file.text())
    showAlert('settings', `Imported ${n} seat${n === 1 ? '' : 's'}`, file.name)
  }

  interface Detail {
    roll: string
    name: string
    eventName: string
    eventDate: string
    rec: AttendanceRecord
    seat?: Seat
  }
  let detailDialog: HTMLDialogElement
  let detail = $state<Detail | null>(null)
  function openDetail(
    ev: { id: string; name: string; date: string },
    roll: string,
    rec: AttendanceRecord
  ) {
    detail = {
      roll,
      name: students[roll]?.name ?? '',
      eventName: ev.name,
      eventDate: ev.date,
      rec,
      seat: seating[ev.id]?.[roll]
    }
    detailDialog.showModal()
  }

  function csvCell(value: string): string {
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  }
  function attendanceCSV(): string {
    const header = ['Roll', 'Name']
    for (const ev of columns) {
      const label = `${ev.name} (${ev.date})`
      header.push(`${label} time`, `${label} comment`)
    }
    const lines = [header.map(csvCell).join(',')]

    for (const row of rows) {
      const cells = [csvCell(row.roll), csvCell(row.name)]
      for (const ev of columns) {
        const rec = attendance[ev.id]?.[row.roll]
        const comment = rec ? `${rec.auto ? '[auto]' : '[manual]'} ${rec.comment ?? ''}`.trim() : ''
        cells.push(rec ? toISOStringTZ(rec.timestamp) : '', csvCell(comment))
      }
      lines.push(cells.join(','))
    }
    return lines.join('\n') + '\n'
  }
  function exportCSV() {
    download(new Blob([attendanceCSV()], { type: 'text/csv;charset=utf-8;' }), `attendance.csv`)
    showAlert('download', 'Downloading attendance', 'attendance.csv')
  }
</script>

<div class="app-panel flex h-full w-full flex-col">
  <header class="bg-base-100 flex items-center gap-3 border-b border-gray-500/20 px-5 py-3">
    <img src="{import.meta.env.BASE_URL}logo.png" alt="InstiAttend logo" class="h-8 w-8" />
    <h1 class="text-lg font-bold">InstiAttend</h1>
    <span class="text-primary text-xs font-medium">{__APP_VERSION__}</span>
    <span class="text-base-content/50 text-sm">· Desktop mode · every scan, in one place</span>
    <div class="flex-1"></div>
    <div class="join">
      <button
        type="button"
        class="btn join-item btn-sm {view === 'attendance' ? 'btn-primary' : 'btn-outline'}"
        onclick={() => (view = 'attendance')}
      >
        <Icon icon="mdi:table" class="h-4 w-4" /> Attendance
      </button>
      <button
        type="button"
        class="btn join-item btn-sm {view === 'summary' ? 'btn-primary' : 'btn-outline'}"
        onclick={() => (view = 'summary')}
      >
        <Icon icon="mdi:chart-box-outline" class="h-4 w-4" /> Summary
      </button>
    </div>
    <button class="btn btn-sm btn-outline" onclick={openHow}>
      <Icon icon="mdi:information-outline" class="h-4 w-4" />
      How it works
    </button>
    <button class="btn btn-sm btn-primary" onclick={exportCSV} disabled={rows.length === 0}>
      <Icon icon="fa6-solid:download" class="h-4 w-4" />
      Export CSV
    </button>
    <a href="https://github.com/arghyadipchak/insti-attend" class="btn btn-sm btn-ghost btn-square">
      <Icon icon="akar-icons:github-fill" class="h-5 w-5" />
    </a>
  </header>

  <div class="flex min-h-0 flex-1">
    <aside
      class="bg-base-100 flex w-72 flex-col gap-4 overflow-y-auto border-r border-gray-500/20 p-4"
    >
      <section class="rounded-box border border-gray-500/20 p-3">
        <h2 class="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Icon icon="ph:student" class="h-4 w-4" /> Student management
          <span class="badge badge-sm badge-neutral">{studentCount}</span>
          <button
            class="btn btn-ghost btn-xs btn-square ml-auto"
            aria-label="CSV format help"
            onclick={() => studentInfoDialog.showModal()}
          >
            <Icon icon="mdi:information-outline" class="h-4 w-4" />
          </button>
        </h2>
        <input
          type="file"
          accept=".csv,text/csv"
          class="file-input file-input-sm w-full"
          onchange={onStudentsFile}
        />
        <div class="mt-2 flex items-center gap-2">
          <button class="btn btn-xs btn-ghost" onclick={openAddStudent}>
            <Icon icon="mdi:account-plus" class="h-4 w-4" /> Add manually
          </button>
          {#if studentCount > 0}
            <button class="btn btn-xs btn-ghost text-error ml-auto" onclick={confirmClearStudents}>
              Clear
            </button>
          {/if}
        </div>
      </section>

      <section class="rounded-box border border-gray-500/20 p-3">
        <h2 class="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Icon icon="mdi:tray-arrow-down" class="h-4 w-4" /> Collect attendance
          <button
            class="btn btn-ghost btn-xs btn-square ml-auto"
            aria-label="Collect attendance help"
            onclick={() => collectionInfoDialog.showModal()}
          >
            <Icon icon="mdi:information-outline" class="h-4 w-4" />
          </button>
        </h2>
        <input
          type="file"
          accept=".json,.csv,application/json,text/csv"
          class="file-input file-input-sm w-full"
          onchange={onImportFile}
        />
      </section>

      <section class="rounded-box flex min-h-0 flex-1 flex-col border border-gray-500/20 p-3">
        <h2 class="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Icon icon="mdi:calendar-check" class="h-4 w-4" /> Events
          <span class="badge badge-sm badge-neutral">{events.length}</span>
          <button
            class="btn btn-ghost btn-xs btn-square ml-auto"
            aria-label="Events help"
            onclick={() => eventsInfoDialog.showModal()}
          >
            <Icon icon="mdi:information-outline" class="h-4 w-4" />
          </button>
        </h2>

        <div class="rounded-box bg-base-200 mb-3 flex flex-col gap-2 p-2">
          <input
            bind:value={name}
            class="input input-xs"
            placeholder="Event name"
            onkeydown={onEnter(addEvent)}
          />
          <div class="flex gap-2">
            <select bind:value={type} class="select select-xs flex-1">
              <option value="class">Class</option>
              <option value="exam">Exam</option>
            </select>
            <input
              bind:value={date}
              type="date"
              class="input input-xs flex-1"
              onkeydown={onEnter(addEvent)}
            />
          </div>
          <button class="btn btn-xs btn-primary" onclick={addEvent} disabled={name.trim() === ''}>
            <Icon icon="mdi:plus" class="h-4 w-4" /> Add event
          </button>
        </div>

        <ul class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {#each columns as ev (ev.id)}
            <li class="hover:bg-base-200 group flex items-center gap-2 rounded px-2 py-1 text-sm">
              <Icon
                icon={ev.type === 'exam' ? 'mdi:file-document-outline' : 'mdi:school-outline'}
                class="h-4 w-4 shrink-0"
              />
              <div class="min-w-0 flex-1">
                <div class="truncate">{ev.name}</div>
                <div class="text-base-content/50 text-xs">
                  {ev.date}<br />{ev.type === 'exam' && seatCount(ev.id)
                    ? `${seatCount(ev.id)} seats`
                    : ''}
                </div>
              </div>
              <div class="flex opacity-0 group-hover:opacity-100">
                {#if ev.type === 'exam'}
                  <label class="btn btn-xs btn-ghost btn-square" aria-label="Upload seating">
                    <Icon icon="mdi:file-upload-outline" class="h-4 w-4" />
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      class="hidden"
                      onchange={e => onRowSeatingFile(ev.id, e)}
                    />
                  </label>
                {/if}
                <button
                  class="btn btn-xs btn-ghost btn-square"
                  onclick={() => openEditEvent(ev)}
                  aria-label="Edit event"
                >
                  <Icon icon="mdi:pencil-outline" class="h-4 w-4" />
                </button>
                <button
                  class="btn btn-xs btn-ghost btn-square text-error"
                  onclick={() => confirmRemoveEvent(ev.id)}
                  aria-label="Delete event"
                >
                  <Icon icon="mingcute:delete-line" class="h-4 w-4" />
                </button>
              </div>
            </li>
          {/each}
        </ul>

        {#if canDeleteAllEvents}
          <button
            class="btn btn-xs btn-ghost text-error mt-2 self-end"
            onclick={confirmRemoveAllEvents}
          >
            <Icon icon="mingcute:delete-line" class="h-4 w-4" /> Delete all events
          </button>
        {/if}
      </section>
    </aside>

    <main class="flex min-w-0 flex-1 flex-col">
      {#if view === 'summary'}
        <Dashboard />
      {:else if rows.length === 0}
        <div class="text-base-content/60 grid h-full place-items-center p-4 text-center">
          <div>
            <Icon icon="mdi:table-large-plus" class="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>Import students or collect attendance to build the sheet.</p>
          </div>
        </div>
      {:else}
        <div
          class="bg-base-100 flex flex-wrap items-center gap-3 border-b border-gray-500/20 px-4 py-2"
        >
          <div class="stats stats-horizontal border border-gray-500/20">
            <div class="stat px-4 py-1">
              <div class="stat-title text-xs">Students</div>
              <div class="stat-value text-xl">{studentCount}</div>
            </div>
            <div class="stat px-4 py-1">
              <div class="stat-title text-xs">Classes</div>
              <div class="stat-value text-xl">{classCount}</div>
            </div>
            <div class="stat px-4 py-1">
              <div class="stat-title text-xs">Exams</div>
              <div class="stat-value text-xl">{examCount}</div>
            </div>
          </div>

          <div class="text-base-content/60 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span class="inline-flex items-center gap-1">
              <span class="bg-success h-2 w-2 rounded-full"></span> scanned
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="bg-warning h-2 w-2 rounded-full"></span> manual
            </span>
            <span class="inline-flex items-center gap-1">
              <Icon icon="mdi:comment-text-outline" class="h-3.5 w-3.5" /> comment
            </span>
          </div>

          <div class="flex-1"></div>

          <label class="input input-xs flex w-52 items-center gap-1">
            <Icon icon="mdi:magnify" class="h-4 w-4 opacity-60" />
            <input
              type="search"
              bind:value={search}
              placeholder="Search roll or name"
              class="grow"
            />
          </label>

          <button
            class="btn btn-xs {highlightAbsent ? 'btn-error' : 'btn-ghost'}"
            onclick={() => (highlightAbsent = !highlightAbsent)}
            disabled={studentCount === 0}
          >
            <Icon icon="mdi:account-alert-outline" class="h-4 w-4" /> Absents
          </button>
          <select
            class="select select-xs w-44 min-w-0 shrink-0 truncate {focusEvent
              ? 'select-primary'
              : ''}"
            bind:value={highlightEventId}
            onchange={() => {
              sortKey = 'roll'
              sortDir = 1
            }}
          >
            <option value="">Focus a day…</option>
            {#each columns as ev (ev.id)}
              <option value={ev.id}>{ev.name} · {ev.date}</option>
            {/each}
          </select>
        </div>

        <div class="bg-base-100 min-h-0 flex-1 overflow-auto">
          {#if focusEvent}
            <table class="table-sm table w-max border-separate border-spacing-0">
              <thead>
                <tr class="sticky top-0 z-20">
                  <th class="attendance-head sticky left-0 z-10 border-b border-gray-500/20 p-0">
                    <button
                      type="button"
                      class="hover:bg-base-200 flex w-28 items-center gap-1 px-3 py-1"
                      onclick={() => toggleSort('roll')}
                    >
                      <span class="truncate">Roll</span>
                      <Icon icon={sortIcon('roll')} class="h-3.5 w-3.5 shrink-0 opacity-60" />
                    </button>
                  </th>
                  <th class="attendance-head sticky left-28 z-10 border-b border-gray-500/20 p-0">
                    <button
                      type="button"
                      class="hover:bg-base-200 flex w-48 items-center gap-1 px-3 py-1"
                      onclick={() => toggleSort('name')}
                    >
                      <span class="truncate">Name</span>
                      <Icon icon={sortIcon('name')} class="h-3.5 w-3.5 shrink-0 opacity-60" />
                    </button>
                  </th>
                  <th class="attendance-head border-b border-l border-gray-500/20 p-0">
                    <button
                      type="button"
                      class="hover:bg-base-200 flex w-24 items-center gap-1 px-3 py-1"
                      onclick={() => toggleSort(highlightEventId)}
                    >
                      <Icon icon="mdi:clock-outline" class="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span class="truncate">Time</span>
                      <Icon
                        icon={sortIcon(highlightEventId)}
                        class="h-3.5 w-3.5 shrink-0 opacity-60"
                      />
                    </button>
                  </th>
                  <th class="attendance-head border-b border-l border-gray-500/20 p-0">
                    <button
                      type="button"
                      class="hover:bg-base-200 flex w-72 items-center gap-1 px-3 py-1"
                      onclick={() => toggleSort('focus-comment')}
                    >
                      <Icon
                        icon="mdi:comment-text-outline"
                        class="h-3.5 w-3.5 shrink-0 opacity-70"
                      />
                      <span class="truncate">Comment</span>
                      <Icon
                        icon={sortIcon('focus-comment')}
                        class="h-3.5 w-3.5 shrink-0 opacity-60"
                      />
                    </button>
                  </th>
                  {#if focusIsExam}
                    <th class="attendance-head border-b border-l border-gray-500/20 p-0">
                      <button
                        type="button"
                        class="hover:bg-base-200 flex w-28 items-center gap-1 px-3 py-1"
                        onclick={() => toggleSort('focus-room')}
                      >
                        <Icon icon="mdi:door" class="h-3.5 w-3.5 shrink-0 opacity-70" />
                        <span class="truncate">Room</span>
                        <Icon
                          icon={sortIcon('focus-room')}
                          class="h-3.5 w-3.5 shrink-0 opacity-60"
                        />
                      </button>
                    </th>
                    <th class="attendance-head border-b border-l border-gray-500/20 p-0">
                      <button
                        type="button"
                        class="hover:bg-base-200 flex w-28 items-center gap-1 px-3 py-1"
                        onclick={() => toggleSort('focus-seat')}
                      >
                        <Icon icon="mdi:seat-outline" class="h-3.5 w-3.5 shrink-0 opacity-70" />
                        <span class="truncate">Seat</span>
                        <Icon
                          icon={sortIcon('focus-seat')}
                          class="h-3.5 w-3.5 shrink-0 opacity-60"
                        />
                      </button>
                    </th>
                  {/if}
                </tr>
              </thead>
              <tbody>
                {#each displayRows as row (row.roll)}
                  {@const rec = attendance[highlightEventId]?.[row.roll]}
                  {@const seat = seating[highlightEventId]?.[row.roll]}
                  {@const absentHi = highlightAbsent && !rec && !!students[row.roll]}
                  <tr>
                    <th
                      class="attendance-head sticky left-0 z-10 border-b border-gray-500/20 p-0 font-normal"
                    >
                      <div class="w-28 truncate px-3 py-1 font-mono">{row.roll}</div>
                    </th>
                    <td class="attendance-head sticky left-28 z-10 border-b border-gray-500/20 p-0">
                      <div class="w-48 truncate px-3 py-1">{row.name || '—'}</div>
                    </td>
                    <td
                      class="border-b border-l border-gray-500/20 text-center {absentHi
                        ? 'bg-error/15'
                        : ''}"
                    >
                      {#if rec}
                        <button
                          type="button"
                          class="hover:bg-base-200 inline-flex items-center gap-1 rounded px-1"
                          onclick={() => focusEvent && openDetail(focusEvent, row.roll, rec)}
                          title="View details"
                        >
                          <span
                            class={rec.auto
                              ? 'text-success font-medium'
                              : 'text-warning font-medium italic'}
                          >
                            {hhmm(rec.timestamp)}
                          </span>
                        </button>
                      {:else}
                        <span class="text-error/60 text-xs">Absent</span>
                      {/if}
                    </td>
                    <td
                      class="max-w-72 truncate border-b border-l border-gray-500/20 px-3 {absentHi
                        ? 'bg-error/15'
                        : ''}"
                      title={rec?.comment ?? ''}
                    >
                      {#if rec?.comment}
                        {rec.comment}
                      {:else}
                        <span class="text-base-content/20">—</span>
                      {/if}
                    </td>
                    {#if focusIsExam}
                      <td
                        class="border-b border-l border-gray-500/20 px-3 {absentHi
                          ? 'bg-error/15'
                          : ''}"
                      >
                        {#if seat?.room}
                          {seat.room}
                        {:else}
                          <span class="text-base-content/20">—</span>
                        {/if}
                      </td>
                      <td
                        class="border-b border-l border-gray-500/20 px-3 font-mono {absentHi
                          ? 'bg-error/15'
                          : ''}"
                      >
                        {#if seat?.seat}
                          {seat.seat}
                        {:else}
                          <span class="text-base-content/20">—</span>
                        {/if}
                      </td>
                    {/if}
                  </tr>
                {:else}
                  <tr>
                    <td class="text-base-content/50 p-4" colspan={focusIsExam ? 6 : 4}>
                      No students match “{search}”.
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {:else}
            <table class="table-sm table w-max border-separate border-spacing-0">
              <thead>
                <tr class="sticky top-0 z-20">
                  <th class="attendance-head sticky left-0 z-10 border-b border-gray-500/20 p-0">
                    <button
                      type="button"
                      class="hover:bg-base-200 flex w-28 items-center gap-1 px-3 py-1"
                      onclick={() => toggleSort('roll')}
                    >
                      <span class="truncate">Roll</span>
                      <Icon icon={sortIcon('roll')} class="h-3.5 w-3.5 shrink-0 opacity-60" />
                    </button>
                  </th>
                  <th class="attendance-head sticky left-28 z-10 border-b border-gray-500/20 p-0">
                    <button
                      type="button"
                      class="hover:bg-base-200 flex w-48 items-center gap-1 px-3 py-1"
                      onclick={() => toggleSort('name')}
                    >
                      <span class="truncate">Name</span>
                      <Icon icon={sortIcon('name')} class="h-3.5 w-3.5 shrink-0 opacity-60" />
                    </button>
                  </th>
                  {#each columns as ev (ev.id)}
                    <th
                      class="attendance-head border-b border-l border-gray-500/20 p-0 {highlightEventId ===
                      ev.id
                        ? 'text-primary'
                        : ''}"
                    >
                      <button
                        type="button"
                        class="hover:bg-base-200 flex w-full flex-col items-center px-2 py-1"
                        onclick={() => toggleSort(ev.id)}
                      >
                        <div class="flex items-center gap-1 whitespace-nowrap">
                          <Icon
                            icon={ev.type === 'exam'
                              ? 'mdi:file-document-outline'
                              : 'mdi:school-outline'}
                            class="h-3.5 w-3.5"
                          />
                          {ev.name}
                          <Icon icon={sortIcon(ev.id)} class="h-3.5 w-3.5 shrink-0 opacity-60" />
                        </div>
                        <div class="text-base-content/50 font-normal">{ev.date}</div>
                      </button>
                    </th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each displayRows as row (row.roll)}
                  <tr>
                    <th
                      class="attendance-head sticky left-0 z-10 border-b border-gray-500/20 p-0 font-normal"
                    >
                      <div class="w-28 truncate px-3 py-1 font-mono">{row.roll}</div>
                    </th>
                    <td class="attendance-head sticky left-28 z-10 border-b border-gray-500/20 p-0">
                      <div class="w-48 truncate px-3 py-1">{row.name || '—'}</div>
                    </td>
                    {#each columns as ev (ev.id)}
                      {@const rec = attendance[ev.id]?.[row.roll]}
                      {@const absentHi =
                        highlightAbsent &&
                        !rec &&
                        !!students[row.roll] &&
                        (highlightEventId === '' || highlightEventId === ev.id)}
                      <td
                        class="border-b border-l border-gray-500/20 text-center {absentHi
                          ? 'bg-error/15'
                          : highlightEventId === ev.id
                            ? 'bg-primary/10'
                            : ''}"
                      >
                        {#if rec}
                          <button
                            type="button"
                            class="hover:bg-base-200 inline-flex items-center gap-0.5 rounded px-1"
                            onclick={() => openDetail(ev, row.roll, rec)}
                            title="View details"
                          >
                            <span
                              class={rec.auto
                                ? 'text-success font-medium'
                                : 'text-warning font-medium italic'}
                            >
                              {hhmm(rec.timestamp)}
                            </span>
                            {#if rec.comment}
                              <Icon
                                icon="mdi:comment-text-outline"
                                class="text-base-content/50 h-3 w-3"
                              />
                            {/if}
                          </button>
                        {:else}
                          <span class="text-base-content/20">·</span>
                        {/if}
                      </td>
                    {/each}
                  </tr>
                {:else}
                  <tr>
                    <td class="text-base-content/50 p-4" colspan={columns.length + 2}>
                      No students match “{search}”.
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </div>
      {/if}
    </main>
  </div>

  <dialog bind:this={howDialog} class="modal" onclose={() => (onboardingSeen.value = true)}>
    <div class="modal-box">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
      </form>

      <p class="text-base-content/50 flex items-center gap-2 text-xs font-medium tracking-wide">
        InstiAttend · HOW IT WORKS
      </p>

      <!-- figure: swap the icon for an image later if desired -->
      <div class="rounded-box bg-base-200 mt-3 grid h-40 place-items-center">
        {#if howStep === 0}
          <img src="{import.meta.env.BASE_URL}logo.png" alt="" class="h-30 w-30" />
        {:else if howStep === 1}
          <Icon icon="mdi:barcode-scan" class="text-primary h-20 w-20" />
        {:else if howStep === 2}
          <Icon icon="mdi:monitor-dashboard" class="text-primary h-20 w-20" />
        {:else}
          <Icon icon="mdi:file-delimited-outline" class="text-primary h-20 w-20" />
        {/if}
      </div>

      <div class="mt-4 min-h-24">
        {#if howStep === 0}
          <h3 class="text-center text-lg font-bold">Welcome to InstiAttend!</h3>
          <p class="text-base-content/70 mt-1 text-center text-sm">
            InstiAttend is a simple attendance tracking app.<br />
            It automates proctored attendance collection.<br />
            Everything is done <span class="font-medium">on-device</span> — no server required.
          </p>
        {:else if howStep === 1}
          <h3 class="text-center text-lg font-bold">Collect on a phone</h3>
          <p class="text-base-content/70 mt-1 text-center text-sm">
            Open this site on a phone, and scan student ID barcodes.<br />
            Every scan is saved on that device.<br />
            Export to csv or json to manage on desktop.
          </p>
        {:else if howStep === 2}
          <h3 class="text-center text-lg font-bold">Manage on desktop</h3>
          <p class="text-base-content/70 mt-1 text-center text-sm">
            This wide view is the Desktop mode! <br />
            Import your scans, and manage your attendance with ease. <br />
            Focus a single day to drill into times, comments, and exam seating.
          </p>
        {:else}
          <h3 class="text-center text-lg font-bold">Export to a spreadsheet</h3>
          <p class="text-base-content/70 mt-1 text-center text-sm">
            Download the sheet as <span class="font-medium">CSV</span> (two columns per event: time and
            comment) and open it in Excel or Google Sheets — no server, no accounts.
          </p>
        {/if}
      </div>

      <div class="mt-4 flex items-center justify-between">
        <button
          type="button"
          class="btn btn-sm btn-ghost"
          onclick={howPrev}
          disabled={howStep === 0}
        >
          <Icon icon="mdi:chevron-left" class="h-4 w-4" /> Back
        </button>

        <div class="flex items-center gap-1.5">
          {#each Array.from({ length: HOW_STEPS }, (_, i) => i) as i (i)}
            <span
              class="h-1.5 rounded-full transition-all {i === howStep
                ? 'bg-primary w-4'
                : 'bg-base-content/20 w-1.5'}"
            ></span>
          {/each}
        </div>

        <button type="button" class="btn btn-sm btn-primary" onclick={howNext}>
          {#if howStep === HOW_STEPS - 1}
            <Icon icon="mdi:check" class="h-4 w-4" /> Get started
          {:else}
            Next <Icon icon="mdi:chevron-right" class="h-4 w-4" />
          {/if}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>

  <dialog bind:this={studentInfoDialog} class="modal">
    <div class="modal-box">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
      </form>
      <h3 class="text-lg font-bold">Student Management Help</h3>
      <ul class="mt-3 list-disc space-y-1 pl-5 text-sm">
        <li>
          The <span class="font-medium">roll</span> and <span class="font-medium">name</span> are stored.
        </li>
        <li>
          When uploading a CSV, a header row (<code>roll,name</code>) is optional — it's detected
          automatically. Without one, column 1 is the roll and column 2 is the name.
        </li>
        <li>
          Importing <span class="font-medium">merges</span> into the current student list; existing rolls
          are updated.
        </li>
      </ul>
      <pre class="bg-base-200 rounded-box mt-3 overflow-x-auto p-3 text-xs">roll,name
24M2111,Arghyadip Chakraborty
22D0371,Debojeet Das</pre>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>

  <dialog bind:this={clearBlockedDialog} class="modal">
    <div class="modal-box">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
      </form>
      <h3 class="flex items-center gap-2 text-lg font-bold">
        <Icon icon="mdi:lock-outline" class="text-warning h-5 w-5" />
        Can't clear students yet
      </h3>
      <p class="mt-3 text-sm">
        <span class="font-medium">{recordCount}</span>
        attendance record{recordCount === 1 ? '' : 's'} across
        <span class="font-medium">{eventsWithData}</span>
        event{eventsWithData === 1 ? '' : 's'} still reference these students. Clearing the list now would
        leave the sheet full of rolls with no names.
      </p>
      <p class="text-base-content/60 mt-2 text-sm">
        Export the sheet first if you still need it, then delete the events — that removes their
        attendance and seating too. After that the student list can be cleared.
      </p>
      <div class="modal-action">
        <form method="dialog"><button class="btn btn-ghost">Close</button></form>
        <button
          class="btn btn-error"
          onclick={() => {
            clearBlockedDialog.close()
            confirmRemoveAllEvents()
          }}
        >
          <Icon icon="mingcute:delete-line" class="h-4 w-4" /> Delete all events
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>

  <dialog bind:this={collectionInfoDialog} class="modal">
    <div class="modal-box">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
      </form>
      <h3 class="text-lg font-bold">Collect Attendance Help</h3>
      <ul class="mt-3 list-disc space-y-1 pl-5 text-sm">
        <li>
          Upload an export taken from a phone — either the
          <span class="font-medium">JSON</span> or the <span class="font-medium">CSV</span> file it downloads.
        </li>
        <li>
          A CSV needs a <code>rollno</code> (or <code>roll</code>) and a <code>timestamp</code> (or
          <code>time</code>) column; <code>auto</code> and <code>comment</code> are optional. Column order
          does not matter.
        </li>
        <li>
          You then pick the event to <span class="font-medium">merge into</span>, or create a new
          one right there — the file itself carries no event.
        </li>
        <li>
          Rolls already present in the target event are kept unless you tick
          <span class="font-medium">Overwrite</span>. So collecting from several phones for the same
          event is just several imports.
        </li>
        <li>
          Rolls that are not in the student list still land in the sheet; they simply show up
          without a name.
        </li>
      </ul>
      <pre
        class="bg-base-200 rounded-box mt-3 overflow-x-auto p-3 text-xs">rollno,timestamp,auto,comment
24M2111,2026-08-05T09:31:12+05:30,true,
22D0371,2026-08-05T09:44:03+05:30,false,late entry</pre>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>

  <dialog bind:this={eventsInfoDialog} class="modal">
    <div class="modal-box">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
      </form>
      <h3 class="text-lg font-bold">Events Help</h3>
      <ul class="mt-3 list-disc space-y-1 pl-5 text-sm">
        <li>
          Every event is one column of the attendance sheet. Events are ordered by
          <span class="font-medium">date</span>, then name.
        </li>
        <li>
          A <span class="font-medium">class</span> records only times and comments. An
          <span class="font-medium">exam</span> also holds seating, so its focused view gains Room and
          Seat columns.
        </li>
        <li>
          Adding an event with the same name and date as an existing one reuses that event instead
          of duplicating it.
        </li>
        <li>
          Hover a row for its actions: upload seating (exams), edit name/type/date, or delete.
          Seating CSV columns are <code>roll, room, seat</code> and a fresh upload replaces the previous
          one.
        </li>
        <li>
          Deleting an event also deletes its attendance and seating.
          <span class="font-medium">Delete all events</span> wipes every event at once — needed before
          the student list can be cleared.
        </li>
        <li>The last event deleted is replaced by an empty <code>Default</code> event.</li>
      </ul>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>

  <dialog bind:this={addStudentDialog} class="modal">
    <div class="modal-box">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
      </form>
      <h3 class="text-lg font-bold">Add student</h3>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Roll number</legend>
        <input
          bind:value={manualRoll}
          type="text"
          class="input w-full"
          placeholder="e.g. 22D0300"
          onkeydown={onEnter(addStudent)}
        />
        <legend class="fieldset-legend">Name</legend>
        <input
          bind:value={manualName}
          type="text"
          class="input w-full"
          placeholder="e.g. Robert Downey"
          onkeydown={onEnter(addStudent)}
        />
      </fieldset>
      <div class="modal-action">
        <form method="dialog"><button class="btn btn-ghost">Cancel</button></form>
        <button class="btn btn-primary" disabled={manualRoll.trim() === ''} onclick={addStudent}>
          Add
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>

  <dialog bind:this={importDialog} class="modal">
    <div class="modal-box">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
      </form>
      <h3 class="text-lg font-bold">Collect attendance</h3>
      <p class="text-base-content/60 mt-1 text-sm">
        <span class="font-medium">{importCount}</span>
        record{importCount === 1 ? '' : 's'} from
        <span class="font-mono">{importFileName}</span>
      </p>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">Merge into</legend>
        <select bind:value={importTarget} class="select w-full">
          {#each columns as ev (ev.id)}
            <option value={ev.id}>
              {ev.name} · {ev.date}{ev.type === 'exam' ? ' · exam' : ''}
            </option>
          {/each}
          <option value="__new__">+ New event…</option>
        </select>

        {#if importTarget === '__new__'}
          <legend class="fieldset-legend">Name</legend>
          <input
            bind:value={importNewName}
            type="text"
            class="input w-full"
            placeholder="Event name"
            onkeydown={onEnter(doImport)}
          />
          <div class="flex gap-2">
            <select bind:value={importNewType} class="select flex-1">
              <option value="class">Class</option>
              <option value="exam">Exam</option>
            </select>
            <input
              bind:value={importNewDate}
              type="date"
              class="input flex-1"
              onkeydown={onEnter(doImport)}
            />
          </div>
        {/if}
      </fieldset>

      <label class="label mt-1 cursor-pointer justify-start gap-2">
        <input type="checkbox" class="checkbox checkbox-sm" bind:checked={importOverwrite} />
        <span class="text-sm">Overwrite rolls already in the target event</span>
      </label>
      <p class="text-base-content/50 text-xs">
        {importOverwrite
          ? 'Existing rolls in the target event will be replaced.'
          : 'Existing rolls in the target event are kept.'}
      </p>

      <div class="modal-action">
        <form method="dialog"><button class="btn btn-ghost">Cancel</button></form>
        <button
          class="btn btn-primary"
          disabled={importTarget === '__new__' && importNewName.trim() === ''}
          onclick={doImport}
        >
          Merge
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>

  <!-- edit event -->
  <dialog bind:this={editEventDialog} class="modal">
    <div class="modal-box">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
      </form>
      <h3 class="text-lg font-bold">Edit event</h3>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Name</legend>
        <input
          bind:value={editName}
          type="text"
          class="input w-full"
          onkeydown={onEnter(saveEditEvent)}
        />
        <legend class="fieldset-legend">Type</legend>
        <select bind:value={editType} class="select w-full">
          <option value="class">Class</option>
          <option value="exam">Exam</option>
        </select>
        <legend class="fieldset-legend">Date</legend>
        <input
          bind:value={editDate}
          type="date"
          class="input w-full"
          onkeydown={onEnter(saveEditEvent)}
        />
      </fieldset>

      {#if editType === 'exam'}
        <div class="divider my-2 text-xs">Seating</div>
        <input
          type="file"
          accept=".csv,text/csv"
          class="file-input file-input-sm w-full"
          onchange={onSeatingFile}
        />
        <p class="text-base-content/50 mt-1 text-xs">CSV columns: roll, room, seat</p>
        {#if editSeatCount > 0}
          <div class="mt-2 flex items-center justify-between text-xs">
            <span>
              {editSeatCount} seat{editSeatCount === 1 ? '' : 's'} · {editRooms.length} room{editRooms.length ===
              1
                ? ''
                : 's'}
            </span>
            <button
              class="btn btn-xs btn-ghost text-error"
              onclick={() => confirmClearSeating(editEventId)}
            >
              Clear seating
            </button>
          </div>
          {#if editRooms.length > 0}
            <ul class="rounded-box bg-base-200 mt-1 max-h-40 overflow-y-auto p-2 text-xs">
              {#each editRooms as room (room)}
                {@const st = roomStats(editEventId, room)}
                <li class="flex justify-between py-0.5">
                  <span class="font-medium">{room}</span>
                  <span class="text-base-content/60">
                    {st.present}/{st.assigned} present · {st.absent} absent
                  </span>
                </li>
              {/each}
            </ul>
          {/if}
        {/if}
      {/if}

      <div class="modal-action">
        <form method="dialog"><button class="btn btn-ghost">Cancel</button></form>
        <button class="btn btn-primary" disabled={editName.trim() === ''} onclick={saveEditEvent}>
          Save
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>

  <dialog bind:this={detailDialog} class="modal">
    <div class="modal-box">
      <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
      </form>
      {#if detail}
        <h3 class="text-lg font-bold">
          <span class="font-mono">{detail.roll}</span>{detail.name ? ` · ${detail.name}` : ''}
        </h3>
        <div class="mt-3 space-y-2 text-sm">
          <div class="flex justify-between gap-4">
            <span class="text-base-content/60">Event</span>
            <span class="text-right font-medium">{detail.eventName} · {detail.eventDate}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-base-content/60">Marked</span>
            <span>{toISOStringTZ(detail.rec.timestamp)}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-base-content/60">Source</span>
            <span class={detail.rec.auto ? 'text-success' : 'text-warning'}>
              {detail.rec.auto ? 'Scanned' : 'Manual'}
            </span>
          </div>
          {#if detail.seat}
            <div class="flex justify-between gap-4">
              <span class="text-base-content/60">Seat</span>
              <span
                >{detail.seat.room ? `${detail.seat.room} · ` : ''}{detail.seat.seat || '—'}</span
              >
            </div>
          {/if}
          <div>
            <div class="text-base-content/60">Comment</div>
            <div class="bg-base-200 rounded-box mt-1 p-2">{detail.rec.comment || '—'}</div>
          </div>
        </div>
      {/if}
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>
</div>
