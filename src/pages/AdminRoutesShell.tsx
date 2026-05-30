import { Outlet } from 'react-router-dom'
import { AdminAuthProvider } from '../contexts/AdminAuthContext'

export function AdminRoutesShell() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  )
}
