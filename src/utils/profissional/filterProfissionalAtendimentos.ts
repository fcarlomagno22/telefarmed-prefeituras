import type {
  ProfissionalAttendanceRecord,
  ProfissionalAtendimentosFilters,
} from '../../types/profissionalAtendimentos'

export const defaultProfissionalAtendimentosFilters: ProfissionalAtendimentosFilters = {
  generalSearch: '',
  specialty: '',
  status: '',
  periodStart: '',
  periodEnd: '',
}

function normalizeSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function matchesSearch(record: ProfissionalAttendanceRecord, search: string) {
  if (!search) return true

  const haystack = [
    record.patientName,
    record.attendanceId,
    record.specialty,
    record.triageSummary ?? '',
    ...record.recordNotes.map((note) => note.note),
    ...record.issuedDocuments.map((doc) => doc.title),
  ]
    .join(' ')
    .toLowerCase()

  return normalizeSearch(haystack).includes(normalizeSearch(search))
}

function matchesPeriod(record: ProfissionalAttendanceRecord, start: string, end: string) {
  if (!start && !end) return true

  const dateKey = record.dateTimeIso.slice(0, 10)
  if (start && dateKey < start) return false
  if (end && dateKey > end) return false
  return true
}

export function filterProfissionalAtendimentos(
  records: ProfissionalAttendanceRecord[],
  filters: ProfissionalAtendimentosFilters,
): ProfissionalAttendanceRecord[] {
  return records
    .filter((record) => matchesSearch(record, filters.generalSearch))
    .filter((record) => !filters.specialty || record.specialty === filters.specialty)
    .filter((record) => !filters.status || record.status === filters.status)
    .filter((record) => matchesPeriod(record, filters.periodStart, filters.periodEnd))
    .sort(
      (a, b) => new Date(b.dateTimeIso).getTime() - new Date(a.dateTimeIso).getTime(),
    )
}
