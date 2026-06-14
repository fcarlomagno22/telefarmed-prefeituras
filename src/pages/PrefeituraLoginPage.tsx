import { Navigate } from 'react-router-dom'
import { useState } from 'react'
import { PrefeituraPasswordRecoveryDrawer } from '../components/prefeitura/login/PrefeituraPasswordRecoveryDrawer'
import { LoginBackdrop } from '../components/login/LoginBackdrop'
import { LoginForm } from '../components/login/LoginForm'
import { resolveDefaultPrefeituraHomePath } from '../config/prefeituraPageAccess'
import { usePrefeituraAuth } from '../contexts/PrefeituraAuthContext'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { PrefeituraAuthApiError } from '../lib/services/prefeitura/auth'
import { cpfDigits } from '../utils/cpf'

export function PrefeituraLoginPage() {
  useBrandTheme()
  const { login, isAuthenticated, isBootstrapping, user } = usePrefeituraAuth()
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [recoveryClosing, setRecoveryClosing] = useState(false)

  if (!isBootstrapping && isAuthenticated) {
    return <Navigate to={resolveDefaultPrefeituraHomePath(user)} replace />
  }

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
    <LoginBackdrop tone="prefeitura">
      <main className="relative z-10 flex w-full max-w-lg flex-col items-center px-5 py-10 sm:px-8">
        <LoginForm
          portal="prefeitura"
          variant="overlay"
          showCopyrightInCard
          onForgotPasswordClick={openRecoveryDrawer}
          authenticate={async ({ cpf, password }) => {
            try {
              const loggedUser = await login({
                cpf: cpfDigits(cpf),
                password,
              })
              return { displayName: loggedUser.nome }
            } catch (error) {
              if (error instanceof PrefeituraAuthApiError) {
                throw error
              }
              throw new PrefeituraAuthApiError('Não foi possível concluir o login.', 0)
            }
          }}
        />
      </main>

      <PrefeituraPasswordRecoveryDrawer
        open={recoveryOpen && !recoveryClosing}
        closing={recoveryClosing}
        onClose={closeRecoveryDrawer}
        onTransitionEnd={handleRecoveryTransitionEnd}
      />
    </LoginBackdrop>
  )
}
