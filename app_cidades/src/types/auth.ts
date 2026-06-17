export type AppScreen =
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'home'
  | 'my-metrics'
  | 'my-appointments'
  | 'schedule-appointment'
  | 'post-consultation'
  | 'my-documents'
  | 'nearby-units'
  | 'nearby-running-routes'
  | 'functional-training'
  | 'functional-exercise'
  | 'run-walk'
  | 'run-walk-preparation'
  | 'run-walk-checklist'
  | 'run-walk-countdown'
  | 'run-walk-live'
  | 'run-walk-live-viewer'
  | 'run-walk-checkin'
  | 'run-walk-challenges'
  | 'run-walk-challenge-rules'
  | 'run-walk-achievements'
  | 'run-walk-achievement-detail'
  | 'run-walk-summary'
  | 'eat-well'
  | 'eat-well-menu'
  | 'sleep-time'
  | 'sleep-stories'

export type LiveShareViewerRouteParams = {
  token?: string
}

export type RunWalkRouteParams = {
  modality?: ActivityModality
  activityName?: string
  intensity?: string
  durationMinutes?: number
  openModalityDrawer?: boolean
  summaryId?: string
  challengeId?: string
  achievementId?: string
  celebrateWeeklyGoal?: boolean
  celebrateDateIso?: string
  celebrateFromMinutes?: number
  celebrateToMinutes?: number
}

export type FunctionalRouteParams = {
  exerciseId?: string
  startCircuit?: boolean
}

export type EatWellRouteParams = {
  menuId?: string
}

export type ActivityModality =
  | 'walk'
  | 'active-walk'
  | 'run'
  | 'run-walk'
  | 'treadmill'
  | 'free'

export type AppRouteParams =
  | FunctionalRouteParams
  | RunWalkRouteParams
  | LiveShareViewerRouteParams
  | EatWellRouteParams

export function getRunWalkRouteParams(params: AppRouteParams | null): RunWalkRouteParams {
  if (!params) return {}
  if (
    'modality' in params ||
    'activityName' in params ||
    'durationMinutes' in params ||
    'openModalityDrawer' in params ||
    'summaryId' in params ||
    'challengeId' in params ||
    'achievementId' in params ||
    'celebrateWeeklyGoal' in params ||
    'celebrateDateIso' in params ||
    'celebrateFromMinutes' in params ||
    'celebrateToMinutes' in params
  ) {
    return params as RunWalkRouteParams
  }
  return {}
}

export function getFunctionalRouteParams(params: AppRouteParams | null): FunctionalRouteParams {
  if (!params) return {}
  if ('exerciseId' in params || 'startCircuit' in params) {
    return params as FunctionalRouteParams
  }
  return {}
}

export function getEatWellRouteParams(params: AppRouteParams | null): EatWellRouteParams {
  if (!params) return {}
  if ('menuId' in params) {
    return params as EatWellRouteParams
  }
  return {}
}

export function getLiveShareViewerRouteParams(
  params: AppRouteParams | null,
): LiveShareViewerRouteParams {
  if (!params) return {}
  if ('token' in params) {
    return params as LiveShareViewerRouteParams
  }
  return {}
}

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
