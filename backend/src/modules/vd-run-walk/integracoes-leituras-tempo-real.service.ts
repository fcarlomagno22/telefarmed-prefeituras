import {
  loadTodayAtividadeTotals,
  sumPassosLeiturasSince,
} from '../vd-metricas/atividade.repository.js'
import { fetchUltimoFrequenciaCardiacaLeitura } from '../vd-metricas/frequencia-cardiaca.repository.js'
import { listIntegracoesRows } from '../vd-metricas/integracoes.repository.js'
import {
  buildRunWalkIntegracoesLeiturasTempoRealDto,
  RUN_WALK_INTEGRACOES_LEITURAS_DEFAULT_MAX_AGE_SECONDS,
  type RunWalkIntegracoesLeiturasTempoRealDto,
} from './integracoes-leituras-tempo-real.formatters.js'
import type { VdRunWalkPacienteScope } from './scope.js'

export type GetRunWalkIntegracoesLeiturasTempoRealQuery = {
  sessionStartedAt?: string
  maxAgeSeconds?: number
}

export async function getRunWalkIntegracoesLeiturasTempoReal(
  scope: VdRunWalkPacienteScope,
  query: GetRunWalkIntegracoesLeiturasTempoRealQuery = {},
): Promise<RunWalkIntegracoesLeiturasTempoRealDto> {
  const fetchedAt = new Date().toISOString()
  const maxAgeSeconds =
    query.maxAgeSeconds ?? RUN_WALK_INTEGRACOES_LEITURAS_DEFAULT_MAX_AGE_SECONDS

  const integrations = await listIntegracoesRows(scope.pacienteId)

  const [heartRateRow, todayTotals, sessionPassos] = await Promise.all([
    fetchUltimoFrequenciaCardiacaLeitura(scope.pacienteId),
    loadTodayAtividadeTotals(scope.pacienteId),
    query.sessionStartedAt
      ? sumPassosLeiturasSince(scope.pacienteId, query.sessionStartedAt)
      : Promise.resolve({ totalSteps: 0, latestRecordedAt: null }),
  ])

  return buildRunWalkIntegracoesLeiturasTempoRealDto({
    integrations,
    heartRateRow,
    todayTotalSteps: todayTotals.passosHoje,
    sessionDeltaSteps: query.sessionStartedAt ? sessionPassos.totalSteps : null,
    latestStepsRecordedAt: sessionPassos.latestRecordedAt,
    sessionStartedAt: query.sessionStartedAt,
    maxAgeSeconds,
    fetchedAt,
  })
}
