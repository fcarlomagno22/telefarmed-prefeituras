import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  prefeituraUserCanViewPage,
  resolvePrefeituraPageIdFromPath,
  resolveFirstAccessiblePrefeituraPath,
} from '../../config/prefeituraPageAccess'
import { usePrefeituraAuth } from '../../contexts/PrefeituraAuthContext'
import { stripPortalPrefix } from '../../utils/sidebarNavPath'

export function PrefeituraPagePermissionGuard() {
  const { user } = usePrefeituraAuth()
  const location = useLocation()
  const pageId = resolvePrefeituraPageIdFromPath(location.pathname)

  if (!pageId) {
    return <Outlet />
  }

  if (prefeituraUserCanViewPage(user, pageId)) {
    return <Outlet />
  }

  const fallback = resolveFirstAccessiblePrefeituraPath(user)
  const normalizedFallback = fallback ? stripPortalPrefix(fallback) : null
  const normalizedPath = stripPortalPrefix(location.pathname)
  if (normalizedFallback && normalizedFallback !== normalizedPath) {
    return <Navigate to={normalizedFallback} replace />
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-lg font-semibold text-gray-900">Acesso não permitido</h1>
      <p className="mt-2 max-w-md text-sm text-gray-600">
        Sua conta não possui permissão para acessar esta área do portal. Solicite ao
        administrador a liberação da página correspondente.
      </p>
    </div>
  )
}

export function PrefeituraHomeRedirect() {
  const { user } = usePrefeituraAuth()
  const fallback = resolveFirstAccessiblePrefeituraPath(user)

  if (!fallback) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="text-lg font-semibold text-gray-900">Nenhuma página liberada</h1>
        <p className="mt-2 max-w-md text-sm text-gray-600">
          Sua conta está ativa, mas não há páginas com permissão de visualização. Contate um
          administrador municipal.
        </p>
      </div>
    )
  }

  return <Navigate to={stripPortalPrefix(fallback)} replace />
}
