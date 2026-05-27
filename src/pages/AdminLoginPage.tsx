import { LoginBackdrop } from '../components/login/LoginBackdrop'
import { LoginForm } from '../components/login/LoginForm'
import { useBrandTheme } from '../hooks/useBrandTheme'

export function AdminLoginPage() {
  useBrandTheme()

  return (
    <LoginBackdrop tone="admin">
      <main className="relative z-10 flex w-full max-w-lg flex-col items-center px-5 py-10 sm:px-8">
        <LoginForm portal="admin" variant="overlay" showCopyrightInCard />
      </main>
    </LoginBackdrop>
  )
}
