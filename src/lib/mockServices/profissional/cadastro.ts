import { profissionalLoggedProfile } from '../../../data/profissionalPerfilMock'
import type { MedicoCadastroDocumentUploads, MedicoCadastroFormValues } from '../../../types/medicoCadastro'
import type {
  ProfissionalFinalizarCadastroFormValues,
  ProfissionalFinalizarCadastroProfissionalData,
} from '../../../types/profissionalFinalizarCadastro'
import { mockDelay } from '../delay'

export class ProfissionalCadastroApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ProfissionalCadastroApiError'
    this.status = status
    this.code = code
  }
}

export function isProfissionalCadastroApiError(
  error: unknown,
): error is ProfissionalCadastroApiError {
  return error instanceof ProfissionalCadastroApiError
}

function buildValidateAccessCodeResponse(): ProfissionalFinalizarCadastroProfissionalData {
  const profile = profissionalLoggedProfile

  return {
    fullName: profile.fullName,
    cpf: profile.cpf.replace(/\D/g, ''),
    formationLabel: profile.profession,
    specialty: profile.specialty,
    professionLabel: profile.profession,
  }
}

export async function submitProfissionalCadastro(input: {
  values: MedicoCadastroFormValues
  documents: MedicoCadastroDocumentUploads
}): Promise<{ candidaturaId: string }> {
  void input
  return mockDelay({ candidaturaId: `candidatura-${Date.now()}` })
}

export async function validateProfissionalAccessCode(
  accessCode: string,
): Promise<ProfissionalFinalizarCadastroProfissionalData> {
  const digits = accessCode.replace(/\D/g, '')
  if (digits.length !== 6) {
    throw new ProfissionalCadastroApiError(
      'Código de acesso inválido ou expirado.',
      404,
      'INVALID_ACCESS_CODE',
    )
  }

  return mockDelay(buildValidateAccessCodeResponse())
}

export async function finalizeProfissionalCadastro(input: {
  values: ProfissionalFinalizarCadastroFormValues
  empresa: { razaoSocial: string; municipio: string; uf: string }
}): Promise<{ profissionalId: string }> {
  const digits = input.values.accessCode.replace(/\D/g, '')
  if (digits.length !== 6) {
    throw new ProfissionalCadastroApiError(
      'Código de acesso inválido ou expirado.',
      404,
      'INVALID_ACCESS_CODE',
    )
  }

  if (!input.values.contractAccepted) {
    throw new ProfissionalCadastroApiError(
      'Aceite do contrato é obrigatório.',
      400,
      'CONTRACT_NOT_ACCEPTED',
    )
  }

  return mockDelay({ profissionalId: profissionalLoggedProfile.id })
}
