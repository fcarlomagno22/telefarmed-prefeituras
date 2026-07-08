import type { VdPublicTenantResponse } from './vdTenant'

export type VdTenantScope = {
  slug?: string
  host?: string
}

export type VdCepElegibilidadeEndereco = {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
  complemento: string
  codigoIbgeMunicipio?: string
}

export type VdCepElegibilidadeResult = {
  elegivel: boolean
  municipio: string
  uf: string
  contratoAtivo: true
  motivo?: string
  endereco?: VdCepElegibilidadeEndereco
}

export type VdCadastroLookupPatient = {
  patientId: string
  fullName: string
  cpf: string
  email: string
  phone: string
  address: {
    cep: string
    logradouro: string
    numero: string
    bairro: string
    cidade: string
    uf: string
    complemento?: string
    codigoIbgeMunicipio?: string
  }
  photoDataUrl?: string
  dataQuality: 'complete' | 'incomplete'
}

export type VdCadastroLookupResult =
  | { status: 'not_found' }
  | {
      status: 'needs_full_registration'
      patientId?: string
      preCadastroId?: string
    }
  | {
      status: 'found_complete_needs_credentials'
      patient: VdCadastroLookupPatient
    }
  | { status: 'already_registered' }

export type VdRegistrationConsentInput = {
  termsOfUse: boolean
  privacyPolicy: boolean
  lgpdConsent: boolean
  healthDataConsent: boolean
  communicationsConsent: boolean
  acceptedAt: string
}

export type VdRegisterAddressInput = {
  cep: string
  logradouro: string
  numero: string
  bairro: string
  cidade: string
  uf: string
  complemento?: string
  codigoIbgeMunicipio?: string
}

export type VdRegisterInput = {
  fullName: string
  cpf: string
  email: string
  phone: string
  address: VdRegisterAddressInput
  registrationConsent: VdRegistrationConsentInput
  password: string
  photoDataUrl?: string
  selfie?: string
}

export type VdPacienteUser = {
  id: string
  credencialId: string
  name: string
  cpf: string
  email: string
  phone: string
  entidadeContratanteId: string
  avatarUrl?: string
  address: {
    cep: string
    logradouro: string
    numero: string
    bairro: string
    cidade: string
    uf: string
    complemento?: string
  }
}

export type VdRegisterResult = {
  accessToken: string
  user: VdPacienteUser
  mode: 'created' | 'updated' | 'credentials_only'
}

export type VdLoginResult = {
  accessToken: string
  user: VdPacienteUser
}

export type VdPasswordRecoveryRequestResult = {
  resetToken: string
  sentTo: string
  expiresInMinutes: number
  sentAt?: string
}

export type VdPasswordRecoveryVerifyResult = {
  verificationToken: string
}

export type { VdPublicTenantResponse as VdTenantResult }
