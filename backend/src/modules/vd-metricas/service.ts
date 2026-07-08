import type { z } from 'zod'
import {
  leituraToGlucoseHistoryEntry,
  mapGlicemiaLeituras,
} from './glicemia.formatters.js'
import {
  deleteGlicemiaLeitura,
  insertGlicemiaLeitura,
  listGlicemiaLeituras,
  loadLatestGlicemiaMgDl,
} from './glicemia.repository.js'
import {
  aggregatePesoLeituras,
  formatDateKeyInAppTz,
  leituraToDataPoint,
  resolvePesoPeriodBounds,
  shouldIncludeHourInPesoSeries,
} from './peso.formatters.js'
import {
  fetchUltimoPesoLeitura,
  insertPesoLeitura,
  listPesoLeituras,
  loadLatestPesoKg,
  syncPerfilPesoKg,
} from './peso.repository.js'
import {
  fetchMetricasPerfil,
  isMetricasProfileComplete,
  loadMetricasPerfilRow,
  persistMetricasPerfil,
} from './perfil.repository.js'
import {
  leituraToBloodPressureHistoryEntry,
  mapPressaoLeituras,
} from './pressao.formatters.js'
import {
  insertPressaoLeitura,
  listPressaoLeituras,
  loadLatestPressaoMmHg,
} from './pressao.repository.js'
import {
  aggregateHidratacaoLeituras,
  buildHydrationDayId,
  formatHidratacaoMl,
} from './hidratacao.formatters.js'
import {
  insertHidratacaoLeitura,
  listHidratacaoLeituras,
  listHidratacaoLeiturasForDate,
  loadTodayHidratacaoMl,
} from './hidratacao.repository.js'
import {
  aggregateMedidasCorporaisLeituras,
  formatMedidaCorporalValueCm,
  leituraToMedidaCorporalPoint,
  pickMedidasCorporaisHistorico,
} from './medidas-corporais.formatters.js'
import {
  insertMedidaCorporalLeitura,
  listMedidasCorporaisLeituras,
  loadLatestMedidaCorporalCm,
} from './medidas-corporais.repository.js'
import {
  leituraToHeartRateHistoryEntry,
  mapFrequenciaCardiacaLeituras,
  formatFrequenciaBpm,
} from './frequencia-cardiaca.formatters.js'
import {
  insertFrequenciaCardiacaLeitura,
  listFrequenciaCardiacaLeituras,
  loadLatestFrequenciaBpm,
} from './frequencia-cardiaca.repository.js'
import {
  aggregateAtividadeLeituras,
  deriveDistanceKmFromSteps,
  resolveCaminhadaMetrics,
} from './atividade.formatters.js'
import {
  insertCaminhadaLeitura,
  insertIntegracaoDayLeitura,
  listAtividadeLeituras,
  listAtividadeLeiturasForDate,
  loadTodayAtividadeTotals,
} from './atividade.repository.js'
import {
  buildMetricasResumoDto,
  buildMetricasResumoLatestDto,
} from './resumo.formatters.js'
import {
  fetchIntegracoesMetricas,
  upsertIntegracaoMetricas,
} from './integracoes.repository.js'
import {
  createMetricasAtividadeLoteBodySchema,
  createMetricasCaminhadaBodySchema,
  createMetricasFrequenciaCardiacaBodySchema,
  createMetricasGlicemiaBodySchema,
  createMetricasHidratacaoBodySchema,
  createMetricasMedidasCorporaisBodySchema,
  createMetricasPesoBodySchema,
  createMetricasPressaoBodySchema,
  metricasAtividadeQuerySchema,
  metricasFrequenciaCardiacaQuerySchema,
  metricasGlicemiaQuerySchema,
  metricasHidratacaoQuerySchema,
  metricasMedidasCorporaisQuerySchema,
  metricasPesoQuerySchema,
  metricasPressaoQuerySchema,
  metricasIntegracaoIdParamsSchema,
  updateMetricasIntegracaoBodySchema,
  updateMetricasPerfilBodySchema,
} from './schemas.js'
import type {
  AtividadeDayRecordDto,
  BloodPressureHistoryEntryDto,
  GlucoseHistoryEntryDto,
  HeartRateHistoryEntryDto,
  HydrationDayRecordDto,
  IntegracoesMetricasListDto,
  MedidasCorporaisHistoricoDto,
  MetricasPerfilDto,
  MetricasResumoDto,
  MetricDataPointDto,
  RegisterAtividadeLoteResultDto,
  RegisterCaminhadaResultDto,
  RegisterFrequenciaCardiacaResultDto,
  RegisterGlicemiaResultDto,
  RegisterHidratacaoResultDto,
  RegisterMedidaCorporalResultDto,
  RegisterPesoResultDto,
  RegisterPressaoResultDto,
  UltimoPesoDto,
  UpdateIntegracaoMetricasResultDto,
  VdMetricasPacienteScope,
} from './types.js'

