import {
  isProfissionalCadastroApiError,
  validateProfissionalAccessCode,
} from '../../lib/services/profissional/cadastro'
import type { ProfissionalFinalizarCadastroProfissionalData } from '../../types/profissionalFinalizarCadastro'
import { maskCpf } from '../masks'

export class ProfissionalFinalizarCadastroProfissionalLookupError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProfissionalFinalizarCadastroProfissionalLookupError'
  }
}

export async function fetchProfissionalFinalizarCadastroProfissional(
  accessCode: string,
): Promise<ProfissionalFinalizarCadastroProfissionalData> {
  try {
    const result = await validateProfissionalAccessCode(accessCode)
    return {
      fullName: result.fullName,
      cpf: maskCpf(result.cpf.replace(/\D/g, '')),
      formationLabel: result.formationLabel,
      specialty: result.specialty,
      professionLabel: result.professionLabel,
    }
  } catch (error) {
    const message = isProfissionalCadastroApiError(error)
      ? error.message
      : 'Não foi possível identificar o profissional vinculado a este código.'
    throw new ProfissionalFinalizarCadastroProfissionalLookupError(message)
  }
}
