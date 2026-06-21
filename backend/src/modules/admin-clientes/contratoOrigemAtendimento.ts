export type ContratoOrigemAtendimento = 'mp' | 'mt'

export const MEDICO_PROFESSION_ID = 'prof-medicos'

export type ContratoOrigemAtendimentoEspecialidadeInput = {
  specialtyId: string
  origem: ContratoOrigemAtendimento
}

export type ContratoOrigemAtendimentoProfissaoInput = {
  professionId: string
  origem: ContratoOrigemAtendimento
}

export function normalizeContratoOrigemAtendimento(
  value: unknown,
): ContratoOrigemAtendimento {
  return value === 'mt' ? 'mt' : 'mp'
}
