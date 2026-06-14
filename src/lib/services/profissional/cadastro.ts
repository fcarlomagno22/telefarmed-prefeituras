import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/profissional/cadastro'
import {
  ProfissionalCadastroApiError as MockProfissionalCadastroApiError,
  finalizeProfissionalCadastro as mockFinalizeProfissionalCadastro,
  isProfissionalCadastroApiError as mockIsProfissionalCadastroApiError,
  submitProfissionalCadastro as mockSubmitProfissionalCadastro,
  validateProfissionalAccessCode as mockValidateProfissionalAccessCode,
} from '../../mockServices/profissional/cadastro'
import type { MedicoCadastroDocumentUploads, MedicoCadastroFormValues } from '../../../types/medicoCadastro'
import type {
  ProfissionalFinalizarCadastroEmpresaData,
  ProfissionalFinalizarCadastroFormValues,
  ProfissionalFinalizarCadastroProfissionalData,
} from '../../../types/profissionalFinalizarCadastro'

export type SubmitProfissionalCadastroProgress = api.SubmitProfissionalCadastroProgress

export const ProfissionalCadastroApiError = isBackendApiEnabled()
  ? api.ProfissionalCadastroApiError
  : MockProfissionalCadastroApiError

export type ProfissionalCadastroApiError = InstanceType<typeof ProfissionalCadastroApiError>

export function isProfissionalCadastroApiError(
  error: unknown,
): error is ProfissionalCadastroApiError {
  if (isBackendApiEnabled()) {
    return api.isProfissionalCadastroApiError(error)
  }
  return mockIsProfissionalCadastroApiError(error)
}

export function getSubmitProgressMessage(percent: number): string {
  return api.getSubmitProgressMessage(percent)
}

export async function submitProfissionalCadastro(
  input: {
    values: MedicoCadastroFormValues
    documents: MedicoCadastroDocumentUploads
  },
  onProgress?: (progress: SubmitProfissionalCadastroProgress) => void,
): Promise<{ candidaturaId: string }> {
  if (isBackendApiEnabled()) {
    return api.apiSubmitProfissionalCadastro(input, onProgress)
  }

  onProgress?.({ percent: 35, message: api.getSubmitProgressMessage(35) })
  await new Promise((resolve) => setTimeout(resolve, 400))
  onProgress?.({ percent: 72, message: api.getSubmitProgressMessage(72) })
  await new Promise((resolve) => setTimeout(resolve, 400))
  onProgress?.({ percent: 100, message: api.getSubmitProgressMessage(100) })
  return mockSubmitProfissionalCadastro(input)
}

export async function validateProfissionalAccessCode(
  accessCode: string,
): Promise<ProfissionalFinalizarCadastroProfissionalData> {
  if (isBackendApiEnabled()) {
    return api.apiValidateProfissionalAccessCode(accessCode)
  }
  return mockValidateProfissionalAccessCode(accessCode)
}

export async function finalizeProfissionalCadastro(input: {
  values: ProfissionalFinalizarCadastroFormValues
  empresa: ProfissionalFinalizarCadastroEmpresaData
}): Promise<{ profissionalId: string }> {
  if (isBackendApiEnabled()) {
    return api.apiFinalizeProfissionalCadastro(input)
  }
  return mockFinalizeProfissionalCadastro(input)
}
