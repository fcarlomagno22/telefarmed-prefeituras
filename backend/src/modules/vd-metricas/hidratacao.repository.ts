import { supabaseAdmin } from '../../db/supabase.js'
import type { PacienteMetricasLeituraRow, VdMetricasPacienteScope } from './types.js'
import { formatDateKeyInAppTz } from './peso.formatters.js'

const HIDRATACAO_LEITURA_SELECT =
  'id, paciente_id, entidade_contratante_id, tipo, registrado_em, origem, valor, valor_secundario, contexto_glicemia, medida_corporal, metadados, criado_em'

function mapLeituraRow(row: PacienteMetricasLeituraRow): PacienteMetricasLeituraRow {
  return {
    ...row,
    valor: Number(row.valor),
    valor_secundario: row.valor_secundario == null ? null : Number(row.valor_secundario),
  }
}

export async function listHidratacaoLeituras(
  pacienteId: string,
  bounds: { startIso: string; endIso: string },
): Promise<PacienteMetricasLeituraRow[]> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .select(HIDRATACAO_LEITURA_SELECT)
    .eq('paciente_id', pacienteId)
    .eq('tipo', 'hidratacao')
    .gte('registrado_em', bounds.startIso)
    .lte('registrado_em', bounds.endIso)
    .order('registrado_em', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => mapLeituraRow(row as PacienteMetricasLeituraRow))
}

export async function insertHidratacaoLeitura(
  scope: VdMetricasPacienteScope,
  input: {
    amountMl: number
    recordedAtIso: string
  },
): Promise<PacienteMetricasLeituraRow> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .insert({
      paciente_id: scope.pacienteId,
      entidade_contratante_id: scope.entidadeContratanteId,
      tipo: 'hidratacao',
      valor: input.amountMl,
      registrado_em: input.recordedAtIso,
      origem: 'manual',
    })
    .select(HIDRATACAO_LEITURA_SELECT)
    .single()

  if (error) throw error

  return mapLeituraRow(data as PacienteMetricasLeituraRow)
}

function resolveDayBoundsFromDateKey(dateKey: string): { startIso: string; endIso: string } {
  return {
    startIso: `${dateKey}T00:00:00.000-03:00`,
    endIso: `${dateKey}T23:59:59.999-03:00`,
  }
}

export async function listHidratacaoLeiturasForDate(
  pacienteId: string,
  dateKey: string,
): Promise<PacienteMetricasLeituraRow[]> {
  const bounds = resolveDayBoundsFromDateKey(dateKey)
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .select(HIDRATACAO_LEITURA_SELECT)
    .eq('paciente_id', pacienteId)
    .eq('tipo', 'hidratacao')
    .gte('registrado_em', bounds.startIso)
    .lte('registrado_em', bounds.endIso)
    .order('registrado_em', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => mapLeituraRow(row as PacienteMetricasLeituraRow))
}

export async function loadTodayHidratacaoMl(pacienteId: string): Promise<number | null> {
  const todayKey = formatDateKeyInAppTz(new Date().toISOString())
  const rows = await listHidratacaoLeiturasForDate(pacienteId, todayKey)
  if (!rows.length) return null

  return rows.reduce((sum, row) => sum + Math.round(Number(row.valor)), 0)
}
