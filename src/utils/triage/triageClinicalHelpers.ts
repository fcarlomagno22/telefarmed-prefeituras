import type { PatientAgeGroup } from '../../types/attendance'
import type { ChronicConditionId, TriageClinicalData } from '../../types/triageClinical'

export function patientAgeFromBirthDate(birthDate: string): number | null {
  if (!birthDate) return null
  const parsed = new Date(`${birthDate}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - parsed.getFullYear()
  const monthDiff = today.getMonth() - parsed.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
    age -= 1
  }
  return age
}

export function isFemaleReproductiveAge(gender: string, birthDate: string): boolean {
  const normalized = gender.trim().toLowerCase()
  if (normalized !== 'f' && normalized !== 'feminino' && normalized !== 'female') {
    return false
  }
  const age = patientAgeFromBirthDate(birthDate)
  return age !== null && age >= 12 && age <= 55
}

export function hasDiabetesCondition(conditions: ChronicConditionId[]): boolean {
  return conditions.includes('diabetes_type_1') || conditions.includes('diabetes_type_2')
}

export function hasHypertensionCondition(conditions: ChronicConditionId[]): boolean {
  return conditions.includes('hypertension')
}

export function shouldShowSafetyForMinor(ageGroup: PatientAgeGroup | null): boolean {
  return ageGroup === 'minor'
}

export function shouldShowSafetyForElderly(ageGroup: PatientAgeGroup | null): boolean {
  return ageGroup === 'elderly'
}

export function shouldShowGlucoseVital(data: TriageClinicalData): boolean {
  return hasDiabetesCondition(data.chronicConditions)
}

export function isMotiveStepComplete(data: TriageClinicalData): boolean {
  return data.chiefComplaint.trim().length >= 3 && data.symptomOnset !== null
}

export function isBloodPressureValid(systolic: number | null, diastolic: number | null): boolean {
  if (systolic === null || diastolic === null) return true
  if (systolic < 60 || systolic > 250) return false
  if (diastolic < 40 || diastolic > 150) return false
  return systolic > diastolic
}

export function parseNumericInput(value: string): number | null {
  const trimmed = value.trim().replace(',', '.')
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}
