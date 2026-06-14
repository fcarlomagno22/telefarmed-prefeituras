import { Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { AdminPasswordRecoveryDrawer } from '../components/admin/login/AdminPasswordRecoveryDrawer'
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
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [recoveryClosing, setRecoveryClosing] = useState(false)

  if (!isBootstrapping && isAuthenticated) {
    return <Navigate to={resolveDefaultAdminHomePath(user)} replace />
  }

  const redirectFrom = (location.state as { from?: string } | null)?.from

  function openRecoveryDrawer() {
    setRecoveryClosing(false)
    setRecoveryOpen(true)
  }

  function closeRecoveryDrawer() {
    setRecoveryClosing(true)
  }

  function handleRecoveryTransitionEnd() {
    if (recoveryClosing) {
      setRecoveryClosing(false)
      setRecoveryOpen(false)
    }
  }

  return (
    <LoginBackdrop tone="admin">
      <main className="relative z-10 flex w-full max-w-lg flex-col items-center px-5 py-10 sm:px-8">
        <LoginForm
          portal="admin"
          variant="overlay"
          showCopyrightInCard
          onForgotPasswordClick={openRecoveryDrawer}
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

      <AdminPasswordRecoveryDrawer
        open={recoveryOpen && !recoveryClosing}
        closing={recoveryClosing}
        onClose={closeRecoveryDrawer}
        onTransitionEnd={handleRecoveryTransitionEnd}
      />
    </LoginBackdrop>
  )
}
