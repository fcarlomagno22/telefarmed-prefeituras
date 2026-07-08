import { supabaseAdmin } from '../../db/supabase.js'
import type {
  OrigemMetricaPaciente,
  PacienteMetricasLeituraRow,
  VdMetricasPacienteScope,
} from './types.js'

const PRESSAO_LEITURA_SELECT =
  'id, paciente_id, entidade_contratante_id, tipo, registrado_em, origem, valor, valor_secundario, contexto_glicemia, medida_corporal, metadados, criado_em'

function mapLeituraRow(row: PacienteMetricasLeituraRow): PacienteMetricasLeituraRow {
  return {
    ...row,
    valor: Number(row.valor),
    valor_secundario: row.valor_secundario == null ? null : Number(row.valor_secundario),
  }
}

export async function listPressaoLeituras(
  pacienteId: string,
  bounds: { startIso: string; endIso: string },
): Promise<PacienteMetricasLeituraRow[]> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .select(PRESSAO_LEITURA_SELECT)
    .eq('paciente_id', pacienteId)
    .eq('tipo', 'pressao')
    .gte('registrado_em', bounds.startIso)
    .lte('registrado_em', bounds.endIso)
    .order('registrado_em', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => mapLeituraRow(row as PacienteMetricasLeituraRow))
}

export async function insertPressaoLeitura(
  scope: VdMetricasPacienteScope,
  input: {
    systolic: number
    diastolic: number
    recordedAtIso: string
    origem?: OrigemMetricaPaciente
    metadados?: Record<string, unknown>
  },
): Promise<PacienteMetricasLeituraRow> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .insert({
      paciente_id: scope.pacienteId,
      entidade_contratante_id: scope.entidadeContratanteId,
      tipo: 'pressao',
      valor: input.systolic,
      valor_secundario: input.diastolic,
      registrado_em: input.recordedAtIso,
      origem: input.origem ?? 'manual',
      metadados: input.metadados ?? {},
    })
    .select(PRESSAO_LEITURA_SELECT)
    .single()

  if (error) throw error

  return mapLeituraRow(data as PacienteMetricasLeituraRow)
}

export async function fetchUltimoPressaoLeitura(
  pacienteId: string,
): Promise<PacienteMetricasLeituraRow | null> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .select(PRESSAO_LEITURA_SELECT)
    .eq('paciente_id', pacienteId)
    .eq('tipo', 'pressao')
    .order('registrado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapLeituraRow(data as PacienteMetricasLeituraRow)
}

export async function loadLatestPressaoMmHg(
  pacienteId: string,
): Promise<{ systolic: number; diastolic: number } | null> {
  const ultimo = await fetchUltimoPressaoLeitura(pacienteId)
  if (!ultimo || ultimo.valor_secundario == null) return null

  return {
    systolic: Math.round(Number(ultimo.valor)),
    diastolic: Math.round(Number(ultimo.valor_secundario)),
  }
}
