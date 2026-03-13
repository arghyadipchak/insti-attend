interface AttendanceRecord {
  timestamp: Date
  auto: boolean
  comment: string
}

export const attendance = $state<Record<string, AttendanceRecord>>(
  JSON.parse(localStorage.getItem('attendance') || '{}', (key, value) => {
    return key === 'timestamp' && typeof value === 'string' ? new Date(value) : value
  })
)
