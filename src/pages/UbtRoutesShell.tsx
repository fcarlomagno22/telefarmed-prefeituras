import { Outlet } from 'react-router-dom'
import { EntidadeBrandingProvider } from '../contexts/EntidadeBrandingContext'
import { UbtAuthProvider } from '../contexts/UbtAuthContext'

export function UbtRoutesShell() {
  return (
    <UbtAuthProvider>
      <EntidadeBrandingProvider portal="ubt">
        <Outlet />
      </EntidadeBrandingProvider>
    </UbtAuthProvider>
  )
}
