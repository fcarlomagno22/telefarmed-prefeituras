import { ClientesError } from './errors.js'
import {
  deleteEntidadeLoginBackground as deleteLoginBackgroundCore,
  uploadEntidadeLoginBackground as uploadLoginBackgroundCore,
} from '../../lib/entidadeBranding/loginBackground.service.js'

export { resolveLoginBackgroundUrlsByEntityId } from '../../lib/entidadeBranding/loginBackground.service.js'

export async function uploadEntidadeLoginBackground(
  entidadeId: string,
  backgroundDataUrl: string,
): Promise<string> {
  try {
    return await uploadLoginBackgroundCore(entidadeId, backgroundDataUrl)
  } catch (error) {
    if (error instanceof Error) {
      throw new ClientesError(error.message, 'INVALID_DATA', 400)
    }
    throw error
  }
}

export async function deleteEntidadeLoginBackground(storagePath: string | null): Promise<void> {
  return deleteLoginBackgroundCore(storagePath)
}
