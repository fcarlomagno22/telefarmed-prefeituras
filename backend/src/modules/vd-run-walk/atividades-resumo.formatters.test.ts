import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildResumoChartDays,
  buildResumoHeatmap,
  buildResumoTrendPoints,
  buildRunWalkAtividadesResumo,
  computeResumoHighlights,
  computeResumoPeriodSummary,
  filterResumoActivities,
  mapRowToResumoAtividade,
  resolvePreviousMonthBoundsInAppTz,
  resolveResumoFetchBounds,
  type ResumoAtividadeRecord,
} from './atividades-resumo.formatters.js'

const NOW = new Date('2026-07-08T15:00:00.000-03:00')

const fixtures: ResumoAtividadeRecord[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    activityName: 'Caminhada junho',
    modality: 'walk',
    distanceKm: 3,
    activeMinutes: 30,
    estimatedCalories: 150,
    elapsedSeconds: 1800,
    paceMinPerKm: 10,
    completedAt: '2026-06-15T08:00:00.000-03:00',
    dateIso: '2026-06-15',
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    activityName: 'Corrida julho 1',
    modality: 'run',
    distanceKm: 5,
    activeMinutes: 40,
    estimatedCalories: 300,
    elapsedSeconds: 2400,
    paceMinPerKm: 8,
    completedAt: '2026-07-01T07:00:00.000-03:00',
    dateIso: '2026-07-01',
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    activityName: 'Corrida recorde',
    modality: 'run',
    distanceKm: 8,
    activeMinutes: 50,
    estimatedCalories: 450,
    elapsedSeconds: 3000,
    paceMinPerKm: 6.5,
    completedAt: '2026-07-02T07:00:00.000-03:00',
    dateIso: '2026-07-02',
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    activityName: 'Caminhada curta',
    modality: 'walk',
    distanceKm: 1.5,
    activeMinutes: 15,
    estimatedCalories: 80,
    elapsedSeconds: 900,
    paceMinPerKm: 12,
    completedAt: '2026-07-03T18:00:00.000-03:00',
    dateIso: '2026-07-03',
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    activityName: 'Melhor ritmo',
    modality: 'run',
    distanceKm: 6,
    activeMinutes: 35,
    estimatedCalories: 320,
    elapsedSeconds: 2100,
    paceMinPerKm: 5.5,
    completedAt: '2026-07-07T06:00:00.000-03:00',
    dateIso: '2026-07-07',
  },
  {
    id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    activityName: 'Corrida hoje',
    modality: 'run',
    distanceKm: 10,
    activeMinutes: 60,
    estimatedCalories: 550,
    elapsedSeconds: 3600,
    paceMinPerKm: 6,
    completedAt: '2026-07-08T10:00:00.000-03:00',
    dateIso: '2026-07-08',
  },
]

