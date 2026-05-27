import { Loader2, X, type LucideIcon } from 'lucide-react'
import lottie, { type AnimationItem } from 'lottie-web'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { LGPD_UNIT_ACCESS_PIN } from '../../config/lgpd'
import { PinInput } from '../ui/PinInput'

const lockAnimationPath = `${import.meta.env.BASE_URL}locked.json`

export type PinUnlockModalProps = {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  title: string
  titleId: string
  description: string
  submitLabel: string
  pinCompleteHint?: string
  icon: LucideIcon
}

function statusMessage(
  pinLength: number,
  hasError: boolean,
  pinCompleteHint: string,
) {
  if (hasError) return 'Senha incorreta. Tente novamente.'
  if (pinLength === 0) return 'Digite a senha de 6 dígitos do responsável pela unidade.'
  if (pinLength < 6) return `Faltam ${6 - pinLength} dígito${6 - pinLength === 1 ? '' : 's'}.`
  return pinCompleteHint
}

export function PinUnlockModal({
  open,
  onClose,
  onSuccess,
  title,
  titleId,
  description,
  submitLabel,
  pinCompleteHint = 'Senha completa. Confirme para continuar.',
  icon: Icon,
}: PinUnlockModalProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [pinVisible, setPinVisible] = useState(false)
  const [isLoadingLottie, setIsLoadingLottie] = useState(true)
  const [lottieFailed, setLottieFailed] = useState(false)

  const lottieContainerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<AnimationItem | null>(null)

  const resetState = useCallback(() => {
    setPin('')
    setError(false)
    setPinVisible(false)
  }, [])

  useEffect(() => {
    if (!open) {
      resetState()
      return
    }
    resetState()
  }, [open, resetState])

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

  useEffect(() => {
    if (!open || !lottieContainerRef.current) return

    setIsLoadingLottie(true)
    setLottieFailed(false)

    const container = lottieContainerRef.current
    const animation = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: lockAnimationPath,
    })

    animationRef.current = animation

    const handleLoaded = () => setIsLoadingLottie(false)
    const handleFailed = () => {
      setIsLoadingLottie(false)
      setLottieFailed(true)
    }

    const loadTimeout = window.setTimeout(() => setIsLoadingLottie(false), 8000)

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
  }, [open])

  useEffect(() => {
    const animation = animationRef.current
    if (!animation || !open) return

    if (pin.length === 6 && !error) {
      animation.setSpeed(1.35)
    } else {
      animation.setSpeed(1)
    }
  }, [pin.length, error, open])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (pin.length !== 6) return

    if (pin === LGPD_UNIT_ACCESS_PIN) {
      setError(false)
      animationRef.current?.goToAndPlay(26, true)
      window.setTimeout(() => {
        onSuccess()
        onClose()
      }, 550)
      return
    }

    setError(true)
    setPin('')
    animationRef.current?.goToAndPlay(0, true)
  }

  if (!open) return null

  const message = statusMessage(pin.length, error, pinCompleteHint)
  const messageTone = error
    ? 'text-red-600'
    : pin.length === 6
      ? 'text-emerald-600'
      : 'text-gray-500'

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-gray-200 px-5 pb-3 pt-5 text-center">
          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <h2 id={titleId} className="text-base font-bold text-gray-900">
            {title}
          </h2>
          <p className={`mt-1.5 text-sm transition-colors ${messageTone}`}>{message}</p>
        </div>

        <div className="relative mx-auto aspect-[4/3] w-full max-h-[min(36vh,280px)] overflow-hidden bg-gradient-to-b from-[var(--brand-primary-light)] via-white to-gray-50">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,rgba(255,107,0,0.12)_0%,transparent_70%)]"
            aria-hidden
          />

          {isLoadingLottie && !lottieFailed ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/60">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" strokeWidth={2} />
              <p className="text-xs text-gray-500">Carregando...</p>
            </div>
          ) : null}

          {lottieFailed ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]">
                <Icon className="h-12 w-12" strokeWidth={1.5} />
              </div>
            </div>
          ) : null}

          <div
            ref={lottieContainerRef}
            className="flex h-full min-h-[180px] w-full items-center justify-center px-6 py-4 [&_svg]:h-full [&_svg]:max-h-[220px] [&_svg]:w-auto"
            aria-hidden
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <p className="text-center text-xs leading-relaxed text-gray-500">{description}</p>

          <PinInput
            value={pin}
            onChange={(next) => {
              setPin(next)
              setError(false)
            }}
            visible={pinVisible}
            onToggleVisible={() => setPinVisible((prev) => !prev)}
            error={error}
            autoFocus
          />

          <button
            type="submit"
            disabled={pin.length !== 6}
            className="btn-brand-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitLabel}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
