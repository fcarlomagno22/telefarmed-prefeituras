import { supabaseAdmin } from '../../db/supabase.js'
import { VdMetricasError } from './errors.js'
import type {
  ContextoGlicemiaPaciente,
  OrigemMetricaPaciente,
  PacienteMetricasLeituraRow,
  VdMetricasPacienteScope,
} from './types.js'

const GLICEMIA_LEITURA_SELECT =
  'id, paciente_id, entidade_contratante_id, tipo, registrado_em, origem, valor, valor_secundario, contexto_glicemia, medida_corporal, metadados, criado_em'

function mapLeituraRow(row: PacienteMetricasLeituraRow): PacienteMetricasLeituraRow {
  return {
    ...row,
    valor: Number(row.valor),
    valor_secundario: row.valor_secundario == null ? null : Number(row.valor_secundario),
  }
}

export async function listGlicemiaLeituras(
  pacienteId: string,
  bounds: { startIso: string; endIso: string },
): Promise<PacienteMetricasLeituraRow[]> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .select(GLICEMIA_LEITURA_SELECT)
    .eq('paciente_id', pacienteId)
    .eq('tipo', 'glicemia')
    .gte('registrado_em', bounds.startIso)
    .lte('registrado_em', bounds.endIso)
    .order('registrado_em', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => mapLeituraRow(row as PacienteMetricasLeituraRow))
}

export async function insertGlicemiaLeitura(
  scope: VdMetricasPacienteScope,
  input: {
    amountMg: number
    context: ContextoGlicemiaPaciente
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
      tipo: 'glicemia',
      valor: input.amountMg,
      registrado_em: input.recordedAtIso,
      origem: input.origem ?? 'manual',
      contexto_glicemia: input.context,
      metadados: input.metadados ?? {},
    })
    .select(GLICEMIA_LEITURA_SELECT)
    .single()

  if (error) throw error

  return mapLeituraRow(data as PacienteMetricasLeituraRow)
}

export async function fetchGlicemiaLeituraById(
  pacienteId: string,
  leituraId: string,
): Promise<PacienteMetricasLeituraRow | null> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .select(GLICEMIA_LEITURA_SELECT)
    .eq('id', leituraId)
    .eq('paciente_id', pacienteId)
    .eq('tipo', 'glicemia')
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapLeituraRow(data as PacienteMetricasLeituraRow)
}

export async function deleteGlicemiaLeitura(
  pacienteId: string,
  leituraId: string,
): Promise<boolean> {
  const existing = await fetchGlicemiaLeituraById(pacienteId, leituraId)
  if (!existing) {
    throw new VdMetricasError('Leitura de glicemia não encontrada.', 'NOT_FOUND', 404)
  }

  const { error, count } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .delete({ count: 'exact' })
    .eq('id', leituraId)
    .eq('paciente_id', pacienteId)
    .eq('tipo', 'glicemia')

  if (error) throw error

  return (count ?? 0) > 0
}

export async function fetchUltimoGlicemiaLeitura(
  pacienteId: string,
): Promise<PacienteMetricasLeituraRow | null> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .select(GLICEMIA_LEITURA_SELECT)
    .eq('paciente_id', pacienteId)
    .eq('tipo', 'glicemia')
    .order('registrado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapLeituraRow(data as PacienteMetricasLeituraRow)
}

export async function loadLatestGlicemiaMgDl(pacienteId: string): Promise<number | null> {
  const ultimo = await fetchUltimoGlicemiaLeitura(pacienteId)
  if (!ultimo) return null
  return Math.round(Number(ultimo.valor))
}
