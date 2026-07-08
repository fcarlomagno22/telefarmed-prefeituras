import { supabaseAdmin } from '../../db/supabase.js'
import { aggregateAtividadeLeituras } from './atividade.formatters.js'
import type { PacienteMetricasLeituraRow, VdMetricasPacienteScope } from './types.js'
import { formatDateKeyInAppTz } from './peso.formatters.js'

const ATIVIDADE_LEITURA_SELECT =
  'id, paciente_id, entidade_contratante_id, tipo, registrado_em, origem, valor, valor_secundario, contexto_glicemia, medida_corporal, metadados, criado_em'

function mapLeituraRow(row: PacienteMetricasLeituraRow): PacienteMetricasLeituraRow {
  return {
    ...row,
    valor: Number(row.valor),
    valor_secundario: row.valor_secundario == null ? null : Number(row.valor_secundario),
    metadados:
      row.metadados && typeof row.metadados === 'object' && !Array.isArray(row.metadados)
        ? row.metadados
        : {},
  }
}

export async function listAtividadeLeituras(
  pacienteId: string,
  bounds: { startIso: string; endIso: string },
): Promise<PacienteMetricasLeituraRow[]> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .select(ATIVIDADE_LEITURA_SELECT)
    .eq('paciente_id', pacienteId)
    .in('tipo', ['passos', 'distancia'])
    .gte('registrado_em', bounds.startIso)
    .lte('registrado_em', bounds.endIso)
    .order('registrado_em', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => mapLeituraRow(row as PacienteMetricasLeituraRow))
}

function resolveDayBoundsFromDateKey(dateKey: string): { startIso: string; endIso: string } {
  return {
    startIso: `${dateKey}T00:00:00.000-03:00`,
    endIso: `${dateKey}T23:59:59.999-03:00`,
  }
}

export async function listAtividadeLeiturasForDate(
  pacienteId: string,
  dateKey: string,
): Promise<PacienteMetricasLeituraRow[]> {
  const bounds = resolveDayBoundsFromDateKey(dateKey)
  return listAtividadeLeituras(pacienteId, bounds)
}

export async function insertManualAtividadeLeitura(
  scope: VdMetricasPacienteScope,
  input: {
    kind: RunWalkAtividadeLeituraKind
    steps: number
    distanceKm: number
    distanceKmExplicit: boolean
    durationMinutes?: number
    recordedAtIso: string
  },
): Promise<PacienteMetricasLeituraRow> {
  const metadados: Record<string, unknown> = {
    kind: input.kind,
    distanceKm: input.distanceKm,
    distanceKmExplicit: input.distanceKmExplicit,
  }

  if (input.durationMinutes != null) {
    metadados.durationMinutes = input.durationMinutes
  }

  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .insert({
      paciente_id: scope.pacienteId,
      entidade_contratante_id: scope.entidadeContratanteId,
      tipo: 'passos',
      valor: input.steps,
      registrado_em: input.recordedAtIso,
      origem: 'manual',
      metadados,
    })
    .select(ATIVIDADE_LEITURA_SELECT)
    .single()

  if (error) throw error

  return mapLeituraRow(data as PacienteMetricasLeituraRow)
}

export async function insertCaminhadaLeitura(
  scope: VdMetricasPacienteScope,
  input: {
    steps: number
    distanceKm: number
    distanceKmExplicit: boolean
    durationMinutes?: number
    recordedAtIso: string
  },
): Promise<PacienteMetricasLeituraRow> {
  return insertManualAtividadeLeitura(scope, {
    ...input,
    kind: 'caminhada',
  })
}

export type RunWalkAtividadeLeituraKind = 'caminhada' | 'corrida' | 'corrida-caminhada'

export async function insertRunWalkAtividadeLeitura(
  scope: VdMetricasPacienteScope,
  input: {
    steps: number
    distanceKm: number
    durationMinutes: number
    estimatedCalories: number
    recordedAtIso: string
    runWalkActivityId: string
    kind: RunWalkAtividadeLeituraKind
  },
): Promise<PacienteMetricasLeituraRow> {
  const metadados: Record<string, unknown> = {
    kind: input.kind,
    distanceKm: input.distanceKm,
    distanceKmExplicit: true,
    durationMinutes: input.durationMinutes,
    estimatedCalories: input.estimatedCalories,
    runWalkActivityId: input.runWalkActivityId,
  }

  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .insert({
      paciente_id: scope.pacienteId,
      entidade_contratante_id: scope.entidadeContratanteId,
      tipo: 'passos',
      valor: input.steps,
      registrado_em: input.recordedAtIso,
      origem: 'sistema',
      metadados,
    })
    .select(ATIVIDADE_LEITURA_SELECT)
    .single()

  if (error) throw error

  return mapLeituraRow(data as PacienteMetricasLeituraRow)
}

export async function insertIntegracaoDayLeitura(
  scope: VdMetricasPacienteScope,
  input: {
    dateKey: string
    steps: number
    distanceKm: number
    sourceLabel?: string
  },
): Promise<PacienteMetricasLeituraRow> {
  const metadados: Record<string, unknown> = {
    kind: 'integracao',
    distanceKm: input.distanceKm,
    distanceKmExplicit: true,
  }

  if (input.sourceLabel) {
    metadados.sourceLabel = input.sourceLabel
  }

  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .insert({
      paciente_id: scope.pacienteId,
      entidade_contratante_id: scope.entidadeContratanteId,
      tipo: 'passos',
      valor: input.steps,
      registrado_em: `${input.dateKey}T12:00:00.000-03:00`,
      origem: 'integracao',
      metadados,
    })
    .select(ATIVIDADE_LEITURA_SELECT)
    .single()

  if (error) throw error

  return mapLeituraRow(data as PacienteMetricasLeituraRow)
}

export async function loadTodayAtividadeTotals(
  pacienteId: string,
): Promise<{ passosHoje: number | null; distanciaKmHoje: number | null }> {
  const todayKey = formatDateKeyInAppTz(new Date().toISOString())
  const rows = await listAtividadeLeiturasForDate(pacienteId, todayKey)
  if (!rows.length) {
    return { passosHoje: null, distanciaKmHoje: null }
  }

  const [day] = aggregateAtividadeLeituras(rows)
  if (!day) {
    return { passosHoje: null, distanciaKmHoje: null }
  }

  return {
    passosHoje: day.steps,
    distanciaKmHoje: day.distanciaKm,
  }
}

export async function sumPassosLeiturasSince(
  pacienteId: string,
  sinceIso: string,
): Promise<{ totalSteps: number; latestRecordedAt: string | null }> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .select('valor, registrado_em')
    .eq('paciente_id', pacienteId)
    .eq('tipo', 'passos')
    .gte('registrado_em', sinceIso)
    .order('registrado_em', { ascending: true })

  if (error) throw error

  let totalSteps = 0
  let latestRecordedAt: string | null = null

  for (const row of data ?? []) {
    totalSteps += Math.max(0, Math.round(Number(row.valor)))
    latestRecordedAt = String(row.registrado_em)
  }

  return { totalSteps, latestRecordedAt }
}
