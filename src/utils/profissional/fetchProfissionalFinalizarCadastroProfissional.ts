import { PROFISSIONAL_FINALIZAR_CADASTRO_MOCK_CODE } from '../../config/profissionalFinalizarCadastro'
import type { ProfissionalFinalizarCadastroProfissionalData } from '../../types/profissionalFinalizarCadastro'
import { maskCpf } from '../masks'

export class ProfissionalFinalizarCadastroProfissionalLookupError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProfissionalFinalizarCadastroProfissionalLookupError'
  }
}

/** Dados do profissional aprovado vinculados ao código de acesso (mock). */
export async function fetchProfissionalFinalizarCadastroProfissional(
  accessCode: string,
): Promise<ProfissionalFinalizarCadastroProfissionalData> {
  const digits = accessCode.replace(/\D/g, '')

  if (digits !== PROFISSIONAL_FINALIZAR_CADASTRO_MOCK_CODE) {
    throw new ProfissionalFinalizarCadastroProfissionalLookupError(
      'Não foi possível identificar o profissional vinculado a este código.',
    )
  }

  await new Promise((resolve) => window.setTimeout(resolve, 300))

  return {
    fullName: 'Dra. Ana Martins',
    cpf: maskCpf('52998224725'),
  }
}
