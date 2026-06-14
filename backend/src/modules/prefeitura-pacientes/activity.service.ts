import { supabaseAdmin } from '../../db/supabase.js'
import { PrefeituraPacientesError } from './errors.js'
import { assertPacienteBelongsToEntity } from './ownership.js'
import type {
  PrefeituraPacienteAnnotationDto,
  PrefeituraPacienteContactLogDto,
  PrefeituraPacientesScope,
} from './types.js'

async function resolvePacientePrincipalUbtId(
  pacienteId: string,
  entidadeId: string,
): Promise<string> {
  const { data: principal, error: principalError } = await supabaseAdmin
    .from('paciente_vinculos_ubt')
    .select('unidade_ubt_id')
    .eq('paciente_id', pacienteId)
    .eq('principal', true)
    .maybeSingle()

  if (principalError) throw principalError
  if (principal?.unidade_ubt_id) return String(principal.unidade_ubt_id)

  const { data: anyLink, error: anyLinkError } = await supabaseAdmin
    .from('paciente_vinculos_ubt')
    .select('unidade_ubt_id')
    .eq('paciente_id', pacienteId)
    .limit(1)
    .maybeSingle()

  if (anyLinkError) throw anyLinkError
  if (anyLink?.unidade_ubt_id) return String(anyLink.unidade_ubt_id)

  const { data: entityUbt, error: entityError } = await supabaseAdmin
    .from('unidades_ubt')
    .select('id')
    .eq('entidade_contratante_id', entidadeId)
    .limit(1)
    .maybeSingle()

  if (entityError) throw entityError
  if (!entityUbt?.id) {
    throw new PrefeituraPacientesError(
      'Nenhuma unidade UBT disponível para registrar a atividade.',
      'INVALID_DATA',
      400,
    )
  }

  return String(entityUbt.id)
}

export async function listPrefeituraPacienteAnotacoes(
  scope: PrefeituraPacientesScope,
  pacienteId: string,
): Promise<PrefeituraPacienteAnnotationDto[]> {
  await assertPacienteBelongsToEntity(scope.entidadeContratanteId, pacienteId)

  const { data, error } = await supabaseAdmin
    .from('paciente_anotacoes')
    .select('id, texto, autor_nome, criado_em')
    .eq('paciente_id', pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .order('criado_em', { ascending: false })
    .limit(100)

  if (error) {
    if (error.code === 'PGRST205') return []
    throw error
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    text: String(row.texto),
    createdAt: String(row.criado_em),
    authorLabel: String(row.autor_nome || 'Operador municipal'),
  }))
}

export async function createPrefeituraPacienteAnotacao(
  scope: PrefeituraPacientesScope,
  pacienteId: string,
  text: string,
): Promise<PrefeituraPacienteAnnotationDto> {
  await assertPacienteBelongsToEntity(scope.entidadeContratanteId, pacienteId)
  const unidadeUbtId = await resolvePacientePrincipalUbtId(pacienteId, scope.entidadeContratanteId)

  const { data, error } = await supabaseAdmin
    .from('paciente_anotacoes')
    .insert({
      paciente_id: pacienteId,
      entidade_contratante_id: scope.entidadeContratanteId,
      unidade_ubt_id: unidadeUbtId,
      texto: text.trim(),
      autor_nome: scope.operadorNome,
    })
    .select('id, texto, autor_nome, criado_em')
    .single()

  if (error) throw error

  return {
    id: String(data.id),
    text: String(data.texto),
    createdAt: String(data.criado_em),
    authorLabel: String(data.autor_nome || scope.operadorNome),
  }
}

export async function listPrefeituraPacienteContatosRegistrados(
  scope: PrefeituraPacientesScope,
  pacienteId: string,
): Promise<PrefeituraPacienteContactLogDto[]> {
  await assertPacienteBelongsToEntity(scope.entidadeContratanteId, pacienteId)

  const { data, error } = await supabaseAdmin
    .from('paciente_registros_contato')
    .select('id, canal, telefone, nota, autor_nome, criado_em')
    .eq('paciente_id', pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .order('criado_em', { ascending: false })
    .limit(100)

  if (error) {
    if (error.code === 'PGRST205') return []
    throw error
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    at: String(row.criado_em),
    channel: row.canal as PrefeituraPacienteContactLogDto['channel'],
    phone: String(row.telefone ?? ''),
    note: String(row.nota ?? ''),
    authorLabel: String(row.autor_nome || 'Operador municipal'),
  }))
}

export async function createPrefeituraPacienteRegistroContato(
  scope: PrefeituraPacientesScope,
  pacienteId: string,
  body: {
    channel: PrefeituraPacienteContactLogDto['channel']
    phone?: string
    note: string
  },
): Promise<PrefeituraPacienteContactLogDto> {
  await assertPacienteBelongsToEntity(scope.entidadeContratanteId, pacienteId)
  const unidadeUbtId = await resolvePacientePrincipalUbtId(pacienteId, scope.entidadeContratanteId)

  const { data, error } = await supabaseAdmin
    .from('paciente_registros_contato')
    .insert({
      paciente_id: pacienteId,
      entidade_contratante_id: scope.entidadeContratanteId,
      unidade_ubt_id: unidadeUbtId,
      canal: body.channel,
      telefone: body.phone?.trim() ?? '',
      nota: body.note.trim(),
      autor_nome: scope.operadorNome,
    })
    .select('id, canal, telefone, nota, autor_nome, criado_em')
    .single()

  if (error) throw error

  return {
    id: String(data.id),
    at: String(data.criado_em),
    channel: data.canal as PrefeituraPacienteContactLogDto['channel'],
    phone: String(data.telefone ?? ''),
    note: String(data.nota ?? ''),
    authorLabel: String(data.autor_nome || scope.operadorNome),
  }
}
