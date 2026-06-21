export type ContratoOrigemAtendimento = 'mp' | 'mt'

/** ID legado da profissão Médicos no seed inicial (`config_profissoes`). */
export const MEDICO_PROFESSION_ID = 'prof-medicos'

export type MedicoProfessionRef = {
  id: string
  name: string
  councilAcronym?: string
}

export const CONTRATO_ORIGEM_ATENDIMENTO_OPTIONS: {
  value: ContratoOrigemAtendimento
  label: string
  title: string
}[] = [
  { value: 'mp', label: 'MP', title: 'Médicos próprios' },
  { value: 'mt', label: 'MT', title: 'Médicos terceirizados' },
]

function normalizeProfessionName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function isMedicoProfession(profession: MedicoProfessionRef): boolean {
  if (profession.id === MEDICO_PROFESSION_ID) return true
  if (profession.councilAcronym?.trim().toUpperCase() === 'CRM') return true

  const normalized = normalizeProfessionName(profession.name)
  return normalized === 'medicos' || normalized === 'medicina' || normalized === 'medico'
}

export function isMedicoProfessionId(
  professionId: string,
  professions: MedicoProfessionRef[] = [],
): boolean {
  const profession = professions.find((item) => item.id === professionId)
  if (profession) return isMedicoProfession(profession)
  return professionId === MEDICO_PROFESSION_ID
}

export function defaultContratoOrigemAtendimento(): ContratoOrigemAtendimento {
  return 'mp'
}
