import type { SpecialtyOption } from '../components/dashboard/SpecialtySelectionStep'

function normalizeSpecialtyName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function isMtSpecialty(item: Pick<SpecialtyOption, 'origemAtendimento'>): boolean {
  return item.origemAtendimento === 'mt'
}

export function isPediatriaSpecialtyName(specialtyName: string): boolean {
  return normalizeSpecialtyName(specialtyName) === 'pediatria'
}

export function isClinicaGeralSpecialtyName(specialtyName: string): boolean {
  const normalized = normalizeSpecialtyName(specialtyName)
  return normalized === 'clinica geral' || normalized === 'clinico geral'
}

/** Apenas Pediatria e Clínica Geral em MT: encaixe imediato 24/7, sem escolha de horário. */
export function isRh3ImmediateMtSpecialtyName(specialtyName: string): boolean {
  return isPediatriaSpecialtyName(specialtyName) || isClinicaGeralSpecialtyName(specialtyName)
}

export function isRh3ImmediateMtSpecialty(
  item: Pick<SpecialtyOption, 'name' | 'origemAtendimento'>,
): boolean {
  return isMtSpecialty(item) && isRh3ImmediateMtSpecialtyName(item.name)
}

export type WalkInMtFlowMode = 'mt_immediate' | 'mt_scheduled'

export function resolveWalkInMtFlowMode(
  item: Pick<SpecialtyOption, 'name' | 'origemAtendimento'>,
): WalkInMtFlowMode | null {
  if (!isMtSpecialty(item)) return null
  return isRh3ImmediateMtSpecialty(item) ? 'mt_immediate' : 'mt_scheduled'
}
