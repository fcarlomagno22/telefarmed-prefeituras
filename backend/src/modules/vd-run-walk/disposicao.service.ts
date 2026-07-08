import {
  buildDispositionState,
  mapCheckinRowToDto,
  mapRecentActivityRow,
  resolveDispositionRecommendation,
  resolveRecentActivitiesBounds,
  resolveTodayDateKeyInAppTz,
  type CreateDisposicaoCheckinInput,
  type RunWalkDisposicaoCheckinResultDto,
  type RunWalkDisposicaoDto,
} from './disposicao.formatters.js'
import {
  findDisposicaoCheckinByDate,
  listRecentAtividadesForDisposicao,
  loadDispositionMetricasSnapshot,
  upsertDisposicaoCheckin,
  type RunWalkDisposicaoCheckinRow,
} from './disposicao.repository.js'
import type { VdRunWalkPacienteScope } from './types.js'

export type DisposicaoServiceDeps = {
  resolveTodayDateKey: typeof resolveTodayDateKeyInAppTz
  findCheckin: typeof findDisposicaoCheckinByDate
  listRecentActivities: typeof listRecentAtividadesForDisposicao
  loadMetricasSnapshot: typeof loadDispositionMetricasSnapshot
}

export type DisposicaoCheckinServiceDeps = DisposicaoServiceDeps & {
  upsertCheckin: typeof upsertDisposicaoCheckin
}

const defaultDeps: DisposicaoServiceDeps = {
  resolveTodayDateKey: resolveTodayDateKeyInAppTz,
  findCheckin: findDisposicaoCheckinByDate,
  listRecentActivities: listRecentAtividadesForDisposicao,
  loadMetricasSnapshot: loadDispositionMetricasSnapshot,
}

const defaultCheckinDeps: DisposicaoCheckinServiceDeps = {
  ...defaultDeps,
  upsertCheckin: upsertDisposicaoCheckin,
}

function mapCheckinRow(row: RunWalkDisposicaoCheckinRow | null) {
  if (!row) return null

  return {
    mood: row.mood,
    sleptWell: row.slept_well,
    hasPain: row.has_pain,
    lowEnergy: row.low_energy,
  }
}

export async function getRunWalkDisposicao(
  scope: VdRunWalkPacienteScope,
  now = new Date(),
  deps: DisposicaoServiceDeps = defaultDeps,
): Promise<RunWalkDisposicaoDto> {
  const todayDateKey = deps.resolveTodayDateKey(now)
  const bounds = resolveRecentActivitiesBounds(todayDateKey)

  const [checkinRow, recentRows, metricas] = await Promise.all([
    deps.findCheckin(scope, todayDateKey),
    deps.listRecentActivities(scope, bounds),
    deps.loadMetricasSnapshot(scope.pacienteId, todayDateKey),
  ])

  return {
    ...buildDispositionState({
      todayDateKey,
      checkin: mapCheckinRow(checkinRow),
      recentActivities: recentRows.map(mapRecentActivityRow),
      hidratacaoMlHoje: metricas.hidratacaoMlHoje,
      frequenciaBpm: metricas.frequenciaBpm,
      frequenciaBpmAvg7d: metricas.frequenciaBpmAvg7d,
    }),
    checkinCompletedToday: checkinRow !== null,
  }
}

export async function postRunWalkDisposicaoCheckin(
  scope: VdRunWalkPacienteScope,
  input: CreateDisposicaoCheckinInput,
  now = new Date(),
  deps: DisposicaoCheckinServiceDeps = defaultCheckinDeps,
): Promise<RunWalkDisposicaoCheckinResultDto> {
  const todayDateKey = deps.resolveTodayDateKey(now)
  const recommendation = resolveDispositionRecommendation(input)

  const row = await deps.upsertCheckin(scope, todayDateKey, {
    mood: input.mood,
    sleptWell: input.sleptWell,
    hasPain: input.hasPain,
    lowEnergy: input.lowEnergy,
    preferLighter: input.preferLighter,
    preferWalkOverRun: input.preferWalkOverRun,
    recommendation,
  })

  const disposition = await getRunWalkDisposicao(scope, now, deps)

  return {
    checkin: mapCheckinRowToDto(row),
    disposition: {
      ...disposition,
      checkinCompletedToday: true,
    },
  }
}
