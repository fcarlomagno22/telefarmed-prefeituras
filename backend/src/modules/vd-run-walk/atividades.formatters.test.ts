import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildAtividadeListResult,
  mapAtividadeDetailRow,
  mapAtividadeRow,
  mapAtividadeSummaryRow,
  mapCreateInputToInsertRow,
  mapPatchCheckinInputToUpdateRow,
  normalizeTrailPoints,
  resolveAtividadeListBounds,
  resolveAtividadeListHasMore,
  resolveAtividadeListPagination,
  resolveTrailPointCount,
  resolveWeekStartDateKeyFromCompletedAt,
  aggregateWeeklyProgressFromActivities,
} from './atividades.formatters.js'
import type { RunWalkAtividadeRow } from './types.js'

const sampleInput = {
  clientActivityId: 'client-activity-12345678',
  modality: 'walk' as const,
  activityName: 'Caminhada leve',
  elapsedSeconds: 1800,
  distanceKm: 2.5,
  averageSpeedKmh: 5,
  paceMinPerKm: 12,
  stepCount: 3200,
  heartRateBpm: 118,
  estimatedCalories: 180,
  activeMinutes: 30,
  completedAt: '2026-07-08T10:30:00.000-03:00',
  trail: [
    { latitude: -23.55, longitude: -46.63, recordedAt: 1_720_431_000_000 },
    { latitude: -23.551, longitude: -46.631, recordedAt: 1_720_431_030_000 },
  ],
  trailPointCount: 120,
  locationCity: 'São Paulo',
  locationState: 'SP',
  checkInSkipped: true,
}

const sampleRow: RunWalkAtividadeRow = {
  id: '11111111-1111-1111-1111-111111111111',
  paciente_id: 'pac-1',
  entidade_contratante_id: 'ent-1',
  client_activity_id: sampleInput.clientActivityId,
  modality: 'walk',
  activity_name: 'Caminhada leve',
  elapsed_seconds: 1800,
  distance_km: 2.5,
  average_speed_kmh: 5,
  pace_min_per_km: 12,
  step_count: 3200,
  heart_rate_bpm: 118,
  estimated_calories: 180,
  active_minutes: 30,
  completed_at: sampleInput.completedAt,
  trail_simplified: sampleInput.trail,
  trail_point_count: 120,
  location_city: 'São Paulo',
  location_state: 'SP',
  check_in: null,
  check_in_skipped: true,
  deleted_at: null,
  criado_em: '2026-07-08T10:31:00.000-03:00',
  atualizado_em: '2026-07-08T10:31:00.000-03:00',
}

describe('atividades.formatters', () => {
  it('normaliza trail simplificado', () => {
    assert.deepEqual(normalizeTrailPoints(sampleInput.trail), sampleInput.trail)
    assert.equal(resolveTrailPointCount(sampleInput.trail, 120), 120)
    assert.equal(resolveTrailPointCount(sampleInput.trail), 2)
  })

  it('mapeia input de criação para row de insert', () => {
    const row = mapCreateInputToInsertRow(
      { pacienteId: 'pac-1', entidadeContratanteId: 'ent-1' },
      sampleInput,
    )

    assert.equal(row.client_activity_id, sampleInput.clientActivityId)
    assert.equal(row.modality, 'walk')
    assert.equal(row.trail_point_count, 120)
    assert.deepEqual(row.trail_simplified, sampleInput.trail)
    assert.equal(row.check_in_skipped, true)
  })

  it('mapeia patch de check-in respondido', () => {
    const row = mapPatchCheckinInputToUpdateRow({
      checkIn: {
        intensity: 'adequate',
        wellbeing: 'well',
        discomfort: 'none',
        note: null,
        answeredAt: '2026-07-08T10:35:00.000-03:00',
      },
    })

    assert.equal(row.check_in_skipped, false)
    assert.deepEqual(row.check_in, {
      intensity: 'adequate',
      wellbeing: 'well',
      discomfort: 'none',
      note: null,
      answeredAt: '2026-07-08T10:35:00.000-03:00',
    })
  })

  it('mapeia patch de check-in ignorado', () => {
    const row = mapPatchCheckinInputToUpdateRow({ checkInSkipped: true })
    assert.equal(row.check_in, null)
    assert.equal(row.check_in_skipped, true)
  })

  it('mapeia row do banco para DTO da API', () => {
    const dto = mapAtividadeRow(sampleRow)

    assert.equal(dto.id, sampleRow.id)
    assert.equal(dto.clientActivityId, sampleInput.clientActivityId)
    assert.equal(dto.distanceKm, 2.5)
    assert.equal(dto.trailPointCount, 120)
    assert.deepEqual(dto.trail, sampleInput.trail)
    assert.equal(dto.checkInSkipped, true)
  })

  it('mapeia row para resumo sem trail', () => {
    const summary = mapAtividadeSummaryRow(sampleRow)
    assert.equal('trail' in summary, false)
    assert.equal(summary.trailPointCount, 120)
    assert.equal(summary.activityName, 'Caminhada leve')
  })

  it('mapeia row para detalhe com trailSimplified', () => {
    const detail = mapAtividadeDetailRow(sampleRow)
    assert.equal('trail' in detail, false)
    assert.deepEqual(detail.trailSimplified, sampleInput.trail)
    assert.equal(detail.distanceKm, 2.5)
    assert.equal(detail.elapsedSeconds, 1800)
  })

  it('resolve bounds de período 7d no fuso do app', () => {
    const bounds = resolveAtividadeListBounds(
      { period: '7d' },
      new Date('2026-07-08T15:00:00.000-03:00'),
    )

    assert.equal(bounds.startIso, '2026-07-02T00:00:00.000-03:00')
    assert.equal(bounds.endIso, '2026-07-08T23:59:59.999-03:00')
  })

  it('resolve bounds customizados com startIso e endIso', () => {
    const bounds = resolveAtividadeListBounds({
      period: '30d',
      startIso: '2026-07-01T00:00:00.000-03:00',
      endIso: '2026-07-08T23:59:59.999-03:00',
    })

    assert.equal(bounds.startIso, '2026-07-01T03:00:00.000Z')
    assert.equal(bounds.endIso, '2026-07-09T02:59:59.999Z')
  })

  it('calcula paginação e hasMore', () => {
    const pagination = resolveAtividadeListPagination({ page: 2, pageSize: 20 })
    assert.equal(pagination.offset, 20)

    const result = buildAtividadeListResult([sampleRow], 45, 2, 20)
    assert.equal(result.totalCount, 45)
    assert.equal(result.hasMore, true)
    assert.equal(resolveAtividadeListHasMore(45, 2, 20), true)
    assert.equal(resolveAtividadeListHasMore(20, 1, 20), false)
  })

  it('agrega progresso semanal e resolve segunda-feira da semana', () => {
    assert.equal(
      resolveWeekStartDateKeyFromCompletedAt('2026-07-08T10:30:00.000-03:00'),
      '2026-07-06',
    )

    const aggregate = aggregateWeeklyProgressFromActivities([
      { active_minutes: 30, completed_at: '2026-07-08T10:30:00.000-03:00' },
      { active_minutes: 20, completed_at: '2026-07-08T18:00:00.000-03:00' },
      { active_minutes: 40, completed_at: '2026-07-09T09:00:00.000-03:00' },
    ])

    assert.equal(aggregate.completedActivities, 3)
    assert.equal(aggregate.activeMinutes, 90)
    assert.equal(aggregate.movementDays, 2)
  })
})
