import { usePortalCatalogPrefetch } from '../../hooks/usePortalCatalogPrefetch'
import type { PortalId } from '../../config/portals'

export function PortalCatalogPrefetch({ portal }: { portal: PortalId }) {
  usePortalCatalogPrefetch(portal)
  return null
}
