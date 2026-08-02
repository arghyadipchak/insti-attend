export type EventType = 'class' | 'exam'

export interface CourseEvent {
  id: string
  name: string
  type: EventType
  date: string // yyyy-mm-dd
}

export const DEFAULT_EVENT_ID = 'default'

export function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function loadEvents(): CourseEvent[] {
  try {
    const raw = JSON.parse(localStorage.getItem('events') || '[]')
    if (Array.isArray(raw)) {
      const valid = raw.filter(
        (e): e is CourseEvent =>
          e && typeof e.id === 'string' && typeof e.name === 'string' && typeof e.date === 'string'
      )
      if (valid.length > 0) return valid
    }
  } catch {
    /* fall through to default */
  }
  return [{ id: DEFAULT_EVENT_ID, name: 'Default', type: 'class', date: todayISO() }]
}

export const events = $state<CourseEvent[]>(loadEvents())

export const currentEvent = $state<{ id: string }>({
  id:
    localStorage.getItem('currentEventId') ||
    (events.find(e => e.id === DEFAULT_EVENT_ID) ? DEFAULT_EVENT_ID : events[0].id)
})

export const recentCustom = $state<{ id: string }>({
  id: currentEvent.id === DEFAULT_EVENT_ID ? '' : currentEvent.id
})

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function sortedEvents(): CourseEvent[] {
  return [...events].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name))
}

export function findEvent(name: string, date: string): CourseEvent | undefined {
  const n = name.trim().toLowerCase()
  return events.find(e => e.name.trim().toLowerCase() === n && e.date === date)
}

export function createEvent(name: string, type: EventType, date: string): CourseEvent {
  const existing = findEvent(name, date)
  if (existing) {
    currentEvent.id = existing.id
    return existing
  }
  const event: CourseEvent = { id: makeId(), name: name.trim() || 'Untitled', type, date }
  events.push(event)
  currentEvent.id = event.id
  return event
}

export function updateEvent(id: string, name: string, type: EventType, date: string) {
  const event = events.find(e => e.id === id)
  if (!event) return
  event.name = name.trim() || event.name
  event.type = type
  event.date = date
}

export function deleteEvent(id: string) {
  const idx = events.findIndex(e => e.id === id)
  if (idx === -1) return
  events.splice(idx, 1)
  if (events.length === 0)
    events.push({ id: DEFAULT_EVENT_ID, name: 'Default', type: 'class', date: todayISO() })
  if (currentEvent.id === id) currentEvent.id = events[0].id
}
