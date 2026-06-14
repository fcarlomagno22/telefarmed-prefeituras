import { Navigate } from 'react-router-dom'
import { FeaturePanel } from '../components/login/FeaturePanel'
import { LoginForm } from '../components/login/LoginForm'
import { brand } from '../config/brand'
import { resolveDefaultUbtHomePath } from '../config/ubtPageAccess'
import { useUbtAuth } from '../contexts/UbtAuthContext'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { UbtAuthApiError } from '../lib/services/ubt/auth'
import { cpfDigits } from '../utils/cpf'

export function UbtLoginPage() {
  useBrandTheme()
  const { login, isAuthenticated, isBootstrapping, user } = useUbtAuth()

  if (!isBootstrapping && isAuthenticated) {
    return <Navigate to={resolveDefaultUbtHomePath(user)} replace />
  }

  return (
    <div className="flex min-h-screen bg-[#f5f6f8] lg:flex-row">
      <FeaturePanel />

      <main className="relative flex min-h-screen flex-1 flex-col overflow-hidden">
        <div className="relative z-10 flex flex-1 flex-col px-6 py-8 sm:px-12 lg:px-14 lg:py-12 xl:px-20">
          <header className="mx-auto w-full max-w-lg pt-2 text-center lg:pt-4">
            <h1 className="text-base font-bold leading-snug text-[var(--brand-primary)] sm:text-[17px] lg:text-lg">
              {brand.headline}
            </h1>
            <p className="mx-auto mt-1.5 max-w-md text-[11px] leading-relaxed text-gray-500 sm:text-xs">
              {brand.subheadline}
            </p>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center py-6">
            <LoginForm
              portal="ubt"
              authenticate={async ({ cpf, password }) => {
                try {
                  const authUser = await login({
                    cpf: cpfDigits(cpf),
                    password: password.trim(),
                  })
                  return { displayName: authUser.nome }
                } catch (error) {
                  if (error instanceof UbtAuthApiError) {
                    throw error
                  }
                  throw new UbtAuthApiError('Não foi possível concluir o login.', 0)
                }
              }}
            />
          </div>
        </div>

        <footer className="relative z-10 shrink-0 pb-5 text-center text-[11px] text-gray-400 sm:text-xs">
          {brand.copyright}
        </footer>
      </main>
    </div>
  )
}
