import type { AccessLogEntry, AccessLogOutcome } from '../data/accessLogsMock'
import { addDays, isSameDay, parseDateKey, toDateKey } from './agendaDate'

export type AccessLogsDatePreset = 'today' | 'yesterday' | 'last7' | 'all' | 'custom'

export type AccessLogsFilters = {
  datePreset: AccessLogsDatePreset
  customDate: string
  search: string
  userId: string
  pageId: string
  outcome: 'all' | AccessLogOutcome
}

export const defaultAccessLogsFilters = (): AccessLogsFilters => ({
  datePreset: 'today',
  customDate: toDateKey(new Date()),
  search: '',
  userId: '',
  pageId: '',
  outcome: 'all',
})

function matchesDatePreset(entry: AccessLogEntry, filters: AccessLogsFilters, today: Date) {
  const entryDate = new Date(entry.accessedAt)

  switch (filters.datePreset) {
    case 'today':
      return isSameDay(entryDate, today)
    case 'yesterday':
      return isSameDay(entryDate, addDays(today, -1))
    case 'last7': {
      const start = addDays(today, -6)
      start.setHours(0, 0, 0, 0)
      return entryDate >= start && entryDate <= today
    }
    case 'all':
      return true
    case 'custom': {
      const selected = parseDateKey(filters.customDate)
      return isSameDay(entryDate, selected)
    }
    default:
      return true
  }
}

export function applyAccessLogsFilters(
  logs: AccessLogEntry[],
  filters: AccessLogsFilters,
  today = new Date(),
): AccessLogEntry[] {
  const normalizedSearch = filters.search.trim().toLowerCase()

  return logs.filter((entry) => {
    if (!matchesDatePreset(entry, filters, today)) return false
    if (filters.userId && entry.userId !== filters.userId) return false
    if (filters.pageId && entry.pageId !== filters.pageId) return false
    if (filters.outcome !== 'all' && entry.outcome !== filters.outcome) return false

    if (normalizedSearch) {
      const haystack =
        `${entry.userName} ${entry.userEmail} ${entry.pageLabel} ${entry.device} ${entry.ipAddress}`.toLowerCase()
      if (!haystack.includes(normalizedSearch)) return false
    }

    return true
  })
}

export function countActiveAccessLogFilters(filters: AccessLogsFilters): number {
  let count = 0
  if (filters.datePreset !== 'today') count += 1
  if (filters.search.trim()) count += 1
  if (filters.userId) count += 1
  if (filters.pageId) count += 1
  if (filters.outcome !== 'all') count += 1
  return count
}

export function formatAccessLogTime(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

export function formatAccessLogDateLabel(iso: string) {
  const date = new Date(iso)
  const today = new Date()
  if (isSameDay(date, today)) return 'Hoje'
  if (isSameDay(date, addDays(today, -1))) return 'Ontem'
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  }).format(date)
}
