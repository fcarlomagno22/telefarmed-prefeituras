import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  heartRateReadingToRegisterInput,
  mapHeartRateHistoryEntryDto,
  mergeHeartRateReading,
} from './heartRateHistory'

describe('heartRateHistory', () => {
  it('mapeia leitura manual da API', () => {
    const reading = mapHeartRateHistoryEntryDto({
      id: '11111111-1111-1111-1111-111111111111',
      recordedAt: '2026-07-08T10:30:00.000-03:00',
      bpm: 74,
      source: 'manual',
      context: 'manual',
    })

    assert.equal(reading.source, 'Manual')
    assert.equal(reading.bpm, 74)
  })

  it('mapeia leitura de integração com sourceLabel', () => {
    const reading = mapHeartRateHistoryEntryDto({
      id: '22222222-2222-2222-2222-222222222222',
      recordedAt: '2026-07-08T10:30:00.000-03:00',
      bpm: 96,
      source: 'integracao',
      context: 'workout',
      sourceLabel: 'Apple Health',
    })

    assert.equal(reading.source, 'Apple Health')
    assert.equal(reading.context, 'workout')
  })

  it('converte leitura manual para payload de registro', () => {
    const input = heartRateReadingToRegisterInput({
      id: 'manual-1',
      bpm: 72,
      recordedAt: new Date('2026-07-08T10:30:00.000-03:00'),
      source: 'Manual',
      context: 'manual',
    })

    assert.deepEqual(input, {
      bpm: 72,
      recordedAt: '2026-07-08T13:30:00.000Z',
      source: 'manual',
      context: 'manual',
      sourceLabel: undefined,
    })
  })

  it('mescla leitura substituindo id duplicado', () => {
    const base = {
      id: 'same-id',
      bpm: 70,
      recordedAt: new Date('2026-07-08T08:00:00.000-03:00'),
      source: 'Manual' as const,
      context: 'manual' as const,
    }

    const next = mergeHeartRateReading([base], { ...base, bpm: 75 })
    assert.equal(next.length, 1)
    assert.equal(next[0]?.bpm, 75)
  })
})
