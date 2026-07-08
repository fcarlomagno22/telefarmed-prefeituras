import type { PeriodSelection } from '../types/metrics'
import { formatDateKey } from './metricsPeriod'

const WEIGHT_HISTORY_DEFAULT_DAYS = 90

export function periodSelectionToIsoRange(period: PeriodSelection): {
  start: string
  end: string
} {
  return {
    start: period.start.toISOString(),
    end: period.end.toISOString(),
  }
}

export function buildDefaultWeightHistoryRange(days = WEIGHT_HISTORY_DEFAULT_DAYS): {
  start: string
  end: string
} {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export const DEFAULT_WEIGHT_HISTORY_DAYS = WEIGHT_HISTORY_DEFAULT_DAYS

export function formatDateKeyFromIso(iso: string): string {
  return iso.slice(0, 10)
}
