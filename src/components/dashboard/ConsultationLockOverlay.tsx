import { Loader2 } from 'lucide-react'
import lottie from 'lottie-web'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { brand } from '../../config/brand'
import { useConsultationSessionGuard } from '../../hooks/useConsultationSessionGuard'
import {
  ConsultationFeedbackPanel,
  type ConsultationFeedback,
} from './ConsultationFeedbackPanel'
import { NavigationBlockModal } from './NavigationBlockModal'

const doctorAnimationPath = `${import.meta.env.BASE_URL}doctor.json`

type ConsultationLockOverlayProps = {
  active: boolean
  onComplete: () => void
}

export function ConsultationLockOverlay({
  active,
  onComplete,
}: ConsultationLockOverlayProps) {
  const [showFeedback, setShowFeedback] = useState(false)
  const guardActive = active && !showFeedback
  const { showBlockModal, dismissBlockModal } = useConsultationSessionGuard(guardActive)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const visible = active || showFeedback

  useEffect(() => {
    if (active) {
      setShowFeedback(false)
    }
  }, [active])

  useEffect(() => {
    if (!active || showFeedback || !containerRef.current) return

    setIsLoading(true)
    setLoadError(false)

    const container = containerRef.current
    const animation = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: doctorAnimationPath,
    })

    const handleLoaded = () => setIsLoading(false)
    const handleFailed = () => {
      setIsLoading(false)
      setLoadError(true)
    }

    const loadTimeout = window.setTimeout(() => {
      setIsLoading(false)
    }, 20000)

    animation.addEventListener('DOMLoaded', handleLoaded)
    animation.addEventListener('data_failed', handleFailed)

    return () => {
      window.clearTimeout(loadTimeout)
      animation.removeEventListener('DOMLoaded', handleLoaded)
      animation.removeEventListener('data_failed', handleFailed)
      animation.destroy()
      container.innerHTML = ''
    }
  }, [active, showFeedback])

  function handleRequestEnd() {
    dismissBlockModal()
    setShowFeedback(true)
  }

  function handleFeedbackDone(_feedback?: ConsultationFeedback) {
    setShowFeedback(false)
    onComplete()
  }

  if (!visible) return null

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] flex flex-col bg-white px-6">
        <div className="absolute right-6 top-6 sm:right-8 sm:top-8">
          <img
            src={brand.logoUrl}
            alt={brand.appName}
            className="h-10 w-auto max-w-[140px] object-contain object-right sm:h-12 sm:max-w-[160px]"
          />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto py-10">
          {showFeedback ? (
            <ConsultationFeedbackPanel
              onSubmit={handleFeedbackDone}
              onSkip={() => handleFeedbackDone()}
            />
          ) : (
            <div className="flex w-full max-w-md flex-col items-center text-center">
              <div className="relative mx-auto h-[min(280px,38vh)] w-full max-w-[320px]">
                {isLoading && !loadError ? (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white">
                    <Loader2
                      className="h-10 w-10 animate-spin text-[var(--brand-primary)]"
                      strokeWidth={2}
                    />
                    <p className="text-sm text-gray-500">Carregando animação...</p>
                  </div>
                ) : null}
                {loadError ? (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white">
                    <Loader2 className="h-10 w-10 text-[var(--brand-primary)]" strokeWidth={2} />
                    <p className="text-sm text-gray-500">Animação indisponível neste momento.</p>
                  </div>
                ) : null}
                <div
                  ref={containerRef}
                  className="flex h-full min-h-[200px] w-full items-center justify-center [&_svg]:h-full [&_svg]:w-full"
                />
              </div>

              <h2 className="mt-8 text-xl font-bold text-gray-900 sm:text-2xl">
                Aguardando o médico
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
                A sala de espera foi aberta em outra janela. Mantenha esta página aberta até o
                atendimento encerrar.
              </p>

              <button
                type="button"
                onClick={handleRequestEnd}
                className="btn-brand-gradient mt-10 rounded-xl px-8 py-3.5 text-sm font-semibold"
              >
                Encerrar atendimento
              </button>
            </div>
          )}
        </div>
      </div>

      <NavigationBlockModal
        open={showBlockModal}
        onAcknowledge={dismissBlockModal}
        onEndSession={handleRequestEnd}
      />
    </>,
    document.body,
  )
}
