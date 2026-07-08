import { formatCpfDisplay } from '../admin-credenciais/formatters.js'
import type { AdminMunicipalPatientDetailDto, AdminMunicipalPatientDto } from '../admin-pacientes/types.js'
import type { VdCadastroLookupPatientDto, VdCadastroLookupResult } from './types.js'

function phoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function formatZipCode(value: string | undefined): string {
  const digits = (value ?? '').replace(/\D/g, '')
  if (digits.length !== 8) return (value ?? '').trim()
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11) return value.trim()
  return value.includes('.') ? value.trim() : formatCpfDisplay(digits)
}

export function hasVdAppRegistrationSubsetFromDetail(
  detail: AdminMunicipalPatientDetailDto,
): boolean {
  if (!detail.name?.trim()) return false
  if (!detail.phone?.trim() || phoneDigits(detail.phone).length < 10) return false

  const profile = detail.profile
  if (!profile?.email?.trim()) return false

  const cep = (profile.zipCode ?? '').replace(/\D/g, '')
  if (cep.length !== 8) return false
  if (!profile.street?.trim()) return false
  if (!profile.number?.trim()) return false
  if (!(profile.neighborhood?.trim() || detail.bairro?.trim())) return false
  if (!profile.city?.trim()) return false
  if (!profile.state?.trim() || profile.state.trim().length !== 2) return false

  return true
}

/** Paciente existente que só precisa de credenciais app (subset app ou cadastro UBT completo). */
export function shouldVdRegistrarCredentialsOnly(
  listagem: Pick<AdminMunicipalPatientDto, 'dataQuality'>,
  detail: AdminMunicipalPatientDetailDto,
): boolean {
  if (listagem.dataQuality === 'complete') return true
  return hasVdAppRegistrationSubsetFromDetail(detail)
}

export function mapPatientDetailToVdLookupPatient(
  detail: AdminMunicipalPatientDetailDto,
  listagem: Pick<AdminMunicipalPatientDto, 'id' | 'dataQuality'>,
): VdCadastroLookupPatientDto {
  const profile = detail.profile

  return {
    patientId: listagem.id,
    fullName: detail.name.trim(),
    cpf: formatCpf(detail.cpf),
    email: profile?.email?.trim() ?? '',
    phone: detail.phone?.trim() ?? '',
    address: {
      cep: formatZipCode(profile?.zipCode),
      logradouro: profile?.street?.trim() ?? '',
      numero: profile?.number?.trim() ?? '',
      bairro: profile?.neighborhood?.trim() || detail.bairro?.trim() || '',
      cidade: profile?.city?.trim() ?? '',
      uf: profile?.state?.trim().toUpperCase() ?? '',
      complemento: profile?.complement?.trim() || undefined,
      codigoIbgeMunicipio: profile?.residenceMunicipalityIbgeCode?.trim() || undefined,
    },
    photoDataUrl: detail.avatarUrl?.trim() || undefined,
    dataQuality: listagem.dataQuality,
  }
}

export type VdCadastroLookupResolutionInput = {
  hasCredencial: boolean
  patient: AdminMunicipalPatientDto | null
  patientDetail: AdminMunicipalPatientDetailDto | null
  pendingPreCadastro: { id: string; paciente_id: string | null } | null
}

export function resolveVdCadastroLookupStatus(
  input: VdCadastroLookupResolutionInput,
): VdCadastroLookupResult {
  if (input.hasCredencial) {
    return { status: 'already_registered' }
  }

  if (!input.patient) {
    if (input.pendingPreCadastro) {
      return {
        status: 'needs_full_registration',
        preCadastroId: input.pendingPreCadastro.id,
      }
    }
    return { status: 'not_found' }
  }

  if (
    !input.patientDetail ||
    !shouldVdRegistrarCredentialsOnly(input.patient, input.patientDetail)
  ) {
    return {
      status: 'needs_full_registration',
      patientId: input.patient.id,
    }
  }

  return {
    status: 'found_complete_needs_credentials',
    patient: mapPatientDetailToVdLookupPatient(input.patientDetail, input.patient),
  }
}