type UpdateMetricasPerfilInput = z.infer<typeof updateMetricasPerfilBodySchema>
type MetricasPesoQuery = z.infer<typeof metricasPesoQuerySchema>
type MetricasGlicemiaQuery = z.infer<typeof metricasGlicemiaQuerySchema>
type MetricasPressaoQuery = z.infer<typeof metricasPressaoQuerySchema>
type MetricasHidratacaoQuery = z.infer<typeof metricasHidratacaoQuerySchema>
type MetricasMedidasCorporaisQuery = z.infer<typeof metricasMedidasCorporaisQuerySchema>
type MetricasFrequenciaCardiacaQuery = z.infer<typeof metricasFrequenciaCardiacaQuerySchema>
type MetricasAtividadeQuery = z.infer<typeof metricasAtividadeQuerySchema>
type CreateMetricasPesoInput = z.infer<typeof createMetricasPesoBodySchema>
type CreateMetricasGlicemiaInput = z.infer<typeof createMetricasGlicemiaBodySchema>
type CreateMetricasPressaoInput = z.infer<typeof createMetricasPressaoBodySchema>
type CreateMetricasHidratacaoInput = z.infer<typeof createMetricasHidratacaoBodySchema>
type CreateMetricasMedidasCorporaisInput = z.infer<
  typeof createMetricasMedidasCorporaisBodySchema
>
type CreateMetricasFrequenciaCardiacaInput = z.infer<
  typeof createMetricasFrequenciaCardiacaBodySchema
>
type CreateMetricasCaminhadaInput = z.infer<typeof createMetricasCaminhadaBodySchema>
type CreateMetricasAtividadeLoteInput = z.infer<typeof createMetricasAtividadeLoteBodySchema>
type UpdateMetricasIntegracaoInput = z.infer<typeof updateMetricasIntegracaoBodySchema>

export type { MetricasPerfilDto, MetricasResumoDto } from './types.js'

export async function getMetricasPerfil(
  scope: VdMetricasPacienteScope,
): Promise<MetricasPerfilDto> {
  return fetchMetricasPerfil(scope)
}

export async function updateMetricasPerfil(
  scope: VdMetricasPacienteScope,
  input: UpdateMetricasPerfilInput,
): Promise<MetricasPerfilDto> {
  return persistMetricasPerfil(scope, input)
}

export async function getMetricasPesoHistorico(
  scope: VdMetricasPacienteScope,
  query: MetricasPesoQuery,
): Promise<MetricDataPointDto[]> {
  const bounds = resolvePesoPeriodBounds(query)
  const rows = await listPesoLeituras(scope.pacienteId, bounds)
  const includeHour =
    query.start != null &&
    query.end != null &&
    shouldIncludeHourInPesoSeries(query.start, query.end)

  return aggregatePesoLeituras(rows, includeHour)
}

export async function registerMetricasPeso(
  scope: VdMetricasPacienteScope,
  input: CreateMetricasPesoInput,
): Promise<RegisterPesoResultDto> {
  const recordedAt = input.recordedAt ?? new Date().toISOString()
  const row = await insertPesoLeitura(scope, {
    weightKg: input.weightKg,
    recordedAtIso: recordedAt,
  })

  await syncPerfilPesoKg(scope, input.weightKg)

  return {
    point: leituraToDataPoint(row, false),
    recordedAt: row.registrado_em,
  }
}

export async function getMetricasGlicemiaHistorico(
  scope: VdMetricasPacienteScope,
  query: MetricasGlicemiaQuery,
): Promise<GlucoseHistoryEntryDto[]> {
  const bounds = resolvePesoPeriodBounds(query)
  const rows = await listGlicemiaLeituras(scope.pacienteId, bounds)
  return mapGlicemiaLeituras(rows)
}

export async function registerMetricasGlicemia(
  scope: VdMetricasPacienteScope,
  input: CreateMetricasGlicemiaInput,
): Promise<RegisterGlicemiaResultDto> {
  const recordedAt = input.recordedAt ?? new Date().toISOString()
  const row = await insertGlicemiaLeitura(scope, {
    amountMg: input.amountMg,
    context: input.context,
    recordedAtIso: recordedAt,
  })

  return {
    reading: leituraToGlucoseHistoryEntry(row),
  }
}

export async function deleteMetricasGlicemia(
  scope: VdMetricasPacienteScope,
  leituraId: string,
): Promise<{ ok: true }> {
  await deleteGlicemiaLeitura(scope.pacienteId, leituraId)
  return { ok: true }
}

