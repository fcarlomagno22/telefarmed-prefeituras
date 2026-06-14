import { Eye, EyeOff, IdCard, Lock } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { brand } from '../../config/brand'
import { portals, type PortalId } from '../../config/portals'
import { isValidCpf } from '../../utils/cpf'
import { maskCpf } from '../../utils/masks'

type LoginFormProps = {
  onSubmit?: (credentials: { cpf: string; password: string }) => void
  /** Autenticação real (ex.: painel admin). Só navega após sucesso. */
  authenticate?: (credentials: {
    cpf: string
    password: string
  }) => Promise<{ displayName: string }>
  /** Card sobre foto de fundo com filtro (login centralizado). */
  variant?: 'default' | 'overlay'
  portal?: PortalId
  /** Exibe o copyright no rodapé do card (login centralizado). */
  showCopyrightInCard?: boolean
  onForgotPasswordClick?: () => void
  /** Conteúdo extra abaixo de "Esqueceu sua senha?" (ex.: links do portal profissional). */
  cardFooter?: ReactNode
}

const cardClassByVariant = {
  default:
    'border-white/60 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.08),0_24px_64px_rgba(0,0,0,0.06)] ring-gray-900/[0.04]',
  overlay:
    'animate-login-card-in border-white/25 bg-white/[0.94] shadow-[0_4px_24px_rgba(0,0,0,0.12),0_24px_64px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.9)] ring-white/40 backdrop-blur-2xl',
} as const

export function LoginForm({
  onSubmit,
  authenticate,
  variant = 'default',
  portal = 'ubt',
  showCopyrightInCard = false,
  cardFooter,
  onForgotPasswordClick,
}: LoginFormProps) {
  const navigate = useNavigate()
  const portalConfig = portals[portal]
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

    setIsLoading(true)
    try {
      onSubmit?.({ cpf, password })

      let displayName =
        portal === 'profissional'
          ? brand.profissionalDashboardUserName
          : brand.dashboardUserName

      if (authenticate) {
        const result = await authenticate({ cpf, password })
        displayName = result.displayName
      }

      navigate(portalConfig.transitionPath, {
        state: {
          displayName,
          portal,
        },
      })
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
        'w-full max-w-md rounded-3xl border px-8 py-9 ring-1 sm:px-10 sm:py-11',
        cardClassByVariant[variant],
      ].join(' ')}
    >
      <div className="mb-6 flex justify-center">
        <img
          src={brand.logoUrl}
          alt={brand.appName}
          className="h-14 w-auto max-w-[240px] object-contain"
        />
      </div>

      <header className="mb-7 text-center">
        <h2 className="text-sm font-semibold text-gray-800 sm:text-[15px]">
          {portalConfig.welcomeTitle}
        </h2>
        <p className="mt-1.5 text-xs text-gray-500">{portalConfig.welcomeSubtitle}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="sr-only">CPF</span>
          <span className="relative flex items-center">
            <IdCard
              className="pointer-events-none absolute left-4 h-5 w-5 text-[var(--brand-primary)]"
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
                  : 'border-gray-200/80 focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/15',
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
          className="mt-2 w-full rounded-xl bg-[var(--brand-primary)] py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)] hover:shadow-[0_6px_20px_rgba(255,107,0,0.4)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center">
        {onForgotPasswordClick ? (
          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-primary)] transition hover:underline"
          >
            <Lock className="h-3.5 w-3.5" strokeWidth={2} />
            Esqueceu sua senha?
          </button>
        ) : (
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-primary)] transition hover:underline"
            onClick={(e) => e.preventDefault()}
          >
            <Lock className="h-3.5 w-3.5" strokeWidth={2} />
            Esqueceu sua senha?
          </a>
        )}
      </p>

      {cardFooter ? (
        <>
          <div className="mt-6 border-t border-gray-200/80" aria-hidden />
          <div className="mt-5 text-center text-sm leading-relaxed text-gray-600">{cardFooter}</div>
        </>
      ) : null}

      {showCopyrightInCard ? (
        <p className="mt-6 border-t border-gray-200/80 pt-5 text-center text-[11px] font-medium text-gray-400 sm:text-xs">
          {brand.copyright}
        </p>
      ) : null}
    </div>
  )
}
