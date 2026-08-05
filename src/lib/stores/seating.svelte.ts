export interface Seat {
  room: string // division used to flag "wrong room" (may be empty)
  seat: string // free-form label, e.g. "R3-L-21" or "L-21"
}

// rollNo -> seat (one exam's seating)
export type EventSeating = Record<string, Seat>
// eventId -> rollNo -> seat
export type SeatingMap = Record<string, EventSeating>

function loadSeating(): SeatingMap {
  try {
    const raw = JSON.parse(localStorage.getItem('seating') || '{}')
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as SeatingMap
  } catch {
    /* fall through */
  }
  return {}
}

export const seating = $state<SeatingMap>(loadSeating())

export const selectedRoom = $state({ value: localStorage.getItem('selectedRoom') || '' })

// Can we put this in a utility file instead?
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

/**
 * Considering with or without header with column order 0 = roll, 1 = room, 2 = seat.
 * Replaces this event's seating. Returns rows imported.
 */
export function importSeatingCSV(eventId: string, text: string): number {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length === 0) return 0

  const header = splitCSVLine(lines[0]).map(h => h.toLowerCase())
  const rollIdx = header.findIndex(h => h === 'roll' || h === 'rollno' || h === 'roll no')
  const roomIdx = header.findIndex(h => h === 'room' || h === 'hall' || h === 'division')
  const seatIdx = header.findIndex(h => h === 'seat' || h === 'seatno' || h === 'seat no')
  const hasHeader = rollIdx !== -1 || roomIdx !== -1 || seatIdx !== -1

  const rCol = rollIdx === -1 ? 0 : rollIdx
  const roomCol = roomIdx === -1 ? 1 : roomIdx
  const seatCol = seatIdx === -1 ? 2 : seatIdx

  const map: EventSeating = {}
  let count = 0
  for (let i = hasHeader ? 1 : 0; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i])
    const roll = cols[rCol]?.trim()
    if (!roll) continue
    map[roll] = { room: cols[roomCol]?.trim() ?? '', seat: cols[seatCol]?.trim() ?? '' }
    count++
  }
  seating[eventId] = map
  return count
}

export function clearSeating(eventId: string) {
  delete seating[eventId]
}

export function rooms(eventId: string): string[] {
  const set = new Set<string>()
  for (const s of Object.values(seating[eventId] ?? {})) if (s.room) set.add(s.room)
  return [...set].sort((a, b) => a.localeCompare(b))
}
