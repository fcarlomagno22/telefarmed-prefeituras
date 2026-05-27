export type DoctorRecordPatientProfile = {
  photoUrl: string
  firstName: string
  lastName: string
  birthDateLabel: string
  ageLabel: string
  city: string
}

export function splitPatientFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()
  if (!trimmed) return { firstName: '—', lastName: '' }

  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

export function formatPatientBirthDateLabel(birthDateIso: string): string {
  const date = new Date(birthDateIso)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatPatientAgeLabel(birthDateIso: string, referenceDate = new Date()): string {
  const birth = new Date(birthDateIso)
  if (Number.isNaN(birth.getTime())) return '—'

  let age = referenceDate.getFullYear() - birth.getFullYear()
  const monthDiff = referenceDate.getMonth() - birth.getMonth()
  const dayDiff = referenceDate.getDate() - birth.getDate()

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }

  return age === 1 ? '1 ano' : `${age} anos`
}

export function buildDoctorRecordPatientProfile(input: {
  patientName: string
  patientPhotoUrl: string
  patientBirthDateIso: string
  patientCity: string
}): DoctorRecordPatientProfile {
  const { firstName, lastName } = splitPatientFullName(input.patientName)

  return {
    photoUrl: input.patientPhotoUrl,
    firstName,
    lastName,
    birthDateLabel: formatPatientBirthDateLabel(input.patientBirthDateIso),
    ageLabel: formatPatientAgeLabel(input.patientBirthDateIso),
    city: input.patientCity,
  }
}
