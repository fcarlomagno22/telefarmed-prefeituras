import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { crmPartnersRoutes } from '../../config/crmPartnersRoutes'
import { useCrmPartnersAuth } from '../../contexts/CrmPartnersAuthContext'

export function CrmPartnersProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useCrmPartnersAuth()
  const location = useLocation()

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6f8]">
        <p className="text-sm font-medium text-gray-500">Validando sessão...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate to={crmPartnersRoutes.login} replace state={{ from: location.pathname }} />
    )
  }

  return <Outlet />
}
