export const PACIENTE_NACIONALIDADES = [
  'brasileira',
  'brasileira_nascido_exterior',
  'estrangeira',
  'ignorado',
] as const

export type PacienteNacionalidade = (typeof PACIENTE_NACIONALIDADES)[number]

export const PACIENTE_RACAS_COR = [
  'branca',
  'preta',
  'parda',
  'amarela',
  'indigena',
  'ignorado',
] as const

export type PacienteRacaCor = (typeof PACIENTE_RACAS_COR)[number]

export function isValidPacienteNacionalidade(value: string): value is PacienteNacionalidade {
  return (PACIENTE_NACIONALIDADES as readonly string[]).includes(value)
}

export function isValidPacienteRacaCor(value: string): value is PacienteRacaCor {
  return (PACIENTE_RACAS_COR as readonly string[]).includes(value)
}
