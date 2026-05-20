import { Eye, EyeOff, Lock, User } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { brand } from '../../config/brand'

type LoginFormProps = {
  onSubmit?: (credentials: { username: string; password: string }) => void
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    try {
      onSubmit?.({ username, password })
      navigate('/triagem')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white px-8 py-9 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08),0_24px_64px_rgba(0,0,0,0.06)] ring-1 ring-gray-900/[0.04] sm:px-10 sm:py-11">
      <div className="mb-6 flex justify-center">
        <img
          src={brand.logoUrl}
          alt={brand.appName}
          className="h-14 w-auto max-w-[240px] object-contain"
        />
      </div>

      <header className="mb-7 text-center">
        <h2 className="text-sm font-semibold text-gray-800 sm:text-[15px]">
          {brand.welcomeTitle}
        </h2>
        <p className="mt-1.5 text-xs text-gray-500">{brand.welcomeSubtitle}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="sr-only">Usuário</span>
          <span className="relative flex items-center">
            <User
              className="pointer-events-none absolute left-4 h-5 w-5 text-[var(--brand-primary)]"
              strokeWidth={1.75}
            />
            <input
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200/80 bg-gray-50/50 py-3.5 pl-12 pr-4 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/15"
            />
          </span>
        </label>

        <label className="block">
          <span className="sr-only">Senha</span>
          <span className="relative flex items-center">
            <Lock
              className="pointer-events-none absolute left-4 h-5 w-5 text-[var(--brand-primary)]"
              strokeWidth={1.75}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200/80 bg-gray-50/50 py-3.5 pl-12 pr-12 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 text-gray-400 transition hover:text-gray-600"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </span>
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 w-full rounded-xl bg-[var(--brand-primary)] py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)] hover:shadow-[0_6px_20px_rgba(255,107,0,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center">
        <a
          href="#"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-primary)] transition hover:underline"
          onClick={(e) => e.preventDefault()}
        >
          <Lock className="h-3.5 w-3.5" strokeWidth={2} />
          Esqueceu sua senha?
        </a>
      </p>
    </div>
  )
}
