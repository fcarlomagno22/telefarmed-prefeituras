import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ProfissionalPlantaoQueueMonitor } from '../profissional/ProfissionalPlantaoQueueMonitor'
import { portals } from '../../config/portals'
import { useProfissionalAuth } from '../../contexts/ProfissionalAuthContext'

export function ProfissionalProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useProfissionalAuth()
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
        to={portals.profissional.loginPath}
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return (
    <>
      <ProfissionalPlantaoQueueMonitor />
      <Outlet />
    </>
  )
}
