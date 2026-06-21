import { Loader2 } from 'lucide-react'
import lottie from 'lottie-web'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PoweredByTelefarmed } from '../brand/PoweredByTelefarmed'
import { useEntidadeBranding } from '../../contexts/EntidadeBrandingContext'
import { readWaitingRoomSession } from '../../data/waitingRoomSession'
import { useConsultationSessionGuard } from '../../hooks/useConsultationSessionGuard'
import { useUbtAuth } from '../../contexts/UbtAuthContext'
import {
  isUbtConsultasApiError,
  registrarUbtConsultaAvaliacao,
} from '../../lib/services/ubt/consultas'
import { releaseRh3Elegibilidad } from '../../lib/services/ubt/rh3'
import {
  ConsultationFeedbackPanel,
  type ConsultationFeedback,
} from './ConsultationFeedbackPanel'

const doctorAnimationPath = `${import.meta.env.BASE_URL}doctor.json`

type ConsultationLockOverlayProps = {
  active: boolean
  onComplete: () => void
  /** CPF do paciente — remove elegibilidade RH3 ao encerrar. */
  patientCpf?: string
  /** Sem token de consulta local (ex.: teleconsulta RH3 no encaixe). */
  skipFeedback?: boolean
  /** Empilhamento acima de drawers/modais (padrão: 200). */
  stackZIndex?: number
}

export function ConsultationLockOverlay({
  active,
  onComplete,
  patientCpf,
  skipFeedback = false,
  stackZIndex = 200,
}: ConsultationLockOverlayProps) {
  const { getAccessToken } = useUbtAuth()
  const { logoUrl, displayName } = useEntidadeBranding()
  const [showFeedback, setShowFeedback] = useState(false)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const guardActive = active && !showFeedback
  useConsultationSessionGuard(guardActive, { onBlocked: () => {} })
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const visible = active || showFeedback

  useEffect(() => {
    if (active) {
      setShowFeedback(false)
      setFeedbackError(null)
    }
  }, [active])

  function finishOverlay() {
    setShowFeedback(false)
    setFeedbackError(null)
    onComplete()
  }

  async function releaseRh3PatientElegibilidad() {
    const document = patientCpf?.replace(/\D/g, '') ?? ''
    if (document.length !== 11) return

    const accessToken = getAccessToken()
    if (!accessToken) return

    try {
      await releaseRh3Elegibilidad(accessToken, document)
    } catch {
      // Encerramento local segue mesmo se a Doc24 falhar.
    }
  }

  async function completeOverlaySession() {
    await releaseRh3PatientElegibilidad()
    finishOverlay()
  }

  async function handleFeedbackSubmit(feedback: ConsultationFeedback) {
    const accessToken = getAccessToken()
    const codigo = readWaitingRoomSession()?.token
    if (!accessToken || !codigo) {
      setFeedbackError('Sessão de atendimento não encontrada. Tente encerrar novamente.')
      return
    }

    setIsSubmittingFeedback(true)
    setFeedbackError(null)
    try {
      await registrarUbtConsultaAvaliacao(
        accessToken,
        codigo,
        feedback.rating,
        feedback.comment || undefined,
      )
      await completeOverlaySession()
    } catch (error) {
      const message = isUbtConsultasApiError(error)
        ? error.message
        : 'Não foi possível registrar a avaliação.'
      setFeedbackError(message)
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

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
    setFeedbackError(null)
    if (skipFeedback) {
      void completeOverlaySession()
      return
    }
    setShowFeedback(true)
  }

  function handleFeedbackSkip() {
    void completeOverlaySession()
  }

  if (!visible) return null

  return createPortal(
    <div
      className="fixed inset-0 flex flex-col bg-white px-6"
      style={{ zIndex: stackZIndex }}
    >
      <div className="absolute right-6 top-6 sm:right-8 sm:top-8">
        <img
          src={logoUrl}
          alt={displayName}
          className="h-10 w-auto max-w-[140px] object-contain object-right sm:h-12 sm:max-w-[160px]"
        />
      </div>

      <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8">
        <PoweredByTelefarmed />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto py-10">
          {showFeedback ? (
            <div className="flex w-full max-w-md flex-col items-center">
              <ConsultationFeedbackPanel
                onSubmit={(feedback) => void handleFeedbackSubmit(feedback)}
                onSkip={handleFeedbackSkip}
                allowSkip={!isSubmittingFeedback}
                isSubmitting={isSubmittingFeedback}
              />
              {feedbackError ? (
                <p
                  role="alert"
                  className="mt-4 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
                >
                  {feedbackError}
                </p>
              ) : null}
              {isSubmittingFeedback ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando avaliação…
                </p>
              ) : null}
            </div>
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
                O paciente está na sala de espera virtual. Mantenha esta página aberta até o
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
    </div>,
    document.body,
  )
}
