import { normalizeCpf } from '../../lib/cpf.js'
import { supabaseAdmin } from '../../db/supabase.js'
import {
  createPaciente,
  findPacienteByCpf,
  getEntityPatientTerritoryPolicy,
  getPacienteDetail,
  updatePaciente,
} from '../admin-pacientes/pacientes.service.js'
import { mapListagemToPatient, type ListagemRow } from '../admin-pacientes/formatters.js'
import { UbtPacientesError } from './errors.js'
import {
  isPatientIncompleteForFirstVisit,
  mapAdminPatientToUbtPatient,
  mapDetailToRegistrationPayload,
  preCadastroDadosToRegistrationPayload,
} from './formatters.js'
import { assertPacienteBelongsToEntity } from './ownership.js'
import type {
  UbtPacienteDto,
  UbtPatientLookupQuery,
  UbtPatientLookupResult,
  UbtPatientRegistrationPayload,
  UbtScope,
} from './types.js'
import { loadConsultationStats } from './list.service.js'

type UbtAuthScope = Pick<UbtScope, 'entidadeContratanteId' | 'unidadeUbtId'>

type PreCadastroRow = {
  id: string
  cpf: string
  dados: Record<string, unknown>
  status: string
  paciente_id: string | null
}

async function assertEntityContractActive(entidadeId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('contratos_entidade')
    .select('id')
    .eq('entidade_contratante_id', entidadeId)
    .eq('status', 'ativo')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new UbtPacientesError(
      'Esta entidade ainda não possui contrato ativo. Cadastre o contrato no Admin → Clientes antes de recepcionar pacientes.',
      'CONTRACT_INACTIVE',
      403,
    )
  }
}

async function isLinkedToUnit(pacienteId: string, unidadeUbtId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('paciente_vinculos_ubt')
    .select('id')
    .eq('paciente_id', pacienteId)
    .eq('unidade_ubt_id', unidadeUbtId)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

async function fetchPendingPreCadastro(
  entidadeId: string,
  cpf: string,
): Promise<PreCadastroRow | null> {
  const { data, error } = await supabaseAdmin
    .from('paciente_pre_cadastros')
    .select('id, cpf, dados, status, paciente_id')
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
    cpf: String(data.cpf),
    dados: (data.dados ?? {}) as Record<string, unknown>,
    status: String(data.status),
    paciente_id: data.paciente_id ? String(data.paciente_id) : null,
  }
}

async function concludePreCadastrosForPatient(
  entidadeId: string,
  cpf: string,
  pacienteId: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('paciente_pre_cadastros')
    .update({
      status: 'concluido',
      paciente_id: pacienteId,
    })
    .eq('entidade_contratante_id', entidadeId)
    .eq('cpf', cpf)
    .in('status', ['rascunho', 'pendente'])

  if (error) throw error
}

async function activatePatientIfNeeded(pacienteId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('pacientes')
    .select('status')
    .eq('id', pacienteId)
    .maybeSingle()

  if (error) throw error
  if (!data || data.status === 'ativo') return

  const { error: updateError } = await supabaseAdmin
    .from('pacientes')
    .update({ status: 'ativo' })
    .eq('id', pacienteId)

  if (updateError) throw updateError
}

async function ensureUbtVinculo(pacienteId: string, unidadeUbtId: string): Promise<void> {
  const { error } = await supabaseAdmin.from('paciente_vinculos_ubt').upsert(
    {
      paciente_id: pacienteId,
      unidade_ubt_id: unidadeUbtId,
      principal: true,
    },
    { onConflict: 'paciente_id,unidade_ubt_id' },
  )

  if (error) throw error
}

function toUbtPatientFromDetail(pacienteId: string): Promise<UbtPacienteDto> {
  return getPacienteDetail(pacienteId).then((detail) => mapAdminPatientToUbtPatient(detail))
}

export async function lookupUbtPatient(
  scope: UbtAuthScope,
  query: UbtPatientLookupQuery,
): Promise<UbtPatientLookupResult> {
  await assertEntityContractActive(scope.entidadeContratanteId)

  const cpf = normalizeCpf(query.cpf)
  const contractActive = true

  const existing = await findPacienteByCpf(cpf, scope.entidadeContratanteId)
  const pendingPreCadastro = await fetchPendingPreCadastro(scope.entidadeContratanteId, cpf)

  if (!existing && !pendingPreCadastro) {
    return { status: 'not_found' }
  }

  if (existing) {
    const detail = await getPacienteDetail(existing.id)
    const patient = mapDetailToRegistrationPayload(detail)
    const linkedToUnit = await isLinkedToUnit(existing.id, scope.unidadeUbtId)

    const { data: statusRow, error: statusError } = await supabaseAdmin
      .from('pacientes')
      .select('status')
      .eq('id', existing.id)
      .maybeSingle()

    if (statusError) throw statusError
    const isPreCadastro = statusRow?.status === 'pre_cadastro'

    const incomplete =
      existing.dataQuality === 'incomplete' ||
      isPatientIncompleteForFirstVisit(existing) ||
      isPreCadastro

    if (incomplete && query.specialtyId && query.specialtyName) {
      return {
        status: 'found_pending_first_visit',
        patient,
        patientId: existing.id,
        preCadastroId: pendingPreCadastro?.id,
        specialtyId: query.specialtyId,
        specialtyName: query.specialtyName,
        linkedToUnit,
        contractActive,
      }
    }

    return {
      status: 'found',
      patient,
      patientId: existing.id,
      linkedToUnit,
      contractActive,
    }
  }

  const patient = preCadastroDadosToRegistrationPayload(pendingPreCadastro!.dados, cpf)

  if (query.specialtyId && query.specialtyName) {
    return {
      status: 'found_pending_first_visit',
      patient,
      preCadastroId: pendingPreCadastro!.id,
      specialtyId: query.specialtyId,
      specialtyName: query.specialtyName,
      linkedToUnit: false,
      contractActive,
    }
  }

  return {
    status: 'found',
    patient,
    patientId: pendingPreCadastro!.paciente_id ?? undefined,
    linkedToUnit: false,
    contractActive,
  }
}

