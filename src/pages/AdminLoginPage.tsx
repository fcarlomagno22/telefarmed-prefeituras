import { Navigate } from 'react-router-dom'
import { LoginBackdrop } from '../components/login/LoginBackdrop'
import { LoginForm } from '../components/login/LoginForm'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { resolveDefaultAdminHomePath } from '../config/adminPageAccess'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { AdminAuthApiError } from '../lib/api/adminAuthApi'
import { cpfDigits } from '../utils/cpf'

export function AdminLoginPage() {
  useBrandTheme()
  const { login, isAuthenticated, isBootstrapping, user } = useAdminAuth()

  if (!isBootstrapping && isAuthenticated) {
    return <Navigate to={resolveDefaultAdminHomePath(user)} replace />
  }

  return (
    <LoginBackdrop tone="admin">
      <main className="relative z-10 flex w-full max-w-lg flex-col items-center px-5 py-10 sm:px-8">
        <LoginForm
          portal="admin"
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
              if (error instanceof AdminAuthApiError) {
                throw error
              }
              throw new AdminAuthApiError(
                'Não foi possível conectar ao servidor. Verifique se a API está em execução.',
                0,
              )
            }
          }}
        />
      </main>
    </LoginBackdrop>
  )
}
