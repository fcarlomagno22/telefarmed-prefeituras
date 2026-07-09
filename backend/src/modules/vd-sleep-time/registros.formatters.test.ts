import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildSleepAtIsoFromParts,
  computeDurationMinutes,
  extractSleepDatePartsFromIso,
  mapAppSleepLogEntryToCreateInput,
  mapCreateInputToInsertRow,
  mapRegistroDtoToAppSleepLogEntry,
} from './registros.formatters.js'

const TEST_SCOPE = {
  pacienteId: '22222222-2222-2222-2222-222222222202',
  entidadeContratanteId: '22222222-2222-2222-2222-222222222203',
  cpf: '52998224725',
}

const APP_ENTRY = {
  id: '1734567890-abc123',
  bedDateIso: '2026-07-08',
  bedTimeMinutes: 22 * 60 + 30,
  wakeDateIso: '2026-07-09',
  wakeTimeMinutes: 7 * 60,
  durationMinutes: 999,
  quality: 4 as const,
  wakeCount: 1,
  notes: 'Dormi bem.',
  createdAt: '2026-07-09T08:00:00.000Z',
}

describe('computeDurationMinutes', () => {
  it('calcula duração a partir de bedAt e wakeAt', () => {
    const duration = computeDurationMinutes(
      '2026-07-08T22:30:00.000-03:00',
      '2026-07-09T07:00:00.000-03:00',
    )
    assert.equal(duration, 510)
  })
})

describe('buildSleepAtIsoFromParts / extractSleepDatePartsFromIso', () => {
  it('converte partes locais para ISO e volta', () => {
    const iso = buildSleepAtIsoFromParts('2026-07-08', 22 * 60 + 30)
    assert.equal(iso, '2026-07-08T22:30:00.000-03:00')

    const parts = extractSleepDatePartsFromIso(iso)
    assert.equal(parts.dateIso, '2026-07-08')
    assert.equal(parts.timeMinutes, 22 * 60 + 30)
  })
})

describe('mapAppSleepLogEntryToCreateInput', () => {
  it('mapeia entry.id para clientLogId e ignora durationMinutes do app', () => {
    const input = mapAppSleepLogEntryToCreateInput(APP_ENTRY)
    assert.equal(input.clientLogId, APP_ENTRY.id)
    assert.equal(input.bedAt, '2026-07-08T22:30:00.000-03:00')
    assert.equal(input.wakeAt, '2026-07-09T07:00:00.000-03:00')
    assert.equal(input.quality, 4)
    assert.equal(input.wakeCount, 1)
    assert.equal(input.notes, 'Dormi bem.')
    assert.equal('durationMinutes' in input, false)
  })
})

describe('mapCreateInputToInsertRow', () => {
  it('recalcula duration_minutes no servidor (não usa valor do client)', () => {
    const input = mapAppSleepLogEntryToCreateInput(APP_ENTRY)
    const row = mapCreateInputToInsertRow(TEST_SCOPE, input)
    assert.equal(row.duration_minutes, 510)
    assert.notEqual(row.duration_minutes, APP_ENTRY.durationMinutes)
  })
})

describe('mapRegistroDtoToAppSleepLogEntry', () => {
  it('mapeia DTO da API para formato SleepLogEntry do app', () => {
    const dto = {
      id: '11111111-1111-1111-1111-111111111111',
      clientLogId: '1734567890-abc123',
      bedAt: '2026-07-08T22:30:00.000-03:00',
      wakeAt: '2026-07-09T07:00:00.000-03:00',
      durationMinutes: 510,
      quality: 4 as const,
      wakeCount: 1,
      notes: 'Dormi bem.',
      createdAt: '2026-07-09T11:00:00.000Z',
      updatedAt: '2026-07-09T11:00:00.000Z',
    }

    const entry = mapRegistroDtoToAppSleepLogEntry(dto)
    assert.equal(entry.id, dto.clientLogId)
    assert.equal(entry.serverId, dto.id)
    assert.equal(entry.bedDateIso, '2026-07-08')
    assert.equal(entry.bedTimeMinutes, 22 * 60 + 30)
    assert.equal(entry.wakeDateIso, '2026-07-09')
    assert.equal(entry.wakeTimeMinutes, 7 * 60)
    assert.equal(entry.durationMinutes, 510)
    assert.equal(entry.quality, 4)
    assert.equal(entry.wakeCount, 1)
    assert.equal(entry.notes, 'Dormi bem.')
    assert.equal(entry.createdAt, dto.createdAt)
  })
})
