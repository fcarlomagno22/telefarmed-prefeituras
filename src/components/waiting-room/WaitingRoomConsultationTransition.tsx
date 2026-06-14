import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Video } from 'lucide-react'

export const CONSULTATION_COUNTDOWN_SECONDS = 10
export const CONSULTATION_REVEAL_AT_SECONDS = 5

type RevealPhase = 'idle' | 'fade' | 'travel' | 'center' | 'ready'

type WaitingRoomConsultationTransitionProps = {
  onEnterConsultation?: () => void
  readyForConsultation?: boolean
  countdownSessionKey?: string
  children: (api: {
    revealPhase: RevealPhase
    countdownAnchorRef: React.RefObject<HTMLDivElement | null>
    secondsLeft: number
    contentFaded: boolean
  }) => React.ReactNode
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export function WaitingRoomConsultationTransition({
  onEnterConsultation,
  readyForConsultation = false,
  countdownSessionKey,
  children,
}: WaitingRoomConsultationTransitionProps) {
  const reducedMotion = prefersReducedMotion()
  const countdownAnchorRef = useRef<HTMLDivElement>(null)
  const revealStartedRef = useRef(false)
  const pendingReadyRef = useRef(false)
  const secondsLeftRef = useRef(CONSULTATION_COUNTDOWN_SECONDS)

  const [revealPhase, setRevealPhase] = useState<RevealPhase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(CONSULTATION_COUNTDOWN_SECONDS)
  const [flyOrigin, setFlyOrigin] = useState<{ top: number; left: number; width: number } | null>(
    null,
  )
  const [flyToCenter, setFlyToCenter] = useState(false)

  const contentFaded = revealPhase !== 'idle'

  const beginReveal = useCallback(() => {
    if (revealStartedRef.current) return
    revealStartedRef.current = true

    const rect = countdownAnchorRef.current?.getBoundingClientRect()

    if (reducedMotion) {
      setFlyOrigin({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        width: Math.min(440, window.innerWidth - 32),
      })
      setFlyToCenter(true)
      setRevealPhase('fade')
      window.setTimeout(() => {
        if (secondsLeftRef.current <= 0) setRevealPhase('ready')
        else setRevealPhase('center')
      }, 480)
      return
    }

    if (rect) {
      setFlyOrigin({
        top: rect.top,
        left: rect.left,
        width: rect.width,
      })
    }

    setRevealPhase('fade')

    window.setTimeout(() => {
      setRevealPhase('travel')
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setFlyToCenter(true))
      })
    }, 420)
  }, [reducedMotion])

  useEffect(() => {
    if (!readyForConsultation) return

    if (countdownSessionKey) {
      try {
        if (sessionStorage.getItem(countdownSessionKey) === '1') {
          secondsLeftRef.current = 0
          setSecondsLeft(0)
          revealStartedRef.current = true
          setRevealPhase('ready')
          return
        }
      } catch {
        // sessionStorage indisponível
      }
    }

    secondsLeftRef.current = CONSULTATION_COUNTDOWN_SECONDS
    setSecondsLeft(CONSULTATION_COUNTDOWN_SECONDS)
    revealStartedRef.current = false
    setRevealPhase('idle')
    setFlyToCenter(false)
    setFlyOrigin(null)

    const id = window.setInterval(() => {
      setSecondsLeft((current) => {
        const next = Math.max(0, current - 1)
        secondsLeftRef.current = next

        if (next === CONSULTATION_REVEAL_AT_SECONDS && !revealStartedRef.current) {
          window.queueMicrotask(() => beginReveal())
        }

        return next
      })
    }, 1000)

    return () => window.clearInterval(id)
  }, [countdownSessionKey, readyForConsultation, beginReveal])

  useEffect(() => {
    if (secondsLeft !== 0) return
    if (revealPhase === 'center' || revealPhase === 'ready') {
      setRevealPhase('ready')
      pendingReadyRef.current = false
      return
    }
    if (revealPhase !== 'idle') {
      pendingReadyRef.current = true
    }
  }, [secondsLeft, revealPhase])

  function handleFlyTransitionEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (event.propertyName !== 'transform') return
    if (!flyToCenter || revealPhase !== 'travel') return

    if (pendingReadyRef.current || secondsLeft <= 0) {
      setRevealPhase('ready')
      pendingReadyRef.current = false
      return
    }

    setRevealPhase('center')
  }

  useEffect(() => {
    if (revealPhase !== 'travel' || flyToCenter) return

    const fallback = window.setTimeout(() => {
      if (pendingReadyRef.current || secondsLeft <= 0) setRevealPhase('ready')
      else setRevealPhase('center')
    }, 1600)

    return () => window.clearTimeout(fallback)
  }, [revealPhase, flyToCenter, secondsLeft])

  const showFloatingCountdown = revealPhase !== 'ready' && revealPhase !== 'idle'

  const floatingCard =
    flyOrigin && revealPhase !== 'idle' ? (
      <div
        className="pointer-events-none fixed inset-0 z-[240]"
        aria-hidden={revealPhase !== 'ready' && revealPhase !== 'center'}
      >
        <div
          className={[
            'waiting-room-fly-card pointer-events-auto rounded-xl border border-orange-200/80',
            'bg-gradient-to-r from-orange-50 via-white to-orange-50 px-6 py-6 text-center shadow-[0_24px_60px_rgba(255,107,0,0.22)]',
            revealPhase === 'ready' ? 'waiting-room-fly-card--ready' : '',
          ].join(' ')}
          style={{
            position: 'fixed',
            top: flyToCenter || revealPhase === 'center' || revealPhase === 'ready' ? '50%' : flyOrigin.top,
            left: flyToCenter || revealPhase === 'center' || revealPhase === 'ready' ? '50%' : flyOrigin.left,
            width:
              flyToCenter || revealPhase === 'center' || revealPhase === 'ready'
                ? 'min(440px, calc(100vw - 2rem))'
                : flyOrigin.width,
            transform:
              flyToCenter || revealPhase === 'center' || revealPhase === 'ready'
                ? 'translate(-50%, -50%)'
                : 'translate(0, 0)',
            transition: flyToCenter
              ? 'top 1.05s cubic-bezier(0.22, 0.85, 0.28, 1), left 1.05s cubic-bezier(0.22, 0.85, 0.28, 1), width 0.95s cubic-bezier(0.22, 0.85, 0.28, 1), transform 1.05s cubic-bezier(0.22, 0.85, 0.28, 1), box-shadow 0.5s ease'
              : 'none',
          }}
          onTransitionEnd={handleFlyTransitionEnd}
        >
          {revealPhase === 'ready' ? (
            <div className="waiting-room-cta-in flex flex-col items-center gap-4 py-2">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-[var(--brand-primary)]">
                <Video className="h-7 w-7" strokeWidth={2} />
              </span>
              <div>
                <p className="text-lg font-bold text-gray-900">Seu atendimento está disponível</p>
                <p className="mt-1.5 text-sm text-gray-600">
                  O profissional está pronto para recebê-lo(a) na teleconsulta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (countdownSessionKey) {
                    try {
                      sessionStorage.setItem(countdownSessionKey, '1')
                    } catch {
                      // ignore
                    }
                  }
                  onEnterConsultation?.()
                }}
                className="btn-brand-gradient w-full max-w-sm rounded-xl px-8 py-3.5 text-sm font-semibold sm:text-base"
              >
                Iniciar Consulta
              </button>
            </div>
          ) : showFloatingCountdown ? (
            <div className="py-1">
              <p className="text-sm font-semibold text-gray-800">Sua consulta iniciará em</p>
              <p className="mt-2 flex items-baseline justify-center gap-2">
                <span
                  className="text-4xl font-extrabold tabular-nums tracking-tight text-[var(--brand-primary)] sm:text-5xl"
                  aria-live="polite"
                  aria-atomic
                >
                  {secondsLeft}
                </span>
                <span className="text-base font-bold text-gray-600 sm:text-lg">
                  {secondsLeft === 1 ? 'segundo' : 'segundos'}
                </span>
              </p>
            </div>
          ) : null}
        </div>
      </div>
    ) : null

  return (
    <>
      {children({
        revealPhase,
        countdownAnchorRef,
        secondsLeft,
        contentFaded,
      })}
      {typeof document !== 'undefined' && floatingCard
        ? createPortal(floatingCard, document.body)
        : null}
    </>
  )
}

type ConsultationCountdownProps = {
  secondsLeft: number
  hidden?: boolean
}

export function ConsultationCountdown({ secondsLeft, hidden = false }: ConsultationCountdownProps) {
  if (hidden) {
    return <div className="mt-3 h-[88px] w-full" aria-hidden />
  }

  return (
    <div className="mt-3 w-full rounded-xl border border-orange-200/80 bg-gradient-to-r from-orange-50 via-white to-orange-50 px-4 py-4 text-center">
      <p className="text-sm font-semibold text-gray-800">Sua consulta iniciará em</p>
      <p className="mt-2 flex items-baseline justify-center gap-2">
        <span
          className="text-4xl font-extrabold tabular-nums tracking-tight text-[var(--brand-primary)] sm:text-5xl"
          aria-live="polite"
          aria-atomic
        >
          {secondsLeft}
        </span>
        <span className="text-base font-bold text-gray-600 sm:text-lg">
          {secondsLeft === 1 ? 'segundo' : 'segundos'}
        </span>
      </p>
    </div>
  )
}
