import { LoginBackdrop } from '../components/login/LoginBackdrop'
import { LoginForm } from '../components/login/LoginForm'
import { useBrandTheme } from '../hooks/useBrandTheme'

export function PrefeituraLoginPage() {
  useBrandTheme()

  return (
    <LoginBackdrop tone="prefeitura">
      <main className="relative z-10 flex w-full max-w-lg flex-col items-center px-5 py-10 sm:px-8">
        <LoginForm portal="prefeitura" variant="overlay" showCopyrightInCard />
      </main>
    </LoginBackdrop>
  )
}
