import { DEFAULT_EVENT_ID } from './events.svelte'

export interface AttendanceRecord {
  timestamp: Date
  auto: boolean
  comment: string
}

export type EventAttendance = Record<string, AttendanceRecord>
export type AttendanceMap = Record<string, EventAttendance>

const reviveTimestamp = (key: string, value: unknown) =>
  key === 'timestamp' && typeof value === 'string' ? new Date(value) : value

function isRecord(value: unknown): value is AttendanceRecord {
  return !!value && typeof value === 'object' && 'timestamp' in value && 'auto' in value
}

function load(): AttendanceMap {
  let raw: unknown
  try {
    raw = JSON.parse(localStorage.getItem('attendance') || '{}', reviveTimestamp)
  } catch {
    return {}
  }
  if (!raw || typeof raw !== 'object') return {}

  const values = Object.values(raw as Record<string, unknown>)
  if (values.length === 0) return {}

  // Old flat shape { rollNo: record } -> nest under the default event.
  if (values.some(isRecord)) return { [DEFAULT_EVENT_ID]: raw as EventAttendance }

  // Already nested { eventId: { rollNo: record } }.
  return raw as AttendanceMap
}

export const attendance = $state<AttendanceMap>(load())

export function eventRecords(eventId: string): EventAttendance {
  return (attendance[eventId] ??= {})
}