describe('atividades-resumo.formatters', () => {
  it('mapeia row leve do banco para registro de resumo', () => {
    const record = mapRowToResumoAtividade({
      id: fixtures[0]!.id,
      activity_name: 'Caminhada junho',
      modality: 'walk',
      distance_km: 3,
      active_minutes: 30,
      estimated_calories: 150,
      elapsed_seconds: 1800,
      pace_min_per_km: 10,
      completed_at: '2026-06-15T08:00:00.000-03:00',
    })

    assert.equal(record.id, fixtures[0]!.id)
    assert.equal(record.dateIso, '2026-06-15')
    assert.equal(record.distanceKm, 3)
  })

  it('resolve bounds de fetch cobrindo mês anterior, atual e período', () => {
    const bounds = resolveResumoFetchBounds({ period: '7d' }, NOW)

    assert.equal(bounds.fetchAll, false)
    assert.equal(bounds.startIso, '2026-06-01T00:00:00.000-03:00')
    assert.equal(bounds.endIso, '2026-07-08T23:59:59.999-03:00')
  })

  it('resolve fetchAll para período all', () => {
    const bounds = resolveResumoFetchBounds({ period: 'all' }, NOW)

    assert.equal(bounds.fetchAll, true)
    assert.equal(bounds.startIso, null)
    assert.equal(bounds.endIso, null)
  })

  it('calcula periodSummary com deltas vs mês anterior', () => {
    const summary = computeResumoPeriodSummary(fixtures, { period: '7d' }, NOW)

    assert.equal(summary.totalWorkouts, 4)
    assert.equal(summary.totalDistanceKm, 25.5)
    assert.equal(summary.totalActiveMinutes, 160)
    assert.equal(summary.totalCalories, 1400)

    const previousMonth = resolvePreviousMonthBoundsInAppTz(NOW)
    assert.equal(previousMonth.startKey, '2026-06-01')
    assert.equal(previousMonth.endKey, '2026-06-30')

    assert.equal(summary.distanceDeltaPct, 750)
    assert.equal(summary.workoutsDeltaPct, 300)
  })

  it('filtra atividades por distância mínima no período', () => {
    const filtered = filterResumoActivities(
      fixtures,
      { period: '30d', minDistanceKm: 5 },
      NOW,
    )

    assert.equal(filtered.length, 4)
    assert.deepEqual(
      filtered.map((activity) => activity.id),
      [
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
      ],
    )
  })

  it('monta chartDays para últimos 7 dias', () => {
    const chartDays = buildResumoChartDays(fixtures, { period: '7d' }, NOW)

    assert.equal(chartDays.length, 7)
    assert.equal(chartDays[0]?.dateIso, '2026-07-02')
    assert.equal(chartDays[chartDays.length - 1]?.dateIso, '2026-07-08')
    assert.equal(chartDays[chartDays.length - 1]?.isToday, true)

    const jul2 = chartDays.find((day) => day.dateIso === '2026-07-02')
    assert.equal(jul2?.distanceKm, 8)
    assert.equal(jul2?.activeMinutes, 50)
  })

  it('monta trendPoints com as últimas 12 atividades do período', () => {
    const trendPoints = buildResumoTrendPoints(fixtures, { period: '7d' }, NOW)

    assert.equal(trendPoints.length, 4)
    assert.equal(trendPoints[0]?.id, 'cccccccc-cccc-cccc-cccc-cccccccccccc')
    assert.equal(trendPoints[trendPoints.length - 1]?.value, 10)
  })

  it('monta heatmap do mês calendário atual com todas as atividades', () => {
    const heatmap = buildResumoHeatmap(fixtures, NOW)

    assert.equal(heatmap.length, 31)
    assert.equal(heatmap[0]?.day, 1)
    assert.equal(heatmap[0]?.hasActivity, true)
    assert.equal(heatmap[0]?.activeMinutes, 40)

    const jul3 = heatmap.find((cell) => cell.dateIso === '2026-07-03')
    assert.equal(jul3?.hasActivity, true)
    assert.equal(jul3?.distanceKm, 1.5)

    const junCell = heatmap.find((cell) => cell.dateIso === '2026-06-15')
    assert.equal(junCell, undefined)
  })

  it('calcula highlights de PRs, sequência e semana consistente', () => {
    const highlights = computeResumoHighlights(fixtures, { period: '30d' }, NOW)

    assert.equal(highlights.length, 4)

    const distanceRecord = highlights.find((item) => item.id === 'distance-record')
    assert.equal(distanceRecord?.value, '10,0 km')
    assert.equal(distanceRecord?.activityId, 'ffffffff-ffff-ffff-ffff-ffffffffffff')

    const paceRecord = highlights.find((item) => item.id === 'pace-record')
    assert.equal(paceRecord?.value, '5:30')
    assert.equal(paceRecord?.activityId, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee')

    const streak = highlights.find((item) => item.id === 'streak')
    assert.equal(streak?.value, '3 dias')

    const bestWeek = highlights.find((item) => item.id === 'best-week')
    assert.equal(bestWeek?.value, '3 treinos')
  })

  it('monta payload completo de resumo', () => {
    const resumo = buildRunWalkAtividadesResumo(fixtures, { period: '7d' }, NOW)

    assert.ok(resumo.periodSummary)
    assert.equal(resumo.trendPoints.length, 4)
    assert.equal(resumo.heatmapCells.length, 31)
    assert.equal(resumo.highlights.length, 4)
    assert.equal(resumo.chartDays.length, 7)
  })
})
