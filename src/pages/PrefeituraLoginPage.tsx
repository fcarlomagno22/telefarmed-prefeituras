import { Navigate } from 'react-router-dom'
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

  if (!isBootstrapping && isAuthenticated) {
    return <Navigate to={resolveDefaultPrefeituraHomePath(user)} replace />
  }

  return (
    <LoginBackdrop tone="prefeitura">
      <main className="relative z-10 flex w-full max-w-lg flex-col items-center px-5 py-10 sm:px-8">
        <LoginForm
          portal="prefeitura"
          variant="overlay"
          showCopyrightInCard
          authenticate={async ({ cpf, password }) => {
            try {
              const user = await login({
                cpf: cpfDigits(cpf),
                password,
              })
              return { displayName: user.nome }
            } catch (error) {
              if (error instanceof PrefeituraAuthApiError) {
                throw error
              }
                  throw new PrefeituraAuthApiError('Não foi possível concluir o login.', 0)
            }
          }}
        />
      </main>
    </LoginBackdrop>
  )
}
