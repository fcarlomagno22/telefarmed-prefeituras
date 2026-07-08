import { supabaseAdmin } from '../../db/supabase.js'
import type {
  MedidaCorporalPaciente,
  PacienteMetricasLeituraRow,
  VdMetricasPacienteScope,
} from './types.js'

const MEDIDA_CORPORAL_LEITURA_SELECT =
  'id, paciente_id, entidade_contratante_id, tipo, registrado_em, origem, valor, valor_secundario, contexto_glicemia, medida_corporal, metadados, criado_em'

function mapLeituraRow(row: PacienteMetricasLeituraRow): PacienteMetricasLeituraRow {
  return {
    ...row,
    valor: Number(row.valor),
    valor_secundario: row.valor_secundario == null ? null : Number(row.valor_secundario),
  }
}

export async function listMedidasCorporaisLeituras(
  pacienteId: string,
  bounds: { startIso: string; endIso: string },
  tipo?: MedidaCorporalPaciente,
): Promise<PacienteMetricasLeituraRow[]> {
  let query = supabaseAdmin
    .from('paciente_metricas_leituras')
    .select(MEDIDA_CORPORAL_LEITURA_SELECT)
    .eq('paciente_id', pacienteId)
    .eq('tipo', 'medida_corporal')
    .gte('registrado_em', bounds.startIso)
    .lte('registrado_em', bounds.endIso)
    .order('registrado_em', { ascending: true })

  if (tipo) {
    query = query.eq('medida_corporal', tipo)
  }

  const { data, error } = await query

  if (error) throw error

  return (data ?? []).map((row) => mapLeituraRow(row as PacienteMetricasLeituraRow))
}

export async function insertMedidaCorporalLeitura(
  scope: VdMetricasPacienteScope,
  input: {
    measurementId: MedidaCorporalPaciente
    valueCm: number
    recordedAtIso: string
  },
): Promise<PacienteMetricasLeituraRow> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .insert({
      paciente_id: scope.pacienteId,
      entidade_contratante_id: scope.entidadeContratanteId,
      tipo: 'medida_corporal',
      valor: input.valueCm,
      medida_corporal: input.measurementId,
      registrado_em: input.recordedAtIso,
      origem: 'manual',
    })
    .select(MEDIDA_CORPORAL_LEITURA_SELECT)
    .single()

  if (error) throw error

  return mapLeituraRow(data as PacienteMetricasLeituraRow)
}

export async function fetchUltimaMedidaCorporalLeitura(
  pacienteId: string,
  measurementId: MedidaCorporalPaciente,
): Promise<PacienteMetricasLeituraRow | null> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .select(MEDIDA_CORPORAL_LEITURA_SELECT)
    .eq('paciente_id', pacienteId)
    .eq('tipo', 'medida_corporal')
    .eq('medida_corporal', measurementId)
    .order('registrado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapLeituraRow(data as PacienteMetricasLeituraRow)
}

export async function loadLatestMedidaCorporalCm(
  pacienteId: string,
  measurementId: MedidaCorporalPaciente,
): Promise<number | null> {
  const row = await fetchUltimaMedidaCorporalLeitura(pacienteId, measurementId)
  if (!row || !row.medida_corporal) return null
  return Number(row.valor)
}
