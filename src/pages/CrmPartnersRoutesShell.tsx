import { Outlet } from 'react-router-dom'
import { CrmPartnersAuthProvider } from '../contexts/CrmPartnersAuthContext'
import { useFallbackDocumentTitle } from '../hooks/useAppDocumentTitle'

function CrmPartnersDocumentTitle() {
  useFallbackDocumentTitle()
  return null
}

export function CrmPartnersRoutesShell() {
  return (
    <CrmPartnersAuthProvider>
      <CrmPartnersDocumentTitle />
      <Outlet />
    </CrmPartnersAuthProvider>
  )
}
