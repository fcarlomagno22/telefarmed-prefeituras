import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  resolveFirstAccessibleUbtPath,
  resolveUbtPageIdFromPath,
  ubtUserCanViewPage,
} from '../../config/ubtPageAccess'
import { useUbtAuth } from '../../contexts/UbtAuthContext'

export function UbtPagePermissionGuard() {
  const { user } = useUbtAuth()
  const location = useLocation()
  const pageId = resolveUbtPageIdFromPath(location.pathname)

  if (!pageId) {
    return <Outlet />
  }

  if (ubtUserCanViewPage(user, pageId)) {
    return <Outlet />
  }

  const fallback = resolveFirstAccessibleUbtPath(user)
  if (fallback && fallback !== location.pathname) {
    return <Navigate to={fallback.replace('/ubt/', '')} replace />
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-lg font-semibold text-gray-900">Acesso não permitido</h1>
      <p className="mt-2 max-w-md text-sm text-gray-600">
        Sua conta não possui permissão para acessar esta área do terminal UBT. Solicite ao
        administrador a liberação da página correspondente.
      </p>
    </div>
  )
}

export function UbtHomeRedirect() {
  const { user } = useUbtAuth()
  const fallback = resolveFirstAccessibleUbtPath(user)

  if (!fallback) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="text-lg font-semibold text-gray-900">Nenhuma página liberada</h1>
        <p className="mt-2 max-w-md text-sm text-gray-600">
          Sua conta está ativa, mas não há páginas com permissão de visualização. Contate um
          administrador da unidade.
        </p>
      </div>
    )
  }

  return <Navigate to={fallback.replace('/ubt/', '')} replace />
}
