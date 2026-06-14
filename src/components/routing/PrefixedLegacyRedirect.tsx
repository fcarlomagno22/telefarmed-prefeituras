import { Navigate, useLocation } from 'react-router-dom'
import { legacyPrefixedPath, type PortalId } from '../../config/portalHost'

type PrefixedLegacyRedirectProps = {
  portal: PortalId
}

/** `/admin/login` → `/login` quando o portal roda em subdomínio dedicado. */
export function PrefixedLegacyRedirect({ portal }: PrefixedLegacyRedirectProps) {
  const location = useLocation()
  const target = legacyPrefixedPath(portal, location.pathname)
  if (!target) return null
  return <Navigate to={`${target}${location.search}${location.hash}`} replace />
}
