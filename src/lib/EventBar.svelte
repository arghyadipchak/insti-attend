<script lang="ts">
  import Icon from '@iconify/svelte'

  import { showAlert } from './stores/alert.svelte'
  import { attendance } from './stores/attendance.svelte'
  import { confirmAction } from './stores/confirm.svelte'
  import {
    createEvent,
    currentEvent,
    DEFAULT_EVENT_ID,
    deleteEvent,
    events,
    recentCustom,
    sortedEvents,
    todayISO,
    type CourseEvent,
    type EventType
  } from './stores/events.svelte'
  import { importSeatingCSV, rooms, selectedRoom } from './stores/seating.svelte'

  let customEvents = $derived(sortedEvents().filter(e => e.id !== DEFAULT_EVENT_ID))

  $effect(() => {
    if (currentEvent.id !== DEFAULT_EVENT_ID) recentCustom.id = currentEvent.id
  })
  let recentEvent = $derived(events.find(e => e.id === recentCustom.id) ?? null)

  let onDefault = $derived(currentEvent.id === DEFAULT_EVENT_ID)
  let currentIsExam = $derived(events.find(e => e.id === currentEvent.id)?.type === 'exam')
  let currentRooms = $derived(rooms(currentEvent.id))

  $effect(() => {
    if (selectedRoom.value && !currentRooms.includes(selectedRoom.value)) selectedRoom.value = ''
  })

  function selectDefault() {
    currentEvent.id = DEFAULT_EVENT_ID
  }

  function selectRecent() {
    if (recentEvent) currentEvent.id = recentEvent.id
  }

  let dialog: HTMLDialogElement
  let manageOpen = $state(false)
  let name = $state('')
  let type = $state<EventType>('class')
  let date = $state(todayISO())
  let seatingFile = $state<File | null>(null)

  $effect(() => {
    if (!dialog) return
    if (manageOpen && !dialog.open) dialog.showModal()
    else if (!manageOpen && dialog.open) dialog.close()
  })

  function openManage() {
    name = ''
    type = 'class'
    date = todayISO()
    seatingFile = null
    manageOpen = true
  }

  async function submitNew() {
    if (name.trim().length === 0) return
    const event = createEvent(name, type, date)
    if (type === 'exam' && seatingFile) {
      const n = importSeatingCSV(event.id, await seatingFile.text())
      showAlert('settings', `Imported ${n} seat${n === 1 ? '' : 's'}`, seatingFile.name)
    }
    manageOpen = false
  }

  function pick(id: string) {
    currentEvent.id = id
    manageOpen = false
  }

  async function remove(event: CourseEvent) {
    const ok = await confirmAction(
      'Delete this event and all its attendance? This cannot be undone.',
      { title: 'Delete event', confirmLabel: 'Delete' }
    )
    if (!ok) return
    deleteEvent(event.id)
    delete attendance[event.id]
  }

  async function onSeatingRow(e: Event, id: string) {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    const n = importSeatingCSV(id, await file.text())
    showAlert('settings', `Imported ${n} seat${n === 1 ? '' : 's'}`, file.name)
  }

  function onSeatingPick(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    seatingFile = input.files?.[0] ?? null
  }

  function onEnter(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submitNew()
    }
  }
</script>

