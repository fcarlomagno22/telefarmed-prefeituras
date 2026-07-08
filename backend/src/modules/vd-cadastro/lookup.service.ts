import { normalizeCpf } from '../../lib/cpf.js'
import { assertEntityContractActive } from '../../lib/entidadeContrato.js'
import { supabaseAdmin } from '../../db/supabase.js'
import {
  findPacienteByCpf,
  getPacienteDetail,
} from '../admin-pacientes/pacientes.service.js'
import { resolveVdCadastroLookupStatus } from './lookup.mapper.js'
import type { VdCadastroEntidadeScope, VdCadastroLookupResult } from './types.js'

const VD_CONTRACT_INACTIVE_MESSAGE =
  'Esta entidade ainda não possui contrato ativo. O cadastro pelo app não está disponível.'

type PendingPreCadastroRow = {
  id: string
  paciente_id: string | null
}

async function fetchPendingPreCadastro(
  entidadeId: string,
  cpf: string,
): Promise<PendingPreCadastroRow | null> {
  const { data, error } = await supabaseAdmin
    .from('paciente_pre_cadastros')
    .select('id, paciente_id')
    .eq('entidade_contratante_id', entidadeId)
    .eq('cpf', cpf)
    .in('status', ['rascunho', 'pendente'])
    .order('criado_em', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: String(data.id),
    paciente_id: data.paciente_id ? String(data.paciente_id) : null,
  }
}

async function hasPacienteCredencial(
  entidadeId: string,
  cpf: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('paciente_credenciais')
    .select('id')
    .eq('entidade_contratante_id', entidadeId)
    .eq('cpf', cpf)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

export async function lookupVdCadastroCpf(
  scope: VdCadastroEntidadeScope,
  cpfInput: string,
): Promise<VdCadastroLookupResult> {
  await assertEntityContractActive(scope.entidadeId, VD_CONTRACT_INACTIVE_MESSAGE)

  const cpf = normalizeCpf(cpfInput)
  const hasCredencial = await hasPacienteCredencial(scope.entidadeId, cpf)

  const patient = await findPacienteByCpf(cpf, scope.entidadeId)
  const pendingPreCadastro = patient ? null : await fetchPendingPreCadastro(scope.entidadeId, cpf)
  const patientDetail = patient ? await getPacienteDetail(patient.id) : null

  return resolveVdCadastroLookupStatus({
    hasCredencial,
    patient,
    patientDetail,
    pendingPreCadastro,
  })
}
