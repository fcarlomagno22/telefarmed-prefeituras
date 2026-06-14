import { Navigate, useLocation } from 'react-router-dom'
import { profissionalRoutes } from '../config/profissionalRoutes'

export function MinhaCandidaturaPage() {
  const location = useLocation()

  return (
    <Navigate
      to={profissionalRoutes.login}
      replace
      state={{ ...(location.state as object), openMinhaCandidatura: true }}
    />
  )
}
