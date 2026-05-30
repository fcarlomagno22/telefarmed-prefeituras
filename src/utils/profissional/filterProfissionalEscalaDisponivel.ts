import type {
  ProfissionalEscalaDisponivel,
  ProfissionalEscalaFilters,
  ProfissionalEscalaTurn,
} from '../../types/profissionalEscalaDisponivel'
import { parseBrlCurrencyInput } from '../formatBrlCurrency'
import { matchProfissionalSpecialty } from './matchProfissionalSpecialty'

export const defaultProfissionalEscalaFilters = (
  profileSpecialty: string,
): ProfissionalEscalaFilters => ({
  specialty: profileSpecialty,
  dateFrom: '',
  dateTo: '',
  turn: 'all',
  modality: 'all',
  minAmountReais: '',
  maxAmountReais: '',
})

function parseAmountReais(value: string) {
  return parseBrlCurrencyInput(value)
}

function sameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isWithinDateRange(iso: string, dateFrom: string, dateTo: string) {
  const shiftDay = iso.slice(0, 10)
  if (dateFrom && shiftDay < dateFrom) return false
  if (dateTo && shiftDay > dateTo) return false
  return true
}

export function shiftDurationHours(shift: ProfissionalEscalaDisponivel) {
  const ms = new Date(shift.endAt).getTime() - new Date(shift.startAt).getTime()
  return Math.round(ms / (1000 * 60 * 60))
}

export function filterProfissionalEscalaShifts(
  shifts: ProfissionalEscalaDisponivel[],
  filters: ProfissionalEscalaFilters,
  options?: { onlyDisponivel?: boolean; onlyMySpecialty?: boolean },
): ProfissionalEscalaDisponivel[] {
  const minAmount = parseAmountReais(filters.minAmountReais)
  const maxAmount = parseAmountReais(filters.maxAmountReais)

  return shifts
    .filter((shift) => {
      if (options?.onlyDisponivel && shift.status !== 'disponivel') return false
      if (options?.onlyMySpecialty && !matchProfissionalSpecialty(filters.specialty, shift.specialty)) {
        return false
      }
      if (filters.specialty !== 'all' && !matchProfissionalSpecialty(filters.specialty, shift.specialty)) {
        return false
      }
      if (!isWithinDateRange(shift.startAt, filters.dateFrom, filters.dateTo)) return false
      if (filters.turn !== 'all' && shift.turn !== filters.turn) return false
      if (filters.modality !== 'all' && shift.modality !== filters.modality) return false
      if (minAmount !== null && shift.amountCents / 100 < minAmount) return false
      if (maxAmount !== null && shift.amountCents / 100 > maxAmount) return false
      return true
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
}

export function countShiftsToday(
  shifts: ProfissionalEscalaDisponivel[],
  profileSpecialty: string,
  now = new Date(),
) {
  return shifts.filter(
    (s) =>
      s.status === 'disponivel' &&
      matchProfissionalSpecialty(profileSpecialty, s.specialty) &&
      sameCalendarDay(new Date(s.startAt), now),
  ).length
}

export function countShiftsThisWeek(
  shifts: ProfissionalEscalaDisponivel[],
  profileSpecialty: string,
  now = new Date(),
) {
  const weekStart = startOfWeek(now)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  return shifts.filter((s) => {
    if (s.status !== 'disponivel') return false
    if (!matchProfissionalSpecialty(profileSpecialty, s.specialty)) return false
    const start = new Date(s.startAt)
    return start >= weekStart && start < weekEnd
  }).length
}

export function averageShiftAmountCents(shifts: ProfissionalEscalaDisponivel[]) {
  if (shifts.length === 0) return 0
  return Math.round(shifts.reduce((sum, s) => sum + s.amountCents, 0) / shifts.length)
}

export function countClaimedThisMonth(
  shifts: ProfissionalEscalaDisponivel[],
  now = new Date(),
) {
  return shifts.filter((s) => {
    if (s.status !== 'reservado_mim') return false
    const d = new Date(s.startAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
}

export function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function resolveTurnFromHour(hour: number): ProfissionalEscalaTurn {
  if (hour < 12) return 'manha'
  if (hour < 18) return 'tarde'
  return 'noite'
}
