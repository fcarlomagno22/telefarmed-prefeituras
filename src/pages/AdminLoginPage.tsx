import { Navigate, useLocation } from 'react-router-dom'
import { LoginBackdrop } from '../components/login/LoginBackdrop'
import { LoginForm } from '../components/login/LoginForm'
import {
  adminUserCanViewPage,
  resolveAdminPageIdFromPath,
  resolveDefaultAdminHomePath,
} from '../config/adminPageAccess'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { setAdminPostLoginRedirect } from '../lib/auth/adminPostLoginRedirect'
import { AdminAuthApiError } from '../lib/services/admin/auth'
import { cpfDigits } from '../utils/cpf'

export function AdminLoginPage() {
  useBrandTheme()
  const location = useLocation()
  const { login, isAuthenticated, isBootstrapping, user } = useAdminAuth()

  if (!isBootstrapping && isAuthenticated) {
    return <Navigate to={resolveDefaultAdminHomePath(user)} replace />
  }

  const redirectFrom = (location.state as { from?: string } | null)?.from

  return (
    <LoginBackdrop tone="admin">
      <main className="relative z-10 flex w-full max-w-lg flex-col items-center px-5 py-10 sm:px-8">
        <LoginForm
          portal="admin"
          variant="overlay"
          showCopyrightInCard
          authenticate={async ({ cpf, password }) => {
            try {
              const loggedUser = await login({
                cpf: cpfDigits(cpf),
                password,
              })

              if (redirectFrom) {
                const pageId = resolveAdminPageIdFromPath(redirectFrom)
                if (pageId && adminUserCanViewPage(loggedUser, pageId)) {
                  setAdminPostLoginRedirect(redirectFrom)
                }
              }

              return { displayName: loggedUser.nome }
            } catch (error) {
              if (error instanceof AdminAuthApiError) {
                throw error
              }
              throw new AdminAuthApiError('Não foi possível concluir o login.', 0)
            }
          }}
        />
      </main>
    </LoginBackdrop>
  )
}
