import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  adminUserCanViewPage,
  resolveAdminPageIdFromPath,
  resolveFirstAccessibleAdminPath,
} from '../../config/adminPageAccess'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

export function AdminPagePermissionGuard() {
  const { user } = useAdminAuth()
  const location = useLocation()
  const pageId = resolveAdminPageIdFromPath(location.pathname)

  if (!pageId) {
    return <Outlet />
  }

  if (adminUserCanViewPage(user, pageId)) {
    return <Outlet />
  }

  const fallback = resolveFirstAccessibleAdminPath(user)
  if (fallback && fallback !== location.pathname) {
    return <Navigate to={fallback} replace />
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-lg font-semibold text-gray-900">Acesso não permitido</h1>
      <p className="mt-2 max-w-md text-sm text-gray-600">
        Sua conta não possui permissão para acessar esta área do painel administrativo.
        Solicite ao administrador a liberação da página correspondente.
      </p>
    </div>
  )
}

export function AdminHomeRedirect() {
  const { user } = useAdminAuth()
  const fallback = resolveFirstAccessibleAdminPath(user)

  if (!fallback) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="text-lg font-semibold text-gray-900">Nenhuma página liberada</h1>
        <p className="mt-2 max-w-md text-sm text-gray-600">
          Sua conta está ativa, mas não há páginas com permissão de visualização. Contate um
          administrador master.
        </p>
      </div>
    )
  }

  return <Navigate to={fallback.replace('/admin/', '')} replace />
}
