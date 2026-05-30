function normalizeSpecialty(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Compara especialidades com equivalência clínica geral / clínica médica. */
export function matchProfissionalSpecialty(profileSpecialty: string, shiftSpecialty: string) {
  const profile = normalizeSpecialty(profileSpecialty)
  const shift = normalizeSpecialty(shiftSpecialty)
  if (profile === shift) return true
  const profileIsClinica =
    profile.includes('clinica') || profile.includes('clinico')
  const shiftIsClinica = shift.includes('clinica') || shift.includes('clinico')
  return profileIsClinica && shiftIsClinica
}
