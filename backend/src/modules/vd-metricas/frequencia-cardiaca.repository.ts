import { supabaseAdmin } from '../../db/supabase.js'
import type {
  ContextoFrequenciaCardiacaPaciente,
  PacienteMetricasLeituraRow,
  VdMetricasPacienteScope,
} from './types.js'

const FREQUENCIA_LEITURA_SELECT =
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

export async function listFrequenciaCardiacaLeituras(
  pacienteId: string,
  bounds: { startIso: string; endIso: string },
): Promise<PacienteMetricasLeituraRow[]> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .select(FREQUENCIA_LEITURA_SELECT)
    .eq('paciente_id', pacienteId)
    .eq('tipo', 'frequencia_cardiaca')
    .gte('registrado_em', bounds.startIso)
    .lte('registrado_em', bounds.endIso)
    .order('registrado_em', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => mapLeituraRow(row as PacienteMetricasLeituraRow))
}

export async function insertFrequenciaCardiacaLeitura(
  scope: VdMetricasPacienteScope,
  input: {
    bpm: number
    recordedAtIso: string
    origem: 'manual' | 'integracao'
    context: ContextoFrequenciaCardiacaPaciente
    sourceLabel?: string
  },
): Promise<PacienteMetricasLeituraRow> {
  const metadados: Record<string, unknown> = { context: input.context }
  if (input.sourceLabel) {
    metadados.sourceLabel = input.sourceLabel
  }

  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .insert({
      paciente_id: scope.pacienteId,
      entidade_contratante_id: scope.entidadeContratanteId,
      tipo: 'frequencia_cardiaca',
      valor: input.bpm,
      registrado_em: input.recordedAtIso,
      origem: input.origem,
      metadados,
    })
    .select(FREQUENCIA_LEITURA_SELECT)
    .single()

  if (error) throw error

  return mapLeituraRow(data as PacienteMetricasLeituraRow)
}

export async function fetchUltimoFrequenciaCardiacaLeitura(
  pacienteId: string,
): Promise<PacienteMetricasLeituraRow | null> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .select(FREQUENCIA_LEITURA_SELECT)
    .eq('paciente_id', pacienteId)
    .eq('tipo', 'frequencia_cardiaca')
    .order('registrado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapLeituraRow(data as PacienteMetricasLeituraRow)
}

export async function loadLatestFrequenciaBpm(pacienteId: string): Promise<number | null> {
  const ultimo = await fetchUltimoFrequenciaCardiacaLeitura(pacienteId)
  if (!ultimo) return null
  return Math.round(Number(ultimo.valor))
}