export async function registerCompletedUbtPaciente(
  scope: UbtAuthScope,
  input: UbtPatientRegistrationPayload,
  existingPatientId?: string,
): Promise<UbtPacienteDto> {
  let pacienteId = existingPatientId

  if (!pacienteId) {
    const existing = await findPacienteByCpf(normalizeCpf(input.cpf), scope.entidadeContratanteId)
    pacienteId = existing?.id
  }

  if (pacienteId) {
    return updateUbtPaciente(scope, pacienteId, input, { completeRegistration: true })
  }

  return createUbtPaciente(scope, input)
}

export async function createUbtPaciente(
  scope: UbtAuthScope,
  input: UbtPatientRegistrationPayload,
): Promise<UbtPacienteDto> {
  await assertEntityContractActive(scope.entidadeContratanteId)

  const detail = await createPaciente({
    ...input,
    entidadeContratanteId: scope.entidadeContratanteId,
    unidadeUbtId: scope.unidadeUbtId,
    status: 'ativo',
  })

  await concludePreCadastrosForPatient(
    scope.entidadeContratanteId,
    normalizeCpf(input.cpf),
    detail.id,
  )
  return mapAdminPatientToUbtPatient(detail)
}

export async function updateUbtPaciente(
  scope: UbtAuthScope,
  pacienteId: string,
  input: Partial<UbtPatientRegistrationPayload>,
  options?: { completeRegistration?: boolean },
): Promise<UbtPacienteDto> {
  await assertEntityContractActive(scope.entidadeContratanteId)
  await assertPacienteBelongsToEntity(scope.entidadeContratanteId, pacienteId)

  await updatePaciente(pacienteId, input)

  if (options?.completeRegistration) {
    const { data, error } = await supabaseAdmin
      .from('pacientes')
      .select('cpf')
      .eq('id', pacienteId)
      .maybeSingle()

    if (error) throw error
    if (data?.cpf) {
      await activatePatientIfNeeded(pacienteId)
      await concludePreCadastrosForPatient(
        scope.entidadeContratanteId,
        String(data.cpf),
        pacienteId,
      )
      await ensureUbtVinculo(pacienteId, scope.unidadeUbtId)
    }
  }

  return toUbtPatientFromDetail(pacienteId)
}

export async function linkUbtPacienteToUnit(
  scope: UbtAuthScope,
  pacienteId: string,
): Promise<UbtPacienteDto> {
  await assertEntityContractActive(scope.entidadeContratanteId)
  await assertPacienteBelongsToEntity(scope.entidadeContratanteId, pacienteId)
  await ensureUbtVinculo(pacienteId, scope.unidadeUbtId)
  return toUbtPatientFromDetail(pacienteId)
}

export async function getUbtPacienteRow(
  scope: UbtAuthScope,
  pacienteId: string,
): Promise<UbtPacienteDto> {
  await assertPacienteBelongsToEntity(scope.entidadeContratanteId, pacienteId)

  const { data, error } = await supabaseAdmin
    .from('vw_admin_pacientes_listagem')
    .select('*')
    .eq('id', pacienteId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new UbtPacientesError('Paciente não encontrado.', 'NOT_FOUND', 404)
  }

  const statsMap = await loadConsultationStats([pacienteId])
  return mapAdminPatientToUbtPatient(
    mapListagemToPatient(data as ListagemRow, statsMap.get(pacienteId)),
  )
}

export async function getUbtPacienteRegistrationDetail(
  scope: UbtAuthScope,
  pacienteId: string,
): Promise<UbtPatientRegistrationPayload & { id: string }> {
  await assertPacienteBelongsToEntity(scope.entidadeContratanteId, pacienteId)
  const detail = await getPacienteDetail(pacienteId)
  return {
    id: detail.id,
    ...mapDetailToRegistrationPayload(detail),
  }
}

export async function getUbtPatientTerritoryPolicy(
  scope: UbtAuthScope,
): Promise<{
  municipio: string
  uf: string
  aceitaPacientesOutrosMunicipios: boolean
}> {
  await assertEntityContractActive(scope.entidadeContratanteId)
  return getEntityPatientTerritoryPolicy(scope.entidadeContratanteId)
}
