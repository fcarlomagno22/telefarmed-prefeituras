import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildWeeklyHistorySeries,
  getWeekStartIsoForDate,
  summarizeHistoryPoint,
} from './myRoutineHistoryStats'
import type { MyRoutineDayHistoryEntry } from '../types/myRoutine'

test('getWeekStartIsoForDate retorna segunda-feira', () => {
  assert.equal(getWeekStartIsoForDate('2026-06-25'), '2026-06-22')
})

test('buildWeeklyHistorySeries agrupa 4 semanas', () => {
  const entries: MyRoutineDayHistoryEntry[] = [
    { dateIso: '2026-06-22', minimalDone: 2, minimalTotal: 2, dayMode: 'normal' },
    { dateIso: '2026-06-23', minimalDone: 1, minimalTotal: 2, dayMode: 'light' },
    { dateIso: '2026-06-15', minimalDone: 2, minimalTotal: 2, dayMode: 'normal' },
  ]

  const series = buildWeeklyHistorySeries(entries, 4, new Date('2026-06-25T12:00:00'))
  assert.equal(series.length, 4)
  assert.equal(series[3]?.weekStartIso, '2026-06-22')
  assert.equal(series[3]?.minimalOkDays, 1)
  assert.equal(series[3]?.lightDays, 1)
  assert.equal(series[2]?.minimalOkDays, 1)
})

test('summarizeHistoryPoint sem registros', () => {
  const point = buildWeeklyHistorySeries([], 1)[0]!
  assert.equal(summarizeHistoryPoint(point), 'Sem registros nesta semana')
})
