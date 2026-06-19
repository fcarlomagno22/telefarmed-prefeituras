import { Outlet } from 'react-router-dom'
import { ProfissionalAuthProvider } from '../contexts/ProfissionalAuthContext'
import { useFallbackDocumentTitle } from '../hooks/useAppDocumentTitle'

function ProfissionalDocumentTitle() {
  useFallbackDocumentTitle()
  return null
}

export function ProfissionalRoutesShell() {
  return (
    <ProfissionalAuthProvider>
      <ProfissionalDocumentTitle />
      <Outlet />
    </ProfissionalAuthProvider>
  )
}
