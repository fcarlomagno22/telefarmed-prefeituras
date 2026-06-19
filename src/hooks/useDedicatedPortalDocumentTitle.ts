import { useFallbackDocumentTitle } from './useAppDocumentTitle'
import type { PortalId } from '../config/portalHost'

/** @deprecated Use `useEntidadeDocumentTitle` ou `useFallbackDocumentTitle`. */
export function useDedicatedPortalDocumentTitle(
  _portal: PortalId,
  _entityDisplayName?: string | null,
) {
  useFallbackDocumentTitle()
}
