import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  profissionalUserCanViewPage,
  resolveFirstAccessibleProfissionalPath,
  resolveProfissionalPageIdFromPath,
} from '../../config/profissionalPageAccess'
import { useProfissionalAuth } from '../../contexts/ProfissionalAuthContext'

export function ProfissionalPagePermissionGuard() {
  const { user } = useProfissionalAuth()
  const location = useLocation()
  const pageId = resolveProfissionalPageIdFromPath(location.pathname)

  if (!pageId) {
    return <Outlet />
  }

  if (profissionalUserCanViewPage(user, pageId)) {
    return <Outlet />
  }

  const fallback = resolveFirstAccessibleProfissionalPath(user)
  if (fallback && fallback !== location.pathname) {
    return <Navigate to={fallback.replace('/profissional/', '')} replace />
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-lg font-semibold text-gray-900">Acesso não permitido</h1>
      <p className="mt-2 max-w-md text-sm text-gray-600">
        Sua conta não possui permissão para acessar esta área do portal profissional. Solicite ao
        administrador a liberação da página correspondente.
      </p>
    </div>
  )
}

export function ProfissionalHomeRedirect() {
  const { user } = useProfissionalAuth()
  const fallback = resolveFirstAccessibleProfissionalPath(user)

  if (!fallback) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="text-lg font-semibold text-gray-900">Nenhuma página liberada</h1>
        <p className="mt-2 max-w-md text-sm text-gray-600">
          Sua conta está ativa, mas não há páginas com permissão de visualização. Contate o suporte
          da Telefarmed.
        </p>
      </div>
    )
  }

  return <Navigate to={fallback.replace('/profissional/', '')} replace />
}
