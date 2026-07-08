import { supabaseAdmin } from '../../db/supabase.js'
import { formatDateKeyInAppTz } from '../vd-metricas/peso.formatters.js'
import {
  listFrequenciaCardiacaLeituras,
  fetchUltimoFrequenciaCardiacaLeitura,
} from '../vd-metricas/frequencia-cardiaca.repository.js'
import { listHidratacaoLeiturasForDate } from '../vd-metricas/hidratacao.repository.js'
import type { VdRunWalkPacienteScope } from './types.js'

const DISPOSICAO_CHECKIN_SELECT =
  'id, paciente_id, entidade_contratante_id, checkin_date, mood, slept_well, has_pain, low_energy, prefer_lighter, prefer_walk_over_run, recommendation, criado_em, atualizado_em'

export type RunWalkDisposicaoCheckinRow = {
  id: string
  paciente_id: string
  entidade_contratante_id: string
  checkin_date: string
  mood: 'great' | 'good' | 'tired' | 'very-tired' | 'discomfort'
  slept_well: boolean | null
  has_pain: boolean | null
  low_energy: boolean | null
  prefer_lighter: boolean | null
  prefer_walk_over_run: boolean | null
  recommendation: string | null
  criado_em: string
  atualizado_em: string
}

export type DispositionRecentActivityRow = {
  active_minutes: number
  completed_at: string
  modality: string
}

export type DispositionMetricasSnapshot = {
  hidratacaoMlHoje: number | null
  frequenciaBpm: number | null
  frequenciaBpmAvg7d: number | null
}

export async function findDisposicaoCheckinByDate(
  scope: VdRunWalkPacienteScope,
  checkinDate: string,
): Promise<RunWalkDisposicaoCheckinRow | null> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_disposicao_checkins')
    .select(DISPOSICAO_CHECKIN_SELECT)
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .eq('checkin_date', checkinDate)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return data as RunWalkDisposicaoCheckinRow
}

export async function listRecentAtividadesForDisposicao(
  scope: VdRunWalkPacienteScope,
  bounds: { startIso: string; endIso: string },
): Promise<DispositionRecentActivityRow[]> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_atividades')
    .select('active_minutes, completed_at, modality')
    .eq('paciente_id', scope.pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .is('deleted_at', null)
    .gte('completed_at', bounds.startIso)
    .lte('completed_at', bounds.endIso)
    .order('completed_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    active_minutes: Number((row as DispositionRecentActivityRow).active_minutes),
    completed_at: String((row as DispositionRecentActivityRow).completed_at),
    modality: String((row as DispositionRecentActivityRow).modality),
  }))
}

function shiftDateKey(dateKey: string, days: number): string {
  const instant = new Date(`${dateKey}T12:00:00.000-03:00`)
  instant.setUTCDate(instant.getUTCDate() + days)
  return formatDateKeyInAppTz(instant.toISOString())
}

export async function loadDispositionMetricasSnapshot(
  pacienteId: string,
  todayDateKey: string,
): Promise<DispositionMetricasSnapshot> {
  const hidratacaoRows = await listHidratacaoLeiturasForDate(pacienteId, todayDateKey)
  const hidratacaoMlHoje = hidratacaoRows.length
    ? hidratacaoRows.reduce((sum, row) => sum + Math.round(Number(row.valor)), 0)
    : null

  const ultimaFc = await fetchUltimoFrequenciaCardiacaLeitura(pacienteId)
  const frequenciaBpm = ultimaFc ? Math.round(Number(ultimaFc.valor)) : null

  const startKey = shiftDateKey(todayDateKey, -6)
  const fcRows = await listFrequenciaCardiacaLeituras(pacienteId, {
    startIso: `${startKey}T00:00:00.000-03:00`,
    endIso: `${todayDateKey}T23:59:59.999-03:00`,
  })

  const frequenciaBpmAvg7d =
    fcRows.length > 0
      ? Math.round(fcRows.reduce((sum, row) => sum + Number(row.valor), 0) / fcRows.length)
      : null

  return {
    hidratacaoMlHoje,
    frequenciaBpm,
    frequenciaBpmAvg7d,
  }
}

export type UpsertDisposicaoCheckinInput = {
  mood: RunWalkDisposicaoCheckinRow['mood']
  sleptWell?: boolean
  hasPain?: boolean
  lowEnergy?: boolean
  preferLighter?: boolean
  preferWalkOverRun?: boolean
  recommendation: string
}

export async function upsertDisposicaoCheckin(
  scope: VdRunWalkPacienteScope,
  checkinDate: string,
  input: UpsertDisposicaoCheckinInput,
): Promise<RunWalkDisposicaoCheckinRow> {
  const { data, error } = await supabaseAdmin
    .from('run_walk_disposicao_checkins')
    .upsert(
      {
        paciente_id: scope.pacienteId,
        entidade_contratante_id: scope.entidadeContratanteId,
        checkin_date: checkinDate,
        mood: input.mood,
        slept_well: input.sleptWell ?? null,
        has_pain: input.hasPain ?? null,
        low_energy: input.lowEnergy ?? null,
        prefer_lighter: input.preferLighter ?? null,
        prefer_walk_over_run: input.preferWalkOverRun ?? null,
        recommendation: input.recommendation,
      },
      { onConflict: 'paciente_id,checkin_date' },
    )
    .select(DISPOSICAO_CHECKIN_SELECT)
    .single()

  if (error) throw error

  return data as RunWalkDisposicaoCheckinRow
}
