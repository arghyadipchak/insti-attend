export interface Student {
  name: string
}

// rollNo -> student
export type Students = Record<string, Student>

function loadStudents(): Students {
  try {
    const raw = JSON.parse(
      localStorage.getItem('students') || localStorage.getItem('roster') || '{}'
    )
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Students
  } catch {
    /* fall through */
  }
  return {}
}

export const students = $state<Students>(loadStudents())

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

export function importStudentsCSV(text: string): number {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length === 0) return 0

  const header = splitCSVLine(lines[0]).map(h => h.toLowerCase())
  const rollIdx = header.findIndex(h => h === 'roll' || h === 'rollno' || h === 'roll no')
  const nameIdx = header.findIndex(h => h === 'name' || h === 'student' || h === 'student name')
  const hasHeader = rollIdx !== -1 || nameIdx !== -1

  const rCol = rollIdx === -1 ? 0 : rollIdx
  const nCol = nameIdx === -1 ? 1 : nameIdx

  let count = 0
  for (let i = hasHeader ? 1 : 0; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i])
    const roll = cols[rCol]?.trim()
    if (!roll) continue
    students[roll] = { name: cols[nCol]?.trim() || '' }
    count++
  }
  return count
}

export function clearStudents() {
  for (const roll of Object.keys(students)) delete students[roll]
}
