import { Check } from 'lucide-react'
import lottie from 'lottie-web'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { brand } from '../config/brand'
import { portals, type PortalId } from '../config/portals'
import { useBrandTheme } from '../hooks/useBrandTheme'

const ubtTransitionLottiePath = `${import.meta.env.BASE_URL}online_doctor.json`
const prefeituraTransitionLottiePath = `${import.meta.env.BASE_URL}data_lottie.json`

const STEP_MS = 720
const EXIT_MS = 520

type LoginTransitionLocationState = {
  displayName?: string
  portal?: PortalId
}

function resolvePortal(pathname: string, state: LoginTransitionLocationState | null): PortalId {
  if (state?.portal) return state.portal
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/prefeitura')) return 'prefeitura'
  return 'ubt'
}

export function LoginTransitionPage() {
  useBrandTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const lottieRef = useRef<HTMLDivElement>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isExiting, setIsExiting] = useState(false)
  const [lottieReady, setLottieReady] = useState(false)

  const locationState = location.state as LoginTransitionLocationState | null
  const portal = resolvePortal(location.pathname, locationState)
  const portalConfig = portals[portal]
  const transitionSteps = portalConfig.transitionSteps
  const totalMs = STEP_MS * transitionSteps.length + 480

  const displayName =
    locationState?.displayName?.trim() || brand.dashboardUserName

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }, [])

  const transitionLottiePath =
    portal === 'ubt' ? ubtTransitionLottiePath : prefeituraTransitionLottiePath

  useEffect(() => {
    if (!lottieRef.current) return

    setLottieReady(false)
    const container = lottieRef.current
    const animation = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: transitionLottiePath,
    })

    const handleReady = () => setLottieReady(true)
    animation.addEventListener('DOMLoaded', handleReady)

    return () => {
      animation.removeEventListener('DOMLoaded', handleReady)
      animation.destroy()
      container.innerHTML = ''
    }
  }, [transitionLottiePath])

  useEffect(() => {
    const startedAt = performance.now()
    let frameId = 0

    const tick = (now: number) => {
      const elapsed = now - startedAt
      const nextProgress = Math.min(100, (elapsed / totalMs) * 100)
      setProgress(nextProgress)
      setActiveStep(
        Math.min(transitionSteps.length - 1, Math.floor(elapsed / STEP_MS)),
      )

      if (elapsed < totalMs) {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [totalMs, transitionSteps.length])

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setIsExiting(true), totalMs)
    const navigateTimer = window.setTimeout(() => {
      navigate(portalConfig.homePath, { replace: true })
    }, totalMs + EXIT_MS)

    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(navigateTimer)
    }
  }, [navigate, portalConfig.homePath, totalMs])

  return (
    <div
      className={[
        'relative flex min-h-screen flex-col overflow-hidden bg-[#fafbfc]',
        isExiting ? 'login-transition-page-exit' : '',
      ].join(' ')}
      aria-live="polite"
      aria-busy={!isExiting}
    >
      <div
        className="login-transition-orb pointer-events-none absolute -left-24 top-[8%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,107,0,0.22)_0%,transparent_68%)] blur-2xl"
        aria-hidden
      />
      <div
        className="login-transition-orb pointer-events-none absolute -right-20 bottom-[12%] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.18)_0%,transparent_70%)] blur-2xl"
        style={{ animationDelay: '-3s' }}
        aria-hidden
      />
      <div
        className="login-transition-orb pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,107,0,0.08)_0%,transparent_62%)] blur-3xl"
        style={{ animationDelay: '-1.5s' }}
        aria-hidden
      />

      <header className="relative z-10 flex justify-center px-6 pt-8 sm:pt-10">
        <img
          src={brand.logoUrl}
          alt={brand.appName}
          className="login-transition-fade-up h-10 w-auto max-w-[160px] object-contain sm:h-11"
          style={{ animationDelay: '0.05s' }}
        />
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-10 pt-4">
        <div
          className="login-transition-fade-up relative mx-auto w-full max-w-lg text-center"
          style={{ animationDelay: '0.12s' }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
            {greeting}, {displayName}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {portalConfig.transitionTitle}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            {portalConfig.transitionSubtitle}
          </p>
        </div>

        <div
          className="login-transition-fade-up relative mt-8 flex h-[min(300px,42vh)] w-full max-w-[340px] items-center justify-center"
          style={{ animationDelay: '0.2s' }}
        >
          <span
            className="login-transition-ring absolute inset-6 rounded-full border border-[var(--brand-primary)]/25"
            aria-hidden
          />
          <span
            className="login-transition-ring absolute inset-2 rounded-full border border-orange-200/60"
            style={{ animationDelay: '-0.9s' }}
            aria-hidden
          />
          <div
            className={[
              'relative z-10 flex h-full w-full items-center justify-center transition-opacity duration-700',
              lottieReady ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          >
            <div
              ref={lottieRef}
              className="h-full w-full [&_svg]:mx-auto [&_svg]:h-full [&_svg]:max-h-[min(300px,42vh)] [&_svg]:w-auto"
            />
          </div>
        </div>

        <div
          className="login-transition-fade-up mt-8 w-full max-w-md"
          style={{ animationDelay: '0.28s' }}
        >
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-500">
            <span>Carregando ambiente</span>
            <span className="tabular-nums text-[var(--brand-primary)]">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100 shadow-inner">
            <div
              className="login-transition-shimmer h-full rounded-full transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <ul
          className="login-transition-fade-up mt-6 w-full max-w-md space-y-2"
          style={{ animationDelay: '0.34s' }}
        >
          {transitionSteps.map((step, index) => {
            const done = index < activeStep
            const current = index === activeStep

            return (
              <li
                key={step}
                className={[
                  'flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-300',
                  done
                    ? 'border-emerald-100 bg-emerald-50/90 text-emerald-800'
                    : current
                      ? 'border-[var(--brand-primary)]/30 bg-[var(--brand-primary-light)] text-gray-800 shadow-[0_4px_16px_rgba(255,107,0,0.12)]'
                      : 'border-transparent bg-white/50 text-gray-400',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors',
                    done
                      ? 'bg-emerald-500 text-white'
                      : current
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'bg-gray-100 text-gray-400',
                  ].join(' ')}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
                </span>
                <span className={current ? 'font-semibold' : 'font-medium'}>{step}</span>
                {current ? (
                  <span className="ml-auto flex gap-1" aria-hidden>
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand-primary)]"
                        style={{ animationDelay: `${dot * 0.15}s` }}
                      />
                    ))}
                  </span>
                ) : null}
              </li>
            )
          })}
        </ul>
      </main>
    </div>
  )
}
