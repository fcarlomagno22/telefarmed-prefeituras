import { Outlet } from 'react-router-dom'
import { EntidadeBrandingProvider } from '../contexts/EntidadeBrandingContext'
import { PrefeituraAuthProvider } from '../contexts/PrefeituraAuthContext'

export function PrefeituraRoutesShell() {
  return (
    <PrefeituraAuthProvider>
      <EntidadeBrandingProvider portal="prefeitura">
        <Outlet />
      </EntidadeBrandingProvider>
    </PrefeituraAuthProvider>
  )
}
