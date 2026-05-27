import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck, X } from 'lucide-react'
import lottie, { type AnimationItem } from 'lottie-web'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { PinInput } from '../../../ui/PinInput'

const passwordLottiePath = `${import.meta.env.BASE_URL}Password.json`
const pinLottiePath = `${import.meta.env.BASE_URL}pin_code.json`

const MIN_ACCESS_PASSWORD_LENGTH = 8

export type ResponsibleAccessCredentials = {
  accessPassword: string
  authorizationPin: string
}

type ModalPhase = 'password' | 'pin'

type ResponsibleAccessCredentialsModalProps = {
  open: boolean
  responsibleName?: string
  onClose: () => void
  onComplete: (credentials: ResponsibleAccessCredentials) => void
}

function useLottiePanel(animationPath: string, active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<AnimationItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!active || !containerRef.current) return

    setLoading(true)
    setFailed(false)

    const container = containerRef.current
    const animation = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: animationPath,
    })

    animationRef.current = animation

    const handleLoaded = () => setLoading(false)
    const handleFailed = () => {
      setLoading(false)
      setFailed(true)
    }

    const loadTimeout = window.setTimeout(() => setLoading(false), 8000)
    animation.addEventListener('DOMLoaded', handleLoaded)
    animation.addEventListener('data_failed', handleFailed)

    return () => {
      window.clearTimeout(loadTimeout)
      animation.removeEventListener('DOMLoaded', handleLoaded)
      animation.removeEventListener('data_failed', handleFailed)
      animation.destroy()
      animationRef.current = null
      container.innerHTML = ''
    }
  }, [active, animationPath])

  return { containerRef, loading, failed }
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
  placeholder,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  visible: boolean
  onToggleVisible: () => void
  placeholder: string
  autoComplete?: string
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1 block text-xs font-semibold text-gray-800">{label}</span>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-gray-200 py-2 pl-3 pr-10 text-sm text-gray-800 outline-none transition focus:border-[var(--brand-primary)]/40 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  )
}

export function ResponsibleAccessCredentialsModal({
  open,
  responsibleName,
  onClose,
  onComplete,
}: ResponsibleAccessCredentialsModalProps) {
  const [phase, setPhase] = useState<ModalPhase>('password')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pin, setPin] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [pinVisible, setPinVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordLottie = useLottiePanel(passwordLottiePath, open && phase === 'password')
  const pinLottie = useLottiePanel(pinLottiePath, open && phase === 'pin')

  useEffect(() => {
    if (!open) return
    setPhase('password')
    setPassword('')
    setConfirmPassword('')
    setPin('')
    setPasswordVisible(false)
    setConfirmVisible(false)
    setPinVisible(false)
    setError(null)
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (password.length < MIN_ACCESS_PASSWORD_LENGTH) {
      setError(`A senha de acesso deve ter pelo menos ${MIN_ACCESS_PASSWORD_LENGTH} caracteres.`)
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem. Digite novamente.')
      return
    }

    setPhase('pin')
    setPin('')
    setPinVisible(false)
  }

  function handlePinSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (pin.length !== 6) {
      setError('Informe a senha de autorização com 6 dígitos.')
      return
    }

    onComplete({ accessPassword: password, authorizationPin: pin })
    onClose()
  }

  if (!open) return null

  const titleId = 'responsible-access-credentials-title'
  const isPasswordPhase = phase === 'password'
  const lottie = isPasswordPhase ? passwordLottie : pinLottie
  const PhaseIcon = isPasswordPhase ? KeyRound : ShieldCheck

  const headline = isPasswordPhase
    ? 'Senha de acesso à plataforma'
    : 'Senha de autorização'

  const subtitle = isPasswordPhase
    ? responsibleName?.trim()
      ? `Defina o login de ${responsibleName.trim()} no painel da unidade.`
      : 'Crie a senha que o responsável usará para entrar no painel da unidade.'
    : 'Senha numérica de 6 dígitos para autorizar ações sensíveis na unidade.'

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-900/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="relative flex max-h-[min(94vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.2)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="shrink-0 border-b border-gray-100 bg-gradient-to-b from-[var(--brand-primary-light)]/50 to-white px-5 pb-4 pt-5 text-center">
          <div className="mb-3 flex justify-center gap-2">
            <span
              className={[
                'rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide',
                isPasswordPhase
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'bg-gray-100 text-gray-500',
              ].join(' ')}
            >
              1 · Acesso
            </span>
            <span
              className={[
                'rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide',
                !isPasswordPhase
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'bg-gray-100 text-gray-500',
              ].join(' ')}
            >
              2 · Autorização
            </span>
          </div>

          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
            <PhaseIcon className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <h2 id={titleId} className="text-lg font-bold text-gray-900">
            {headline}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>

        <div className="relative mx-auto w-full shrink-0 overflow-hidden bg-gradient-to-b from-[var(--brand-primary-light)]/30 via-white to-gray-50">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_40%,rgba(255,107,0,0.14)_0%,transparent_72%)]"
            aria-hidden
          />

          {lottie.loading && !lottie.failed ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" strokeWidth={2} />
              <p className="text-xs text-gray-500">Carregando animação…</p>
            </div>
          ) : null}

          {lottie.failed ? (
            <div className="flex min-h-[200px] items-center justify-center py-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]">
                <PhaseIcon className="h-12 w-12" strokeWidth={1.5} />
              </div>
            </div>
          ) : null}

          <div
            ref={lottie.containerRef}
            className={[
              'flex min-h-[200px] w-full items-center justify-center px-8 py-4 [&_svg]:h-full [&_svg]:max-h-[220px] [&_svg]:w-auto',
              lottie.loading || lottie.failed ? 'hidden' : '',
            ].join(' ')}
            aria-hidden
          />
        </div>

        {isPasswordPhase ? (
          <form onSubmit={handlePasswordSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
            <div className="space-y-3">
              <PasswordField
                id="responsible-access-password"
                label="Senha de acesso"
                value={password}
                onChange={setPassword}
                visible={passwordVisible}
                onToggleVisible={() => setPasswordVisible((prev) => !prev)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
              <PasswordField
                id="responsible-access-password-confirm"
                label="Confirmar senha"
                value={confirmPassword}
                onChange={setConfirmPassword}
                visible={confirmVisible}
                onToggleVisible={() => setConfirmVisible((prev) => !prev)}
                placeholder="Repita a senha de acesso"
                autoComplete="new-password"
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="btn-brand-gradient mt-auto w-full rounded-xl py-3.5 text-sm font-semibold"
            >
              Continuar para autorização
            </button>
          </form>
        ) : (
          <form onSubmit={handlePinSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
            <PinInput
              id="responsible-authorization-pin"
              label="Senha de autorização (6 dígitos)"
              value={pin}
              onChange={(next) => {
                setPin(next)
                setError(null)
              }}
              visible={pinVisible}
              onToggleVisible={() => setPinVisible((prev) => !prev)}
              error={Boolean(error)}
              autoFocus
            />

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="mt-auto flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setPhase('password')
                  setPin('')
                  setError(null)
                }}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={pin.length !== 6}
                className="btn-brand-gradient w-full rounded-xl py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
              >
                Salvar senhas
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
