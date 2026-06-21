function normalizeSpecialtyName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function isPediatriaSpecialtyName(specialtyName: string): boolean {
  return normalizeSpecialtyName(specialtyName) === 'pediatria'
}

export function isClinicaGeralSpecialtyName(specialtyName: string): boolean {
  const normalized = normalizeSpecialtyName(specialtyName)
  return normalized === 'clinica geral' || normalized === 'clinico geral'
}

/** Apenas Pediatria e Clínica Geral terceirizadas: atendimento imediato 24/7 via convite RH3. */
export function isRh3ImmediateMtSpecialtyName(specialtyName: string): boolean {
  return isPediatriaSpecialtyName(specialtyName) || isClinicaGeralSpecialtyName(specialtyName)
}
