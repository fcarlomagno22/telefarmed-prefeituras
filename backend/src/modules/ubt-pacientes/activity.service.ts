import { inactivatePaciente } from '../admin-pacientes/pacientes.service.js'
import { mapConsultaRow } from '../admin-pacientes/formatters.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { UbtPacientesError } from './errors.js'
import { assertPacienteBelongsToEntity } from './ownership.js'
import type {
  UbtPacienteAnnotationDto,
  UbtPacienteConsultationDto,
  UbtPacienteContactLogDto,
  UbtScope,
} from './types.js'

export async function listUbtPacienteConsultas(
  scope: UbtScope,
  pacienteId: string,
): Promise<UbtPacienteConsultationDto[]> {
  await assertPacienteBelongsToEntity(scope.entidadeContratanteId, pacienteId)

  const { data, error } = await supabaseAdmin
    .from('vw_consultas_operacional')
    .select(
      'id, codigo_atendimento, status, criado_em, finalizada_em, especialidade_nome, profissional_nome, unidade_nome',
    )
    .eq('paciente_id', pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .order('criado_em', { ascending: false })
    .limit(50)

  if (error) {
    if (error.code === 'PGRST205') return []
    throw error
  }

  return (data ?? []).map((row) => mapConsultaRow(row))
}

export async function listUbtPacienteAnotacoes(
  scope: UbtScope,
  pacienteId: string,
): Promise<UbtPacienteAnnotationDto[]> {
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
    authorLabel: String(row.autor_nome || 'Operador UBT'),
  }))
}

export async function createUbtPacienteAnotacao(
  scope: UbtScope,
  pacienteId: string,
  text: string,
): Promise<UbtPacienteAnnotationDto> {
  await assertPacienteBelongsToEntity(scope.entidadeContratanteId, pacienteId)

  const { data, error } = await supabaseAdmin
    .from('paciente_anotacoes')
    .insert({
      paciente_id: pacienteId,
      entidade_contratante_id: scope.entidadeContratanteId,
      unidade_ubt_id: scope.unidadeUbtId,
      texto: text.trim(),
      autor_usuario_ubt_id: scope.operadorId,
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

export async function listUbtPacienteContatosRegistrados(
  scope: UbtScope,
  pacienteId: string,
): Promise<UbtPacienteContactLogDto[]> {
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
    channel: row.canal as UbtPacienteContactLogDto['channel'],
    phone: String(row.telefone ?? ''),
    note: String(row.nota ?? ''),
    authorLabel: String(row.autor_nome || 'Operador UBT'),
  }))
}

export async function createUbtPacienteRegistroContato(
  scope: UbtScope,
  pacienteId: string,
  body: {
    channel: UbtPacienteContactLogDto['channel']
    phone?: string
    note: string
  },
): Promise<UbtPacienteContactLogDto> {
  await assertPacienteBelongsToEntity(scope.entidadeContratanteId, pacienteId)

  const { data, error } = await supabaseAdmin
    .from('paciente_registros_contato')
    .insert({
      paciente_id: pacienteId,
      entidade_contratante_id: scope.entidadeContratanteId,
      unidade_ubt_id: scope.unidadeUbtId,
      canal: body.channel,
      telefone: body.phone?.trim() ?? '',
      nota: body.note.trim(),
      autor_usuario_ubt_id: scope.operadorId,
      autor_nome: scope.operadorNome,
    })
    .select('id, canal, telefone, nota, autor_nome, criado_em')
    .single()

  if (error) throw error

  return {
    id: String(data.id),
    at: String(data.criado_em),
    channel: data.canal as UbtPacienteContactLogDto['channel'],
    phone: String(data.telefone ?? ''),
    note: String(data.nota ?? ''),
    authorLabel: String(data.autor_nome || scope.operadorNome),
  }
}

export async function inactivateUbtPaciente(
  scope: UbtScope,
  pacienteId: string,
): Promise<void> {
  await assertPacienteBelongsToEntity(scope.entidadeContratanteId, pacienteId)

  const { data, error } = await supabaseAdmin
    .from('pacientes')
    .select('status')
    .eq('id', pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new UbtPacientesError('Paciente não encontrado.', 'NOT_FOUND', 404)
  }
  if (data.status === 'inativo') {
    throw new UbtPacientesError('Paciente já está inativo.', 'CONFLICT', 409)
  }

  await inactivatePaciente(pacienteId)
}
