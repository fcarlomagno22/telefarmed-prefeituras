/** Origem do cadastro do paciente — espelha enum `cadastro_origem_paciente` no Postgres. */
export const PACIENTE_CADASTRO_ORIGEM = {
  app: 'app',
  ubt: 'ubt',
  admin: 'admin',
} as const

export type PacienteCadastroOrigem =
  (typeof PACIENTE_CADASTRO_ORIGEM)[keyof typeof PACIENTE_CADASTRO_ORIGEM]

export const PACIENTE_CADASTRO_ORIGEM_VALUES = Object.values(PACIENTE_CADASTRO_ORIGEM)

/**
 * Cadastro parcial via app (ex.: sem data de nascimento) permanece `dataQuality: incomplete`
 * até a UBT ou outro canal preencher os campos clínicos obrigatórios.
 */
export const PACIENTE_CADASTRO_SUBSET_INCOMPLETE_NOTE =
  'Pacientes com data_nascimento nula ou demografia incompleta são marcados como cadastro incompleto; a UBT deve completar antes do atendimento clínico pleno.'
