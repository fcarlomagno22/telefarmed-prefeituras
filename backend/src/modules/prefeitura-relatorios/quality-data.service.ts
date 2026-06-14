import { supabaseAdmin } from '../../db/supabase.js'
import { periodBounds } from '../prefeitura-consultas/period.js'
import { isMissingRelationError } from './report-shared.js'

export type QualityConsultaRow = {
  id: string
  unidade_ubt_id: string
  profissional_id: string | null
  profissional_nome: string
  especialidade_id: string
  especialidade_nome: string
  status: string
  duracao_minutos: number | null
  iniciada_em: string | null
  finalizada_em: string | null
  criado_em: string
}

export type QualityAvaliacaoRow = {
  id: string
  consulta_id: string
  nota: number
  nota_profissional: number | null
  nota_teleconsulta: number | null
  comentario_profissional: string
  comentario_teleconsulta: string
  avaliado_em: string
  unidade_ubt_id: string
  profissional_id: string | null
  profissional_nome: string
  especialidade_nome: string
}

const QUALITY_CONSULTA_SELECT = `
  id,
  unidade_ubt_id,
  profissional_id,
  profissional_nome,
  especialidade_id,
  especialidade_nome,
  status,
  duracao_minutos,
  iniciada_em,
  finalizada_em,
  criado_em
`

export async function loadQualityConsultasInPeriod(
  entidadeId: string,
  unitIds: string[],
  periodStart: string,
  periodEnd: string,
): Promise<QualityConsultaRow[]> {
  if (unitIds.length === 0) return []

  const { startIso, endIso } = periodBounds(periodStart, periodEnd)
  const { data, error } = await supabaseAdmin
    .from('vw_consultas_operacional')
    .select(QUALITY_CONSULTA_SELECT)
    .eq('entidade_contratante_id', entidadeId)
    .in('unidade_ubt_id', unitIds)
    .gte('criado_em', startIso)
    .lte('criado_em', endIso)

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  return (data ?? []) as QualityConsultaRow[]
}

function resolveNestedNome(raw: unknown): string | null {
  const item = (Array.isArray(raw) ? raw[0] : raw) as { nome?: string } | null
  return item?.nome ? String(item.nome) : null
}

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = 'code' in error ? String((error as { code: unknown }).code) : ''
  const message = 'message' in error ? String((error as { message: unknown }).message) : ''
  return (
    code === '42703' ||
    code === 'PGRST204' ||
    /column .* does not exist/i.test(message) ||
    /Could not find the .* column/i.test(message)
  )
}

const QUALITY_AVALIACAO_SELECT = `
  id,
  consulta_id,
  nota,
  nota_profissional,
  nota_teleconsulta,
  comentario_profissional,
  comentario_teleconsulta,
  avaliado_em,
  consultas!inner (
    unidade_ubt_id,
    profissional_id,
    especialidade_id,
    entidade_contratante_id,
    usuarios_profissionais ( nome ),
    config_especialidades ( nome )
  )
`

const QUALITY_AVALIACAO_SELECT_LEGACY = `
  id,
  consulta_id,
  nota,
  nota_teleconsulta,
  comentario,
  avaliado_em,
  consultas!inner (
    unidade_ubt_id,
    profissional_id,
    especialidade_id,
    entidade_contratante_id,
    usuarios_profissionais ( nome ),
    config_especialidades ( nome )
  )
`

function mapQualityAvaliacaoRow(
  raw: Record<string, unknown>,
  options: { legacyComments: boolean },
): QualityAvaliacaoRow | null {
  const consultaRaw = raw.consultas
  const consulta = (Array.isArray(consultaRaw) ? consultaRaw[0] : consultaRaw) as {
    unidade_ubt_id: string
    profissional_id: string | null
    usuarios_profissionais?: unknown
    config_especialidades?: unknown
  } | null
  if (!consulta) return null

  const comentarioProfissional = options.legacyComments
    ? String(raw.comentario ?? '')
    : String(raw.comentario_profissional ?? '')

  return {
    id: String(raw.id),
    consulta_id: String(raw.consulta_id),
    nota: Number(raw.nota),
    nota_profissional: options.legacyComments
      ? null
      : (raw.nota_profissional as number | null),
    nota_teleconsulta: (raw.nota_teleconsulta as number | null) ?? null,
    comentario_profissional: comentarioProfissional,
    comentario_teleconsulta: options.legacyComments
      ? ''
      : String(raw.comentario_teleconsulta ?? ''),
    avaliado_em: String(raw.avaliado_em),
    unidade_ubt_id: String(consulta.unidade_ubt_id),
    profissional_id: consulta.profissional_id ? String(consulta.profissional_id) : null,
    profissional_nome: resolveNestedNome(consulta.usuarios_profissionais) ?? 'Profissional',
    especialidade_nome: resolveNestedNome(consulta.config_especialidades) ?? 'Especialidade',
  }
}

