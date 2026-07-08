import { normalizeCpf } from '../../lib/cpf.js'
import { assertEntityContractActive } from '../../lib/entidadeContrato.js'
import { getEntidadeBrandingById } from '../../lib/entidadeBranding/branding.service.js'
import { supabaseAdmin } from '../../db/supabase.js'
import {
  createPaciente,
  findPacienteByCpf,
  getPacienteDetail,
  updatePaciente,
} from '../admin-pacientes/pacientes.service.js'
import { PacientesError } from '../admin-pacientes/errors.js'
import { checkVdCadastroElegibilidadeCep } from './elegibilidade-cep.service.js'
import { VdCadastroError } from './errors.js'
import { isPacientePhotoDataUrl, uploadVdPacienteFoto } from './foto.service.js'
import {
  shouldVdRegistrarCredentialsOnly,
} from './lookup.mapper.js'
import { mapAppPacienteRegistrationToCreatePacienteInput } from './registration.mapper.js'
import type { AppPacienteRegistrationInput } from './registration.schema.js'
import { createVdPacienteAuthSession } from './session.service.js'
import type {
  VdCadastroEntidadeScope,
  VdCadastroRegistrarResult,
  VdPacienteRegistrationMode,
} from './types.js'
import { mapPatientDetailToVdUserPublic } from './user.mapper.js'

const VD_CONTRACT_INACTIVE_MESSAGE =
  'Esta entidade ainda não possui contrato ativo. O cadastro pelo app não está disponível.'

async function resolveEntityDisplayName(entidadeId: string): Promise<string> {
  const branding = await getEntidadeBrandingById(entidadeId)
  return branding?.entidadeNomeExibicao?.trim() || 'Prefeitura'
}

async function hasPacienteCredencial(entidadeId: string, cpf: string): Promise<boolean> {
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

async function deletePaciente(pacienteId: string): Promise<void> {
  const { error } = await supabaseAdmin.from('pacientes').delete().eq('id', pacienteId)
  if (error) throw error
}

function resolvePhotoDataUrl(input: AppPacienteRegistrationInput): string | undefined {
  return input.photoDataUrl?.trim() || input.selfie?.trim() || undefined
}

function toUpdateInputFromRegistration(
  mapped: ReturnType<typeof mapAppPacienteRegistrationToCreatePacienteInput>,
) {
  const paciente = mapped.paciente
  return {
    fullName: paciente.fullName,
    email: paciente.email,
    phone: paciente.phone,
    zipCode: paciente.zipCode,
    street: paciente.street,
    number: paciente.number,
    complement: paciente.complement,
    neighborhood: paciente.neighborhood,
    city: paciente.city,
    state: paciente.state,
    residenceMunicipalityIbgeCode: paciente.residenceMunicipalityIbgeCode,
    gender: paciente.gender,
    cnsPendente: paciente.cnsPendente,
    consentimentoCadastro: paciente.consentimentoCadastro,
    status: paciente.status,
  }
}

export function shouldUploadVdPacientePhoto(input: {
  mode: VdPacienteRegistrationMode
  existingAvatarUrl?: string | null
  photoDataUrl?: string
}): boolean {
  if (!input.photoDataUrl || !isPacientePhotoDataUrl(input.photoDataUrl)) return false
  if (input.mode === 'credentials_only' && input.existingAvatarUrl?.trim()) return false
  return true
}

export async function registerVdCadastroPaciente(
  scope: VdCadastroEntidadeScope,
  input: AppPacienteRegistrationInput,
  context: {
    userAgent?: string
    ipAddress?: string
  },
): Promise<VdCadastroRegistrarResult> {
  await assertEntityContractActive(scope.entidadeId, VD_CONTRACT_INACTIVE_MESSAGE)

  const cpf = normalizeCpf(input.cpf)
  if (await hasPacienteCredencial(scope.entidadeId, cpf)) {
    throw new VdCadastroError(
      'Este CPF já possui conta no app. Faça login para continuar.',
      'ALREADY_REGISTERED',
      409,
    )
  }

  const elegibilidade = await checkVdCadastroElegibilidadeCep(scope, {
    cep: input.address.cep,
    cidade: input.address.cidade,
    uf: input.address.uf,
  })

  if (!elegibilidade.elegivel) {
    throw new VdCadastroError(
      elegibilidade.motivo ?? 'Endereço fora da área de cobertura do município.',
      'ADDRESS_NOT_ELIGIBLE',
      403,
    )
  }

  const entityDisplayName = await resolveEntityDisplayName(scope.entidadeId)
  const mapped = mapAppPacienteRegistrationToCreatePacienteInput(input, {
    entidadeContratanteId: scope.entidadeId,
    entityDisplayName,
  })

  const photoDataUrl = resolvePhotoDataUrl(input)
  const existing = await findPacienteByCpf(cpf, scope.entidadeId)

  let pacienteId: string
  let mode: VdPacienteRegistrationMode
  let createdPatient = false
  let existingDetail: Awaited<ReturnType<typeof getPacienteDetail>> | undefined

  if (!existing) {
    const pacienteInput = {
      ...mapped.paciente,
      photoDataUrl: undefined,
    }
    const detail = await createPaciente(pacienteInput)
    pacienteId = detail.id
    mode = 'created'
    createdPatient = true
  } else {
    pacienteId = existing.id
    existingDetail = await getPacienteDetail(existing.id)

    if (shouldVdRegistrarCredentialsOnly(existing, existingDetail)) {
      mode = 'credentials_only'
    } else {
      await updatePaciente(existing.id, toUpdateInputFromRegistration(mapped))
      mode = 'updated'
    }
  }

  try {
    if (
      shouldUploadVdPacientePhoto({
        mode,
        existingAvatarUrl: existingDetail?.avatarUrl,
        photoDataUrl,
      })
    ) {
      await uploadVdPacienteFoto(pacienteId, photoDataUrl!)
    }

    const detail = await getPacienteDetail(pacienteId)
    const auth = await createVdPacienteAuthSession({
      pacienteId,
      cpf,
      nome: detail.name,
      entidadeContratanteId: scope.entidadeId,
      password: mapped.password,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    })

    const user = await mapPatientDetailToVdUserPublic(detail, auth.credencialId)

    return {
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      user,
      mode,
    }
  } catch (error) {
    if (createdPatient) {
      try {
        await deletePaciente(pacienteId)
      } catch {
        // rollback best-effort
      }
    }

    if (error instanceof VdCadastroError) throw error
    if (error instanceof PacientesError) throw error
    throw error
  }
}
