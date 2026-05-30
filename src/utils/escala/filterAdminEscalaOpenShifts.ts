import type { AdminEscalaShift } from '../../types/adminEscala'
import type { ProfissionalEscalaTurn } from '../../types/profissionalEscalaDisponivel'
import { parseBrlCurrencyInput } from '../formatBrlCurrency'
import { adminModalityToProfissional } from './escalaModality'
import { computeAdminEscalaFillStatus } from './escalaShiftMeta'

export type AdminEscalaOpenFilters = {
  specialty: string
  dateFrom: string
  dateTo: string
  turn: 'all' | ProfissionalEscalaTurn
  modality: 'all' | 'tele' | 'presencial' | 'hibrido'
  assignmentMode: 'all' | 'open' | 'assigned'
  fillStatus: 'all' | 'aberto' | 'parcial' | 'lotado'
  status: 'all' | 'publicada' | 'rascunho' | 'cancelada'
  minAmountReais: string
  maxAmountReais: string
  search: string
}

export const defaultAdminEscalaOpenFilters = (): AdminEscalaOpenFilters => ({
  specialty: 'all',
  dateFrom: '',
  dateTo: '',
  turn: 'all',
  modality: 'all',
  assignmentMode: 'all',
  fillStatus: 'all',
  status: 'all',
  minAmountReais: '',
  maxAmountReais: '',
  search: '',
})

function parseAmountReais(value: string) {
  return parseBrlCurrencyInput(value)
}

function isWithinDateRange(iso: string, dateFrom: string, dateTo: string) {
  const shiftDay = iso.slice(0, 10)
  if (dateFrom && shiftDay < dateFrom) return false
  if (dateTo && shiftDay > dateTo) return false
  return true
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function filterAdminEscalaShifts(
  shifts: AdminEscalaShift[],
  filters: AdminEscalaOpenFilters,
): AdminEscalaShift[] {
  const minAmount = parseAmountReais(filters.minAmountReais)
  const maxAmount = parseAmountReais(filters.maxAmountReais)
  const query = normalizeSearch(filters.search.trim())

  return shifts
    .filter((shift) => {
      if (filters.status !== 'all' && shift.status !== filters.status) return false
      if (filters.assignmentMode !== 'all' && shift.assignmentMode !== filters.assignmentMode) {
        return false
      }
      if (filters.specialty !== 'all' && shift.specialty !== filters.specialty) return false
      if (!isWithinDateRange(shift.startAt, filters.dateFrom, filters.dateTo)) return false
      if (filters.turn !== 'all' && shift.turn !== filters.turn) return false
      if (filters.modality !== 'all') {
        if (filters.modality === 'hibrido' && shift.modality !== 'hibrido') return false
        if (filters.modality === 'tele' && shift.modality !== 'tele') return false
        if (
          filters.modality === 'presencial' &&
          shift.modality !== 'presencial_ubt'
        ) {
          return false
        }
      }
      const fill = computeAdminEscalaFillStatus(shift)
      if (filters.fillStatus !== 'all' && fill !== filters.fillStatus) return false
      if (minAmount !== null && shift.amountCents / 100 < minAmount) return false
      if (maxAmount !== null && shift.amountCents / 100 > maxAmount) return false
      if (query) {
        const blob = normalizeSearch(
          [
            shift.specialty,
            shift.unitName,
            shift.city,
            shift.notes,
            adminModalityToProfissional(shift.modality),
          ].join(' '),
        )
        if (!blob.includes(query)) return false
      }
      return true
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
}

export function countOpenVacancies(shifts: AdminEscalaShift[]) {
  return shifts
    .filter((s) => s.assignmentMode === 'open' && s.status === 'publicada')
    .reduce((sum, s) => sum + s.vacancies, 0)
}

export function countClaimedCapturesInPeriod(
  shifts: AdminEscalaShift[],
  monthStart: Date,
  monthEnd: Date,
) {
  let count = 0
  for (const shift of shifts) {
    for (const capture of shift.claimedCaptures) {
      const at = new Date(capture.claimedAt)
      if (at >= monthStart && at <= monthEnd) count += 1
    }
  }
  return count
}
