import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getPortalDocumentTitle, resolvePortalDocumentTitle, type PortalId } from '../config/portalHost'

/** Mantém o título da aba por portal; usa nome da entidade quando informado. */
export function useDedicatedPortalDocumentTitle(
  portal: PortalId,
  entityDisplayName?: string | null,
) {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = entityDisplayName
      ? resolvePortalDocumentTitle(portal, entityDisplayName)
      : getPortalDocumentTitle(portal)
  }, [portal, entityDisplayName, pathname])
}