<div class="app-panel flex items-center gap-2 px-4 py-2.5">
  <button
    type="button"
    class="btn btn-sm rounded-full text-xs {onDefault ? 'btn-primary' : 'btn-outline'}"
    onclick={selectDefault}
  >
    Default
  </button>

  {#if recentEvent}
    <button
      type="button"
      class="btn btn-sm max-w-[9rem] rounded-full text-xs {currentEvent.id === recentEvent.id
        ? 'btn-primary'
        : 'btn-outline'}"
      onclick={selectRecent}
    >
      <span class="truncate">{recentEvent.name}</span>
    </button>

    {#if currentIsExam}
      {#if currentRooms.length > 0}
        <select
          class="select select-sm w-auto rounded-full"
          bind:value={selectedRoom.value}
          aria-label="Room"
        >
          <option value="">All rooms</option>
          {#each currentRooms as room (room)}
            <option value={room}>{room}</option>
          {/each}
        </select>
      {:else}
        <span class="badge badge-ghost badge-sm rounded-full">No rooms</span>
      {/if}
    {/if}
  {/if}

  <div class="flex-1"></div>

  <button
    type="button"
    class="btn btn-sm btn-square btn-primary"
    onclick={openManage}
    aria-label="Manage events"
  >
    <Icon icon="mdi:plus" class="h-5 w-5" />
  </button>
</div>

<dialog
  bind:this={dialog}
  class="modal modal-bottom sm:modal-middle"
  onclose={() => (manageOpen = false)}
>
  <div class="modal-box">
    <form method="dialog">
      <button class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
    </form>

    <h3 class="text-base font-bold">Events</h3>

    {#if customEvents.length > 0}
      <ul class="bg-base-200 rounded-box mt-3 divide-y divide-gray-500/15">
        {#each customEvents as event (event.id)}
          <li class="flex items-center gap-2 px-3 py-2">
            <button
              type="button"
              class="flex flex-1 items-center gap-2 text-left text-sm {event.id === currentEvent.id
                ? 'text-primary font-semibold'
                : ''}"
              onclick={() => pick(event.id)}
            >
              <span class="truncate">{event.name}</span>
              <span class="text-base-content/50 text-xs">{event.date}</span>
              {#if event.type === 'exam'}
                <span class="badge badge-xs badge-outline">exam</span>
              {/if}
            </button>

            {#if event.type === 'exam'}
              <label class="btn btn-xs btn-ghost btn-square" aria-label="Upload seating">
                <Icon icon="mdi:file-upload-outline" class="h-4 w-4" />
                <input
                  type="file"
                  accept=".csv,text/csv"
                  class="hidden"
                  onchange={e => onSeatingRow(e, event.id)}
                />
              </label>
            {/if}

            <button
              type="button"
              class="btn btn-xs btn-ghost btn-square text-error"
              onclick={() => remove(event)}
              aria-label="Delete event"
            >
              <Icon icon="mingcute:delete-line" class="h-4 w-4" />
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-base-content/60 mt-3 text-sm">No events yet — create one below.</p>
    {/if}

    <fieldset class="fieldset bg-base-300 rounded-box mt-3 gap-y-2 border border-gray-700 p-4">
      <legend class="fieldset-legend">New event</legend>

      <label for="event-name" class="label"><span class="label-text">Name</span></label>
      <input
        id="event-name"
        bind:value={name}
        type="text"
        class="input input-sm w-full"
        placeholder="e.g. Lecture 5"
        onkeydown={onEnter}
      />

      <label for="event-type" class="label"><span class="label-text">Type</span></label>
      <select id="event-type" bind:value={type} class="select select-sm w-full">
        <option value="class">Class</option>
        <option value="exam">Exam</option>
      </select>

      <label for="event-date" class="label"><span class="label-text">Date</span></label>
      <input
        id="event-date"
        bind:value={date}
        type="date"
        class="input input-sm w-full"
        onkeydown={onEnter}
      />

      <label for="event-seating" class="label">
        <span class="label-text">Seating</span>
        <span class="badge badge-neutral badge-xs">Exam only</span>
      </label>
      <input
        id="event-seating"
        type="file"
        accept=".csv,text/csv"
        class="file-input file-input-sm w-full"
        disabled={type !== 'exam'}
        onchange={onSeatingPick}
      />
      <p class="text-base-content/50 text-xs">CSV columns: roll, room, seat</p>
    </fieldset>

    <div class="modal-action">
      <form method="dialog">
        <button class="btn btn-ghost">Close</button>
      </form>
      <button class="btn btn-primary" disabled={name.trim().length === 0} onclick={submitNew}>
        Create
      </button>
    </div>
  </div>

  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
