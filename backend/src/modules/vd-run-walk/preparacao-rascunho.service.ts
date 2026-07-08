import {
  deletePreparacaoRascunho,
  loadPreparacaoRascunhoDto,
  upsertPreparacaoRascunho,
} from './preparacao-rascunho.repository.js'
import type {
  RunWalkPreparacaoRascunhoResultDto,
  UpsertRunWalkPreparacaoRascunhoInput,
} from './preparacao-rascunho.formatters.js'
import type { VdRunWalkPacienteScope } from './types.js'

export async function getRunWalkPreparacaoRascunho(
  scope: VdRunWalkPacienteScope,
): Promise<RunWalkPreparacaoRascunhoResultDto> {
  const draft = await loadPreparacaoRascunhoDto(scope)
  return { draft }
}

export async function putRunWalkPreparacaoRascunho(
  scope: VdRunWalkPacienteScope,
  input: UpsertRunWalkPreparacaoRascunhoInput,
): Promise<RunWalkPreparacaoRascunhoResultDto> {
  const draft = await upsertPreparacaoRascunho(scope, input)
  return { draft }
}

export async function deleteRunWalkPreparacaoRascunho(
  scope: VdRunWalkPacienteScope,
): Promise<void> {
  await deletePreparacaoRascunho(scope)
}
