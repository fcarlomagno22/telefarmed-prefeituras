export type AppScreen =
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'home'
  | 'my-metrics'
  | 'my-appointments'
  | 'schedule-appointment'

export type RegistrationAddress = {
  cep: string
  street: string
  neighborhood: string
  city: string
  state: string
  number: string
  complement: string
}

export type RegistrationProfile = {
  name: string
  cpf: string
  email: string
  phone: string
}

export type RegistrationData = {
  address: RegistrationAddress
  profile: RegistrationProfile
  password: string
  selfieUri: string | null
  legalAcceptances: {
    termsOfUse: boolean
    privacyPolicy: boolean
    lgpdConsent: boolean
    healthDataConsent: boolean
    communicationsConsent: boolean
    acceptedAt: string
  }
}

export type AuthUser = {
  name: string
  cpf: string
  email: string
  phone: string
  address: RegistrationAddress
  selfieUri?: string | null
}
