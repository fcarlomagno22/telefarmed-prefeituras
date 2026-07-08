import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildEmptyMetasSemanaisDto,
  mapMetasSemanalRowToDto,
  mapUpsertInputToRowFields,
  resolveCurrentWeekStartDateKey,
  type RunWalkMetasSemanalRow,
} from './metas-semanais.formatters.js'

const sampleRow: RunWalkMetasSemanalRow = {
  id: '11111111-1111-1111-1111-111111111111',
  paciente_id: 'pac-1',
  entidade_contratante_id: 'ent-1',
  semana_inicio: '2026-07-06',
  target_activities: 4,
  target_active_minutes: 150,
  target_movement_days: 5,
  criado_em: '2026-07-08T10:00:00.000-03:00',
  atualizado_em: '2026-07-08T12:00:00.000-03:00',
}

describe('metas-semanais.formatters', () => {
  it('resolve segunda-feira da semana corrente no fuso do app', () => {
    assert.equal(
      resolveCurrentWeekStartDateKey(new Date('2026-07-08T15:00:00.000-03:00')),
      '2026-07-06',
    )
    assert.equal(
      resolveCurrentWeekStartDateKey(new Date('2026-07-06T08:00:00.000-03:00')),
      '2026-07-06',
    )
  })

  it('mapeia row do banco para DTO alinhado ao app', () => {
    const dto = mapMetasSemanalRowToDto(sampleRow)

    assert.equal(dto.weekStartDate, '2026-07-06')
    assert.deepEqual(dto.targets, {
      targetActivities: 4,
      targetActiveMinutes: 150,
      targetMovementDays: 5,
    })
    assert.equal(dto.createdAt, sampleRow.criado_em)
    assert.equal(dto.updatedAt, sampleRow.atualizado_em)
  })

  it('monta DTO vazio quando não há meta da semana', () => {
    const dto = buildEmptyMetasSemanaisDto('2026-07-06')

    assert.equal(dto.weekStartDate, '2026-07-06')
    assert.equal(dto.targets, null)
    assert.equal(dto.createdAt, null)
    assert.equal(dto.updatedAt, null)
  })

  it('mapeia input de upsert para colunas da tabela', () => {
    assert.deepEqual(
      mapUpsertInputToRowFields({
        targetActivities: 3,
        targetActiveMinutes: 120,
        targetMovementDays: 4,
      }),
      {
        target_activities: 3,
        target_active_minutes: 120,
        target_movement_days: 4,
      },
    )
  })
})
