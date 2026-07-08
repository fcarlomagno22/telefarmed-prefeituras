import { supabaseAdmin } from '../../db/supabase.js'
import { loadMetricasPerfilRow } from './perfil.repository.js'
import type { PacienteMetricasLeituraRow, VdMetricasPacienteScope } from './types.js'

const PESO_LEITURA_SELECT =
  'id, paciente_id, entidade_contratante_id, tipo, registrado_em, origem, valor, valor_secundario, contexto_glicemia, medida_corporal, metadados, criado_em'

function mapLeituraRow(row: PacienteMetricasLeituraRow): PacienteMetricasLeituraRow {
  return {
    ...row,
    valor: Number(row.valor),
    valor_secundario: row.valor_secundario == null ? null : Number(row.valor_secundario),
  }
}

export async function listPesoLeituras(
  pacienteId: string,
  bounds: { startIso: string; endIso: string },
): Promise<PacienteMetricasLeituraRow[]> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .select(PESO_LEITURA_SELECT)
    .eq('paciente_id', pacienteId)
    .eq('tipo', 'peso')
    .gte('registrado_em', bounds.startIso)
    .lte('registrado_em', bounds.endIso)
    .order('registrado_em', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => mapLeituraRow(row as PacienteMetricasLeituraRow))
}

export async function insertPesoLeitura(
  scope: VdMetricasPacienteScope,
  input: { weightKg: number; recordedAtIso: string },
): Promise<PacienteMetricasLeituraRow> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .insert({
      paciente_id: scope.pacienteId,
      entidade_contratante_id: scope.entidadeContratanteId,
      tipo: 'peso',
      valor: input.weightKg,
      registrado_em: input.recordedAtIso,
      origem: 'manual',
    })
    .select(PESO_LEITURA_SELECT)
    .single()

  if (error) throw error

  return mapLeituraRow(data as PacienteMetricasLeituraRow)
}

export async function syncPerfilPesoKg(
  scope: VdMetricasPacienteScope,
  weightKg: number,
): Promise<void> {
  const existing = await loadMetricasPerfilRow(scope.pacienteId)

  const { error } = await supabaseAdmin.from('paciente_metricas_perfil').upsert(
    {
      paciente_id: scope.pacienteId,
      entidade_contratante_id: scope.entidadeContratanteId,
      altura_metros: existing?.altura_metros ?? null,
      peso_kg: weightKg,
    },
    { onConflict: 'paciente_id' },
  )

  if (error) throw error
}

export async function fetchUltimoPesoLeitura(
  pacienteId: string,
): Promise<PacienteMetricasLeituraRow | null> {
  const { data, error } = await supabaseAdmin
    .from('paciente_metricas_leituras')
    .select(PESO_LEITURA_SELECT)
    .eq('paciente_id', pacienteId)
    .eq('tipo', 'peso')
    .order('registrado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapLeituraRow(data as PacienteMetricasLeituraRow)
}

export async function loadLatestPesoKg(pacienteId: string): Promise<number | null> {
  const ultimo = await fetchUltimoPesoLeitura(pacienteId)
  if (ultimo) return formatPesoFromRow(ultimo)

  const perfil = await loadMetricasPerfilRow(pacienteId)
  return perfil?.peso_kg ?? null
}

function formatPesoFromRow(row: PacienteMetricasLeituraRow): number {
  return Number(row.valor)
}
