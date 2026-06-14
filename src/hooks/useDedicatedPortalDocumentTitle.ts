import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getPortalDocumentTitle, type PortalId } from '../config/portalHost'

/** Mantém o título da aba fixo por subdomínio dedicado em qualquer rota. */
export function useDedicatedPortalDocumentTitle(portal: PortalId) {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = getPortalDocumentTitle(portal)
  }, [portal, pathname])
}