export async function getMetricasPressaoHistorico(
  scope: VdMetricasPacienteScope,
  query: MetricasPressaoQuery,
): Promise<BloodPressureHistoryEntryDto[]> {
  const bounds = resolvePesoPeriodBounds(query)
  const rows = await listPressaoLeituras(scope.pacienteId, bounds)
  return mapPressaoLeituras(rows)
}

export async function registerMetricasPressao(
  scope: VdMetricasPacienteScope,
  input: CreateMetricasPressaoInput,
): Promise<RegisterPressaoResultDto> {
  const recordedAt = input.recordedAt ?? new Date().toISOString()
  const row = await insertPressaoLeitura(scope, {
    systolic: input.systolic,
    diastolic: input.diastolic,
    recordedAtIso: recordedAt,
  })

  return {
    reading: leituraToBloodPressureHistoryEntry(row),
  }
}

export async function getMetricasHidratacaoHistorico(
  scope: VdMetricasPacienteScope,
  query: MetricasHidratacaoQuery,
): Promise<HydrationDayRecordDto[]> {
  const bounds = resolvePesoPeriodBounds(query)
  const rows = await listHidratacaoLeituras(scope.pacienteId, bounds)
  return aggregateHidratacaoLeituras(rows)
}

export async function registerMetricasHidratacao(
  scope: VdMetricasPacienteScope,
  input: CreateMetricasHidratacaoInput,
): Promise<RegisterHidratacaoResultDto> {
  const recordedAt = input.recordedAt ?? new Date().toISOString()
  await insertHidratacaoLeitura(scope, {
    amountMl: input.amountMl,
    recordedAtIso: recordedAt,
  })

  const dateKey = formatDateKeyInAppTz(recordedAt)
  const dayRows = await listHidratacaoLeiturasForDate(scope.pacienteId, dateKey)
  const day = aggregateHidratacaoLeituras(dayRows)[0]

  return {
    day: day ?? {
      id: buildHydrationDayId(dateKey),
      date: dateKey,
      totalMl: formatHidratacaoMl(input.amountMl),
    },
    recordedAt,
  }
}

export async function getMetricasMedidasCorporaisHistorico(
  scope: VdMetricasPacienteScope,
  query: MetricasMedidasCorporaisQuery,
): Promise<MedidasCorporaisHistoricoDto> {
  const bounds = resolvePesoPeriodBounds(query)
  const rows = await listMedidasCorporaisLeituras(scope.pacienteId, bounds, query.tipo)
  const measurements = aggregateMedidasCorporaisLeituras(rows)

  return {
    measurements: pickMedidasCorporaisHistorico(measurements, query.tipo),
  }
}

export async function registerMetricasMedidaCorporal(
  scope: VdMetricasPacienteScope,
  input: CreateMetricasMedidasCorporaisInput,
): Promise<RegisterMedidaCorporalResultDto> {
  const recordedAt = input.recordedAt ?? new Date().toISOString()
  const valueCm = formatMedidaCorporalValueCm(input.measurementId, input.valueCm)
  const row = await insertMedidaCorporalLeitura(scope, {
    measurementId: input.measurementId,
    valueCm,
    recordedAtIso: recordedAt,
  })

  const point = leituraToMedidaCorporalPoint(row)
  if (!point) {
    throw new Error('Falha ao registrar medida corporal.')
  }

  return {
    measurementId: input.measurementId,
    point,
    recordedAt: row.registrado_em,
  }
}

export async function getMetricasFrequenciaCardiacaHistorico(
  scope: VdMetricasPacienteScope,
  query: MetricasFrequenciaCardiacaQuery,
): Promise<HeartRateHistoryEntryDto[]> {
  const bounds = resolvePesoPeriodBounds(query)
  const rows = await listFrequenciaCardiacaLeituras(scope.pacienteId, bounds)
  return mapFrequenciaCardiacaLeituras(rows)
}

export async function registerMetricasFrequenciaCardiaca(
  scope: VdMetricasPacienteScope,
  input: CreateMetricasFrequenciaCardiacaInput,
): Promise<RegisterFrequenciaCardiacaResultDto> {
  const recordedAt = input.recordedAt ?? new Date().toISOString()
  const source = input.source ?? 'manual'
  const context = input.context ?? (source === 'integracao' ? 'resting' : 'manual')
  const row = await insertFrequenciaCardiacaLeitura(scope, {
    bpm: formatFrequenciaBpm(input.bpm),
    recordedAtIso: recordedAt,
    origem: source,
    context,
    sourceLabel: input.sourceLabel,
  })

  return {
    reading: leituraToHeartRateHistoryEntry(row),
  }
}

export async function getMetricasAtividadeHistorico(
  scope: VdMetricasPacienteScope,
  query: MetricasAtividadeQuery,
): Promise<AtividadeDayRecordDto[]> {
  const bounds = resolvePesoPeriodBounds(query)
  const rows = await listAtividadeLeituras(scope.pacienteId, bounds)
  return aggregateAtividadeLeituras(rows)
}

