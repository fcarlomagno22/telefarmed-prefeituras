import { normalizeCpf } from '../../lib/cpf.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { PacientesError } from './errors.js'
import { preCadastroInputToDados } from './formatters.js'
import { createPaciente, getPacienteDetail } from './pacientes.service.js'
import type { AdminMunicipalPatientDto, PreCadastroRegistrationInput } from './types.js'

type PreCadastroRow = {
  id: string
  cpf: string
  entidade_contratante_id: string
  unidade_ubt_id: string | null
  dados: PreCadastroRegistrationInput
  status: 'rascunho' | 'pendente' | 'concluido' | 'cancelado'
  paciente_id: string | null
}

export async function createPreCadastro(
  adminUserId: string,
  input: PreCadastroRegistrationInput,
): Promise<{ preCadastroId: string; paciente?: AdminMunicipalPatientDto }> {
  const cpf = normalizeCpf(input.cpf)

  const { data, error } = await supabaseAdmin
    .from('paciente_pre_cadastros')
    .insert({
      cpf,
      entidade_contratante_id: input.entidadeContratanteId,
      unidade_ubt_id: input.unidadeUbtId ?? null,
      dados: preCadastroInputToDados(input),
      status: 'pendente',
      admin_usuario_id: adminUserId,
    })
    .select('id')
    .single()

  if (error) throw error

  const preCadastroId = String(data.id)

  if (input.concluirImmediately !== false) {
    const paciente = await concludePreCadastro(preCadastroId)
    return { preCadastroId, paciente }
  }

  return { preCadastroId }
}

export async function concludePreCadastro(preCadastroId: string): Promise<AdminMunicipalPatientDto> {
  const row = await fetchPreCadastro(preCadastroId)

  if (row.status === 'cancelado') {
    throw new PacientesError('Pré-cadastro cancelado.', 'PRE_CADASTRO_INVALID', 409)
  }
  if (row.status === 'concluido' && row.paciente_id) {
    const detail = await getPacienteDetail(row.paciente_id)
    return detail
  }

  const dados = row.dados
  const detail = await createPaciente({
    ...dados,
    entidadeContratanteId: row.entidade_contratante_id,
    unidadeUbtId: row.unidade_ubt_id ?? dados.unidadeUbtId,
    status: 'pre_cadastro',
  })

  const { error } = await supabaseAdmin
    .from('paciente_pre_cadastros')
    .update({
      status: 'concluido',
      paciente_id: detail.id,
    })
    .eq('id', preCadastroId)

  if (error) throw error
  return detail
}

export async function cancelPreCadastro(preCadastroId: string): Promise<void> {
  const row = await fetchPreCadastro(preCadastroId)

  if (row.status === 'concluido') {
    throw new PacientesError('Pré-cadastro já concluído.', 'PRE_CADASTRO_INVALID', 409)
  }

  const { error } = await supabaseAdmin
    .from('paciente_pre_cadastros')
    .update({ status: 'cancelado' })
    .eq('id', preCadastroId)

  if (error) throw error
}

async function fetchPreCadastro(id: string): Promise<PreCadastroRow> {
  const { data, error } = await supabaseAdmin
    .from('paciente_pre_cadastros')
    .select('id, cpf, entidade_contratante_id, unidade_ubt_id, dados, status, paciente_id')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new PacientesError('Pré-cadastro não encontrado.', 'NOT_FOUND', 404)

  return {
    id: String(data.id),
    cpf: String(data.cpf),
    entidade_contratante_id: String(data.entidade_contratante_id),
    unidade_ubt_id: data.unidade_ubt_id ? String(data.unidade_ubt_id) : null,
    dados: (data.dados ?? {}) as PreCadastroRegistrationInput,
    status: data.status as PreCadastroRow['status'],
    paciente_id: data.paciente_id ? String(data.paciente_id) : null,
  }
}

export async function submitPacientePreCadastro(
  adminUserId: string,
  input: PreCadastroRegistrationInput,
): Promise<AdminMunicipalPatientDto> {
  const result = await createPreCadastro(adminUserId, {
    ...input,
    concluirImmediately: true,
  })

  if (!result.paciente) {
    throw new PacientesError('Não foi possível concluir o pré-cadastro.', 'PRE_CADASTRO_INVALID', 500)
  }

  return result.paciente
}
