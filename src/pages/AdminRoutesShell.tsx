import { Outlet } from 'react-router-dom'
import { AdminAuthProvider } from '../contexts/AdminAuthContext'
import { useFallbackDocumentTitle } from '../hooks/useAppDocumentTitle'

function AdminDocumentTitle() {
  useFallbackDocumentTitle()
  return null
}

export function AdminRoutesShell() {
  return (
    <AdminAuthProvider>
      <AdminDocumentTitle />
      <Outlet />
    </AdminAuthProvider>
  )
}
