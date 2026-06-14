import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ubtRoutes } from '../../config/ubtRoutes'
import { useUbtAuth } from '../../contexts/UbtAuthContext'

export function UbtProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useUbtAuth()
  const location = useLocation()

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm font-medium text-gray-500">Validando sessão...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate to={ubtRoutes.login} replace state={{ from: location.pathname }} />
    )
  }

  return <Outlet />
}
