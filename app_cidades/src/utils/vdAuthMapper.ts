import type { AuthUser, RegistrationData } from '../types/auth'
import type { VdPacienteUser, VdRegisterInput } from '../types/vdApi'

export function mapVdPacienteUserToAuthUser(user: VdPacienteUser): AuthUser {
  return {
    name: user.name.trim(),
    cpf: user.cpf.trim(),
    email: user.email.trim(),
    phone: user.phone.trim(),
    address: {
      cep: user.address.cep.trim(),
      street: user.address.logradouro.trim(),
      neighborhood: user.address.bairro.trim(),
      city: user.address.cidade.trim(),
      state: user.address.uf.trim(),
      number: user.address.numero.trim(),
      complement: user.address.complemento?.trim() ?? '',
    },
    selfieUri: user.avatarUrl?.trim() || null,
  }
}

export function mapRegistrationDataToVdRegisterInput(
  data: RegistrationData,
  photoDataUrl?: string | null,
): VdRegisterInput {
  const resolvedPhoto = photoDataUrl?.trim() || undefined

  return {
    fullName: data.profile.name.trim(),
    cpf: data.profile.cpf,
    email: data.profile.email.trim(),
    phone: data.profile.phone,
    address: {
      cep: data.address.cep.trim(),
      logradouro: data.address.street.trim(),
      numero: data.address.number.trim(),
      bairro: data.address.neighborhood.trim(),
      cidade: data.address.city.trim(),
      uf: data.address.state.trim(),
      complemento: data.address.complement.trim() || undefined,
    },
    registrationConsent: {
      termsOfUse: data.legalAcceptances.termsOfUse,
      privacyPolicy: data.legalAcceptances.privacyPolicy,
      lgpdConsent: data.legalAcceptances.lgpdConsent,
      healthDataConsent: data.legalAcceptances.healthDataConsent,
      communicationsConsent: data.legalAcceptances.communicationsConsent,
      acceptedAt: data.legalAcceptances.acceptedAt,
    },
    password: data.password,
    ...(resolvedPhoto ? { photoDataUrl: resolvedPhoto } : {}),
  }
}