export async function registerMetricasCaminhada(
  scope: VdMetricasPacienteScope,
  input: CreateMetricasCaminhadaInput,
): Promise<RegisterCaminhadaResultDto> {
  const recordedAt = input.recordedAt ?? new Date().toISOString()
  const metrics = resolveCaminhadaMetrics(input)

  await insertCaminhadaLeitura(scope, {
    steps: metrics.steps,
    distanceKm: metrics.distanceKm,
    distanceKmExplicit: metrics.distanceKmExplicit,
    durationMinutes: metrics.durationMinutes,
    recordedAtIso: recordedAt,
  })

  const dateKey = formatDateKeyInAppTz(recordedAt)
  const dayRows = await listAtividadeLeiturasForDate(scope.pacienteId, dateKey)
  const day = aggregateAtividadeLeituras(dayRows)[0]

  return {
    day: day ?? {
      id: `activity-${dateKey}`,
      date: dateKey,
      steps: metrics.steps,
      distanceKm: metrics.distanceKm,
      source: 'manual',
    },
    recordedAt,
  }
}

export async function registerMetricasAtividadeLote(
  scope: VdMetricasPacienteScope,
  input: CreateMetricasAtividadeLoteInput,
): Promise<RegisterAtividadeLoteResultDto> {
  let importedCount = 0

  for (const day of input.days) {
    const distanceKm =
      day.distanceKm != null
        ? day.distanceKm
        : deriveDistanceKmFromSteps(day.steps)

    await insertIntegracaoDayLeitura(scope, {
      dateKey: day.date,
      steps: day.steps,
      distanceKm,
      sourceLabel: day.sourceLabel,
    })
    importedCount += 1
  }

  const dateKeys = input.days.map((day) => day.date).sort()
  const startIso = `${dateKeys[0]}T00:00:00.000-03:00`
  const endIso = `${dateKeys[dateKeys.length - 1]}T23:59:59.999-03:00`
  const rows = await listAtividadeLeituras(scope.pacienteId, { startIso, endIso })
  const days = aggregateAtividadeLeituras(rows)

  return {
    days,
    importedCount,
  }
}

export async function getMetricasIntegracoes(
  scope: VdMetricasPacienteScope,
): Promise<IntegracoesMetricasListDto> {
  return fetchIntegracoesMetricas(scope)
}

export async function updateMetricasIntegracao(
  scope: VdMetricasPacienteScope,
  integrationId: string,
  input: UpdateMetricasIntegracaoInput,
): Promise<UpdateIntegracaoMetricasResultDto> {
  return upsertIntegracaoMetricas(scope, integrationId, input)
}

export async function getUltimoMetricasPeso(
  scope: VdMetricasPacienteScope,
): Promise<UltimoPesoDto> {
  const row = await fetchUltimoPesoLeitura(scope.pacienteId)
  if (!row) {
    return { point: null, recordedAt: null }
  }

  return {
    point: leituraToDataPoint(row, false),
    recordedAt: row.registrado_em,
  }
}

/** Resumo agregado para home e KPI strip do app cidadão. */
export async function getMetricasResumo(
  scope: VdMetricasPacienteScope,
): Promise<MetricasResumoDto> {
  const [
    profile,
    perfilRow,
    pesoKg,
    glicemiaMgDl,
    pressao,
    hidratacaoMlHoje,
    circunferenciaAbdomenCm,
    frequenciaBpm,
    atividadeHoje,
  ] = await Promise.all([
    fetchMetricasPerfil(scope),
    loadMetricasPerfilRow(scope.pacienteId),
    loadLatestPesoKg(scope.pacienteId),
    loadLatestGlicemiaMgDl(scope.pacienteId),
    loadLatestPressaoMmHg(scope.pacienteId),
    loadTodayHidratacaoMl(scope.pacienteId),
    loadLatestMedidaCorporalCm(scope.pacienteId, 'abdomen'),
    loadLatestFrequenciaBpm(scope.pacienteId),
    loadTodayAtividadeTotals(scope.pacienteId),
  ])

  const latest = buildMetricasResumoLatestDto({
    profile,
    pesoKg,
    glicemiaMgDl,
    pressaoSistolica: pressao?.systolic ?? null,
    pressaoDiastolica: pressao?.diastolic ?? null,
    hidratacaoMlHoje,
    circunferenciaAbdomenCm,
    frequenciaBpm,
    passosHoje: atividadeHoje.passosHoje,
    distanciaKmHoje: atividadeHoje.distanciaKmHoje,
  })

  return buildMetricasResumoDto({
    profile,
    profileComplete: isMetricasProfileComplete(perfilRow),
    latest,
  })
}
