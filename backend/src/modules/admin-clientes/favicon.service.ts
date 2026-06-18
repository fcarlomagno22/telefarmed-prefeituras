import { ClientesError } from './errors.js'
import {
  deleteEntidadeFavicon as deleteFaviconCore,
  uploadEntidadeFavicon as uploadFaviconCore,
} from '../../lib/entidadeBranding/favicon.service.js'

export { resolveFaviconUrlsByEntityId } from '../../lib/entidadeBranding/favicon.service.js'

export async function uploadEntidadeFavicon(
  entidadeId: string,
  faviconDataUrl: string,
): Promise<string> {
  try {
    return await uploadFaviconCore(entidadeId, faviconDataUrl)
  } catch (error) {
    if (error instanceof Error) {
      throw new ClientesError(error.message, 'INVALID_DATA', 400)
    }
    throw error
  }
}

export async function deleteEntidadeFavicon(storagePath: string | null): Promise<void> {
  return deleteFaviconCore(storagePath)
}
