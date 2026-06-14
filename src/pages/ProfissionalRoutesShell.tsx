import { Outlet } from 'react-router-dom'
import { ProfissionalAuthProvider } from '../contexts/ProfissionalAuthContext'

export function ProfissionalRoutesShell() {
  return (
    <ProfissionalAuthProvider>
      <Outlet />
    </ProfissionalAuthProvider>
  )
}
