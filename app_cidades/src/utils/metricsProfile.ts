import type {
  MetricsProfileDto,
  UpdateMetricsProfileInput,
} from '../lib/api/vd/metricas'
import type { RegistrationGender } from './registrationGender'
import type { EditableProfileFieldId, ProfileSnapshot } from '../types/metrics'
import { parseBirthDateBrToIso, formatBirthDateIsoToBr } from './birthDate'
import { hasImcInputs, parseHeightMeters, parseWeightKg } from './bmi'

const PROFILE_GENDER_OPTIONS = [
  'Feminino',
  'Masculino',
  'Outro',
  'Prefiro não informar',
] as const

export function mapApiGenderLabelToProfile(genderLabel: string | null | undefined): string {
  if (!genderLabel?.trim()) return ''
  if (genderLabel === 'Não informado') return 'Prefiro não informar'
  if (genderLabel === 'Outros') return 'Outro'
  return genderLabel
}

export function metricsProfileDtoToSnapshot(
  dto: MetricsProfileDto | null | undefined,
): ProfileSnapshot {
  if (!dto) {
    return {
      height: '',
      weight: '',
      birthDate: '',
      age: '',
      gender: '',
    }
  }

  return {
    height: dto.height?.trim() ?? '',
    weight: dto.weight?.trim() ?? '',
    birthDate: dto.birthDate?.trim() ?? '',
    age: dto.ageLabel?.trim() ?? '',
    gender: mapApiGenderLabelToProfile(dto.genderLabel),
  }
}

export function profileGenderLabelToApi(label: string): RegistrationGender {
  const normalized = label.trim().toLowerCase()
  if (normalized === 'masculino') return 'masculino'
  if (normalized === 'feminino') return 'feminino'
  if (normalized === 'outro' || normalized === 'outros') return 'outros'
  return 'prefiro_nao_informar'
}

export function profileFieldToUpdateInput(
  field: EditableProfileFieldId,
  value: string,
): UpdateMetricsProfileInput {
  if (field === 'height') {
    const heightMeters = parseHeightMeters(value)
    return heightMeters != null ? { heightMeters } : {}
  }

  if (field === 'weight') {
    const weightKg = parseWeightKg(value)
    return weightKg != null ? { weightKg } : {}
  }

  return { gender: profileGenderLabelToApi(value) }
}

export function onboardingToUpdateInput(
  height: string,
  weight: string,
  birthDate: string,
): UpdateMetricsProfileInput {
  const input: UpdateMetricsProfileInput = {}
  const heightMeters = parseHeightMeters(height)
  const weightKg = parseWeightKg(weight)
  const birthDateIso = parseBirthDateBrToIso(birthDate)

  if (heightMeters != null) input.heightMeters = heightMeters
  if (weightKg != null) input.weightKg = weightKg
  if (birthDateIso) input.birthDate = birthDateIso

  return input
}

export function onboardingProfileSnapshot(
  height: string,
  weight: string,
  birthDate: string,
): ProfileSnapshot {
  const birthDateIso = parseBirthDateBrToIso(birthDate)

  return {
    height,
    weight,
    birthDate: birthDateIso ? formatBirthDateIsoToBr(birthDateIso) : birthDate.trim(),
    age: '',
    gender: '',
  }
}

export function needsMetricsProfileOnboarding(profile: ProfileSnapshot): boolean {
  return !hasImcInputs(profile) || !profile.birthDate.trim()
}

export function isProfileGenderOption(value: string): boolean {
  return PROFILE_GENDER_OPTIONS.includes(value as (typeof PROFILE_GENDER_OPTIONS)[number])
}
