import { supabaseAdmin } from '../../db/supabase.js'
import { readEnderecoField } from '../admin-pacientes/formatters.js'
import type { UbtPacientesFiltrosDto } from './types.js'

export async function loadRecentActivityPatientIds(
  entidadeId: string,
  days = 7,
): Promise<Set<string>> {
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString()
  const ids = new Set<string>()

  const [anotacoesResult, contatosResult] = await Promise.all([
    supabaseAdmin
      .from('paciente_anotacoes')
      .select('paciente_id')
      .eq('entidade_contratante_id', entidadeId)
      .gte('criado_em', cutoff),
    supabaseAdmin
      .from('paciente_registros_contato')
      .select('paciente_id')
      .eq('entidade_contratante_id', entidadeId)
      .gte('criado_em', cutoff),
  ])

  if (anotacoesResult.error && anotacoesResult.error.code !== 'PGRST205') {
    throw anotacoesResult.error
  }
  if (contatosResult.error && contatosResult.error.code !== 'PGRST205') {
    throw contatosResult.error
  }

  for (const row of anotacoesResult.data ?? []) {
    ids.add(String(row.paciente_id))
  }
  for (const row of contatosResult.data ?? []) {
    ids.add(String(row.paciente_id))
  }

  return ids
}

export async function listDistinctRegistrationUnits(entidadeId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('vw_admin_pacientes_listagem')
    .select('unidade_ubt_principal_nome')
    .eq('entidade_contratante_id', entidadeId)
    .neq('status', 'inativo')

  if (error) throw error

  const units = new Set<string>()
  for (const row of data ?? []) {
    const name = String(row.unidade_ubt_principal_nome ?? '').trim()
    if (name && name !== '—') units.add(name)
  }

  return Array.from(units).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export async function getUbtPacientesFiltros(
  entidadeId: string,
  unidadeUbtId: string,
): Promise<UbtPacientesFiltrosDto> {
  const [bairros, registrationUnits] = await Promise.all([
    listDistinctBairrosFromView(entidadeId),
    listDistinctRegistrationUnits(entidadeId),
  ])

  return {
    bairros,
    registrationUnits,
    unidadeUbtId,
  }
}

async function listDistinctBairrosFromView(entidadeId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('vw_admin_pacientes_listagem')
    .select('endereco')
    .eq('entidade_contratante_id', entidadeId)
    .neq('status', 'inativo')

  if (error) throw error

  const bairros = new Set<string>()
  for (const row of data ?? []) {
    const endereco = row.endereco as Record<string, unknown> | null
    const bairro = readEnderecoField(endereco, 'bairro').trim()
    if (bairro) bairros.add(bairro)
  }

  return Array.from(bairros).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