async function queryQualityAvaliacoesInPeriod(
  entidadeId: string,
  unitIds: string[],
  startIso: string,
  endIso: string,
  select: string,
) {
  return supabaseAdmin
    .from('consulta_avaliacoes')
    .select(select)
    .eq('consultas.entidade_contratante_id', entidadeId)
    .in('consultas.unidade_ubt_id', unitIds)
    .gte('avaliado_em', startIso)
    .lte('avaliado_em', endIso)
}

export async function loadQualityAvaliacoesInPeriod(
  entidadeId: string,
  unitIds: string[],
  periodStart: string,
  periodEnd: string,
): Promise<QualityAvaliacaoRow[]> {
  if (unitIds.length === 0) return []

  const { startIso, endIso } = periodBounds(periodStart, periodEnd)
  let { data, error } = await queryQualityAvaliacoesInPeriod(
    entidadeId,
    unitIds,
    startIso,
    endIso,
    QUALITY_AVALIACAO_SELECT,
  )

  let legacyComments = false
  if (error && isMissingColumnError(error)) {
    const fallback = await queryQualityAvaliacoesInPeriod(
      entidadeId,
      unitIds,
      startIso,
      endIso,
      QUALITY_AVALIACAO_SELECT_LEGACY,
    )
    data = fallback.data
    error = fallback.error
    legacyComments = true
  }

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  const rows: QualityAvaliacaoRow[] = []
  for (const raw of data ?? []) {
    const mapped = mapQualityAvaliacaoRow(raw as unknown as Record<string, unknown>, { legacyComments })
    if (mapped) rows.push(mapped)
  }

  return rows
}

export function resolveConsultaDurationMinutes(row: QualityConsultaRow): number | null {
  if (typeof row.duracao_minutos === 'number' && row.duracao_minutos >= 0) {
    return row.duracao_minutos
  }
  if (row.status !== 'concluida' || !row.iniciada_em || !row.finalizada_em) return null
  const minutes = Math.round(
    (Date.parse(String(row.finalizada_em)) - Date.parse(String(row.iniciada_em))) / 60_000,
  )
  return minutes >= 0 ? minutes : null
}

export function resolveAvaliacaoNota(row: QualityAvaliacaoRow): number {
  const prof = row.nota_profissional
  const tele = row.nota_teleconsulta
  if (typeof prof === 'number' && typeof tele === 'number') {
    return Math.round(((prof + tele) / 2) * 10) / 10
  }
  if (typeof prof === 'number') return prof
  if (typeof tele === 'number') return tele
  return row.nota
}

export function computeNpsFromRatings(ratings: number[]) {
  if (ratings.length === 0) {
    return { nps: 0, promotersPercent: 0, passivesPercent: 0, detractorsPercent: 0 }
  }

  let promoters = 0
  let passives = 0
  let detractors = 0

  for (const rating of ratings) {
    if (rating >= 5) promoters += 1
    else if (rating >= 4) passives += 1
    else detractors += 1
  }

  const total = ratings.length
  const promotersPercent = Math.round((promoters / total) * 1000) / 10
  const passivesPercent = Math.round((passives / total) * 1000) / 10
  const detractorsPercent = Math.round((detractors / total) * 1000) / 10
  const nps = Math.round((promotersPercent - detractorsPercent) * 10) / 10

  return { nps, promotersPercent, passivesPercent, detractorsPercent }
}

export function detectReconnectionSignal(row: QualityConsultaRow): boolean {
  if (String(row.status) !== 'concluida') return false
  const duration = resolveConsultaDurationMinutes(row)
  if (duration == null || !row.iniciada_em || !row.finalizada_em) return false
  const wallMinutes = Math.round(
    (Date.parse(String(row.finalizada_em)) - Date.parse(String(row.iniciada_em))) / 60_000,
  )
  return wallMinutes >= duration + 3
}

export function avgMinutes(values: number[]) {
  if (values.length === 0) return 0
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}

export function medianMinutes(values: number[]) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1]! + sorted[mid]!) / 2) * 10) / 10
  }
  return sorted[mid]!
}

export const QUALITY_THRESHOLDS = {
  minCompletionRatePercent: 92,
  maxAbandonmentRatePercent: 15,
  minAvgRating: 4,
  maxInterruptionRatePercent: 5,
  minNps: 50,
  maxAvgDurationMinutes: 25,
  minAvgDurationMinutes: 5,
} as const
