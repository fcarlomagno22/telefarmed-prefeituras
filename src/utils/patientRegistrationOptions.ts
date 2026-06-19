export const patientNationalityOptions = [
  { value: '', label: 'Selecione' },
  { value: 'brasileira', label: 'Brasileira' },
  { value: 'brasileira_nascido_exterior', label: 'Brasileira nascida no exterior' },
  { value: 'estrangeira', label: 'Estrangeira' },
  { value: 'ignorado', label: 'Ignorado' },
] as const

export const patientRaceColorOptions = [
  { value: '', label: 'Selecione' },
  { value: 'branca', label: 'Branca' },
  { value: 'preta', label: 'Preta' },
  { value: 'parda', label: 'Parda' },
  { value: 'amarela', label: 'Amarela' },
  { value: 'indigena', label: 'Indígena' },
  { value: 'ignorado', label: 'Ignorado' },
] as const

export const guardianRelationshipOptions = [
  { value: '', label: 'Selecione' },
  { value: 'pai', label: 'Pai' },
  { value: 'mae', label: 'Mãe' },
  { value: 'avo', label: 'Avô / Avó' },
  { value: 'tio', label: 'Tio / Tia' },
  { value: 'irmao', label: 'Irmão / Irmã' },
  { value: 'tutor', label: 'Tutor legal' },
  { value: 'curador', label: 'Curador' },
  { value: 'conjuge', label: 'Cônjuge' },
  { value: 'filho', label: 'Filho / Filha' },
  { value: 'outro', label: 'Outro' },
] as const

export type PatientNationality = Exclude<
  (typeof patientNationalityOptions)[number]['value'],
  ''
>

export type PatientRaceColor = Exclude<(typeof patientRaceColorOptions)[number]['value'], ''>
