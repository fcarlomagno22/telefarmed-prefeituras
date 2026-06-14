import { getAdminEscalaDoctorOptions, getAdminEscalaSpecialties } from '../../data/adminEscalaCatalog'
import { getSpecialtyById } from '../../data/specialties'

export type EscalaDoctorOption = {
  value: string
  label: string
  specialty: string
}

function normalizeSpecialtyToken(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bclinic[ao]\b/g, 'clinica')
    .replace(/\s+/g, ' ')
    .trim()
}

function specialtyNamesForId(specialtyId: string): string[] {
  const names = new Set<string>()
  const fromCatalog = getSpecialtyById(specialtyId)?.name
  const fromEscala = getAdminEscalaSpecialties().find((item) => item.id === specialtyId)?.name
  if (fromCatalog) names.add(fromCatalog)
  if (fromEscala) names.add(fromEscala)
  return [...names]
}

function doctorMatchesSpecialty(doctorSpecialty: string, targetNames: string[]) {
  const doctorToken = normalizeSpecialtyToken(doctorSpecialty)
  return targetNames.some((name) => {
    const targetToken = normalizeSpecialtyToken(name)
    return (
      doctorToken === targetToken ||
      doctorToken.includes(targetToken) ||
      targetToken.includes(doctorToken)
    )
  })
}

/** Médicos ativos da escala compatíveis com a especialidade selecionada (sem fallback). */
export function getDoctorsForEscalaSpecialty(specialtyId: string): EscalaDoctorOption[] {
  if (!specialtyId) return []
  const targetNames = specialtyNamesForId(specialtyId)
  if (targetNames.length === 0) return []

  return getAdminEscalaDoctorOptions().filter((doctor) =>
    doctorMatchesSpecialty(doctor.specialty, targetNames),
  )
}

export function isDoctorInEscalaSpecialty(doctorId: string, specialtyId: string) {
  return getDoctorsForEscalaSpecialty(specialtyId).some((doctor) => doctor.value === doctorId)
}
