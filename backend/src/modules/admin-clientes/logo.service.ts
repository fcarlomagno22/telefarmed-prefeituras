import { ClientesError } from './errors.js'
import {
  deleteEntidadeLogo as deleteLogoCore,
  uploadEntidadeLogo as uploadLogoCore,
} from '../../lib/entidadeBranding/logo.service.js'

export { resolveLogoUrlsByEntityId } from '../../lib/entidadeBranding/logo.service.js'

export async function uploadEntidadeLogo(
  entidadeId: string,
  logoDataUrl: string,
): Promise<string> {
  try {
    return await uploadLogoCore(entidadeId, logoDataUrl)
  } catch (error) {
    if (error instanceof Error) {
      throw new ClientesError(error.message, 'INVALID_DATA', 400)
    }
    throw error
  }
}

export async function deleteEntidadeLogo(storagePath: string | null): Promise<void> {
  return deleteLogoCore(storagePath)
}
