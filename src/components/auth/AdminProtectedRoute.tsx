import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { portals } from '../../config/portals'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

export function AdminProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAdminAuth()
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
      <Navigate
        to={portals.admin.loginPath}
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return <Outlet />
}
