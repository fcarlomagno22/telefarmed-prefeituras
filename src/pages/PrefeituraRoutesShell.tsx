import { Outlet } from 'react-router-dom'
import { PrefeituraAuthProvider } from '../contexts/PrefeituraAuthContext'

export function PrefeituraRoutesShell() {
  return (
    <PrefeituraAuthProvider>
      <Outlet />
    </PrefeituraAuthProvider>
  )
}
