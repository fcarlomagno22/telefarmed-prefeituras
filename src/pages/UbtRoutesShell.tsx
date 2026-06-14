import { Outlet } from 'react-router-dom'
import { UbtAuthProvider } from '../contexts/UbtAuthContext'

export function UbtRoutesShell() {
  return (
    <UbtAuthProvider>
      <Outlet />
    </UbtAuthProvider>
  )
}
