import { formatCpfDisplay } from '../admin-credenciais/formatters.js'
import type { AdminMunicipalPatientDetailDto, AdminMunicipalPatientDto } from '../admin-pacientes/types.js'
import {
  genderToSexo,
  parseBirthDateToIso,
} from '../admin-pacientes/formatters.js'
import type { UbtPacienteDto, UbtPatientRegistrationPayload } from './types.js'

function normalizeRegistrationContacts(
  contacts: Array<{ id?: string; name: string; phone: string; relationship?: string }> | undefined,
): UbtPatientRegistrationPayload['contacts'] {
  if (!contacts?.length) return []

  return contacts
    .filter((contact) => contact.name.trim() || contact.phone.trim())
    .map((contact, index) => ({
      id: contact.id ?? `contact-${index + 1}`,
      name: contact.name.trim(),
      phone: contact.phone.trim(),
      relationship: contact.relationship?.trim() ?? '',
    }))
}

function formatGuardianCpf(value: string | undefined): string {
  const digits = (value ?? '').replace(/\D/g, '')
  if (digits.length !== 11) return (value ?? '').trim()
  return formatCpfDisplay(digits)
}

function formatZipCode(value: string | undefined): string {
  const digits = (value ?? '').replace(/\D/g, '')
  if (digits.length !== 8) return (value ?? '').trim()
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function mapAdminPatientToUbtPatient(row: AdminMunicipalPatientDto): UbtPacienteDto {
  const {
    municipality: _municipality,
    contractStatus: _contractStatus,
    registrationMonthLabel: _registrationMonthLabel,
    contractingEntityId: _contractingEntityId,
    contractingEntityRazaoSocial: _contractingEntityRazaoSocial,
    ...patient
  } = row
  return patient
}

export function mapDetailToRegistrationPayload(
  detail: AdminMunicipalPatientDetailDto,
): UbtPatientRegistrationPayload {
  const profile = detail.profile
  const gender =
    profile?.genderLabel === 'Masculino'
      ? 'masculino'
      : profile?.genderLabel === 'Feminino'
        ? 'feminino'
        : 'nao_informar'

  return {
    fullName: detail.name,
    socialName: profile?.socialName ?? '',
    cpf: detail.cpf.includes('.') ? detail.cpf : formatCpfDisplay(detail.cpf.replace(/\D/g, '')),
    birthDate: parseBirthDateToIso(detail.birthDate),
    gender,
    phone: detail.phone?.trim() ?? '',
    email: profile?.email ?? '',
    guardianName: profile?.guardianName ?? '',
    guardianCpf: formatGuardianCpf(profile?.guardianCpf),
    contacts: normalizeRegistrationContacts(profile?.contacts),
    zipCode: formatZipCode(profile?.zipCode),
    street: profile?.street ?? '',
    number: profile?.number ?? '',
    complement: profile?.complement ?? '',
    neighborhood: profile?.neighborhood || detail.bairro,
    city: profile?.city ?? '',
    state: profile?.state ?? '',
    photoDataUrl: detail.avatarUrl ?? '',
  }
}

export function preCadastroDadosToRegistrationPayload(
  dados: Record<string, unknown>,
  cpf: string,
): UbtPatientRegistrationPayload {
  const genderValue = genderToSexo(String(dados.gender ?? ''))

  return {
    fullName: String(dados.fullName ?? '').trim(),
    socialName: String(dados.socialName ?? '').trim(),
    cpf: formatCpfDisplay(cpf),
    birthDate: String(dados.birthDate ?? '').trim(),
    gender: genderValue === 'nao_informado' ? 'nao_informar' : genderValue,
    phone: String(dados.phone ?? '').trim(),
    email: String(dados.email ?? '').trim(),
    guardianName: String(dados.guardianName ?? '').trim(),
    guardianCpf: formatGuardianCpf(String(dados.guardianCpf ?? '')),
    contacts: normalizeRegistrationContacts(
      Array.isArray(dados.contacts)
        ? (dados.contacts as UbtPatientRegistrationPayload['contacts'])
        : [],
    ),
    zipCode: formatZipCode(String(dados.zipCode ?? '')),
    street: String(dados.street ?? '').trim(),
    number: String(dados.number ?? '').trim(),
    complement: String(dados.complement ?? '').trim(),
    neighborhood: String(dados.neighborhood ?? '').trim(),
    city: String(dados.city ?? '').trim(),
    state: String(dados.state ?? '').trim(),
    photoDataUrl: String(dados.photoDataUrl ?? '').trim(),
  }
}

export function isPatientIncompleteForFirstVisit(patient: AdminMunicipalPatientDto): boolean {
  if (patient.dataQuality === 'incomplete') return true
  if (!patient.avatarUrl?.trim()) return true
  return false
}
