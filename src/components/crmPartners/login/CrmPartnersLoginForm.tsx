import { Eye, EyeOff, IdCard, Lock } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { brand } from '../../../config/brand'
import { crmPartnersBrand, crmPartnersRoutes } from '../../../config/crmPartnersRoutes'
import { isValidCpf } from '../../../utils/cpf'
import { maskCpf } from '../../../utils/masks'

type CrmPartnersLoginFormProps = {
  authenticate?: (credentials: {
    cpf: string
    password: string
  }) => Promise<{ displayName: string }>
  onForgotPasswordClick: () => void
}

export function CrmPartnersLoginForm({
  authenticate,
  onForgotPasswordClick,
}: CrmPartnersLoginFormProps) {
  const navigate = useNavigate()
  const [cpf, setCpf] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [cpfTouched, setCpfTouched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const cpfInvalid = cpfTouched && cpf.length > 0 && !isValidCpf(cpf)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCpfTouched(true)
    setSubmitError(null)
    if (!isValidCpf(cpf)) return
    if (!password.trim()) {
      setSubmitError('Informe sua senha.')
      return
    }

    setIsLoading(true)
    try {
      if (authenticate) {
        await authenticate({ cpf, password })
      }

      navigate(crmPartnersRoutes.dashboard, { replace: true })
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Não foi possível entrar. Tente novamente.'
      setSubmitError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={[
        'animate-login-card-in w-full max-w-md rounded-3xl border px-6 py-8 sm:px-8 sm:py-9 lg:px-10 lg:py-11',
        'border-white/30 bg-white/80 shadow-[0_4px_24px_rgba(0,0,0,0.1),0_24px_64px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.75)] ring-1 ring-white/35 backdrop-blur-xl',
        'lg:border-white/60 lg:bg-white lg:shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08),0_24px_64px_rgba(0,0,0,0.06)] lg:ring-gray-900/[0.04] lg:backdrop-blur-none',
      ].join(' ')}
    >
      <div className="mb-6 flex justify-center">
        <img
          src={brand.logoUrl}
          alt={brand.appName}
          className="h-12 w-auto max-w-[220px] object-contain sm:h-14 sm:max-w-[240px]"
        />
      </div>

      <header className="mb-7 text-center">
        <h1 className="text-sm font-semibold text-gray-800 sm:text-[15px]">
          {crmPartnersBrand.welcomeTitle}
        </h1>
        <p className="mt-1.5 text-xs text-gray-500">{crmPartnersBrand.welcomeSubtitle}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="sr-only">CPF</span>
          <span className="relative flex items-center">
            <IdCard
              className="pointer-events-none absolute left-4 h-5 w-5 text-orange-500"
              strokeWidth={1.75}
            />
            <input
              type="text"
              name="cpf"
              inputMode="numeric"
              autoComplete="username"
              placeholder="CPF"
              value={cpf}
              onChange={(e) => setCpf(maskCpf(e.target.value))}
              onBlur={() => setCpfTouched(true)}
              maxLength={14}
              required
              aria-invalid={cpfInvalid}
              className={[
                'w-full rounded-xl border bg-gray-50/50 py-3.5 pl-12 pr-4 text-gray-800 outline-none transition placeholder:text-gray-400 focus:bg-white focus:ring-2',
                cpfInvalid
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-200/60'
                  : 'border-gray-200/80 focus:border-orange-500 focus:ring-orange-500/15',
              ].join(' ')}
            />
          </span>
          {cpfInvalid ? (
            <p className="mt-1.5 text-xs text-red-600">
              Informe um CPF válido com 11 dígitos.
            </p>
          ) : null}
        </label>

        <label className="block">
          <span className="sr-only">Senha</span>
          <span className="relative flex items-center">
            <Lock
              className="pointer-events-none absolute left-4 h-5 w-5 text-orange-500"
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
              className="w-full rounded-xl border border-gray-200/80 bg-gray-50/50 py-3.5 pl-12 pr-12 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-4 text-gray-400 transition hover:text-gray-600"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </span>
        </label>

        {submitError ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-700"
          >
            {submitError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading || !isValidCpf(cpf)}
          className="mt-2 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(249,115,22,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center">
        <button
          type="button"
          onClick={onForgotPasswordClick}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 transition hover:underline"
        >
          <Lock className="h-3.5 w-3.5" strokeWidth={2} />
          Esqueceu sua senha?
        </button>
      </p>

      <p className="mt-6 border-t border-gray-200/80 pt-5 text-center text-[11px] font-medium text-gray-400 sm:text-xs">
        {brand.copyright}
      </p>
    </div>
  )
}
