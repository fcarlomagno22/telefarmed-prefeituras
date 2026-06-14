import { useCallback, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ubtRoutes } from '../config/ubtRoutes'
import { PatientConsultationFeedbackFlow } from '../components/attendance/patient/PatientConsultationFeedbackFlow'
import type { PatientConsultationFeedback } from '../components/attendance/patient/patientConsultationFeedbackTypes'
import { brand } from '../config/brand'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { writeConsultationLockToStorage } from '../hooks/useConsultationSessionGuard'
import { usePublicAvaliacaoSession } from '../hooks/usePublicAvaliacaoSession'
import {
  isPublicAtendimentoApiError,
  registrarPublicAvaliacaoDetalhada,
} from '../lib/services/public/atendimento'
import { clearWaitingRoomSession } from '../data/waitingRoomSession'
import { isValidAttendanceId } from '../utils/generateAttendanceId'

const DEFAULT_DOCTOR_PHOTO =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80'

export function AtendimentoAvaliacaoPage() {
  useBrandTheme()
  const navigate = useNavigate()
  const { attendanceId } = useParams<{ attendanceId: string }>()
  const token = isValidAttendanceId(attendanceId) ? attendanceId : undefined
  const { sessao, loading, error: loadError } = usePublicAvaliacaoSession(token)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const finishFlow = useCallback(() => {
    clearWaitingRoomSession()
    writeConsultationLockToStorage(false)
    navigate(ubtRoutes.triagem, { replace: true })
  }, [navigate])

  async function handleSubmit(feedback: PatientConsultationFeedback) {
    if (!token) return
    setSubmitError(null)

    try {
      await registrarPublicAvaliacaoDetalhada(token, {
        notaProfissional: feedback.doctorRating,
        comentarioProfissional: feedback.doctorComment || undefined,
        notaTeleconsulta: feedback.experienceRating,
        comentarioTeleconsulta: feedback.experienceComment || undefined,
      })
      finishFlow()
    } catch (err) {
      if (isPublicAtendimentoApiError(err)) {
        setSubmitError(err.message)
      } else {
        setSubmitError('Não foi possível enviar a avaliação.')
      }
    }
  }

  if (!token) {
    return <Navigate to={ubtRoutes.salaDeEspera} replace />
  }

  if (loading && !sessao) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white text-sm text-gray-600">
        Carregando…
      </div>
    )
  }

  if (loadError || !sessao) {
    return <Navigate to={ubtRoutes.salaDeEspera} replace />
  }

  if (sessao.avaliacaoEnviada) {
    return <Navigate to={ubtRoutes.salaDeEspera} replace />
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      <header className="shrink-0 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1440px] justify-center sm:justify-start">
          <img
            src={brand.logoUrl}
            alt={brand.appName}
            className="h-10 w-auto max-w-[200px] object-contain"
          />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-8 sm:px-8">
        {submitError ? (
          <p className="mb-4 text-sm font-medium text-red-600" role="alert">
            {submitError}
          </p>
        ) : null}
        <PatientConsultationFeedbackFlow
          professional={{
            photoUrl: sessao.doctorPhotoUrl ?? DEFAULT_DOCTOR_PHOTO,
            name: sessao.doctorName,
            specialty: sessao.doctorSpecialty,
          }}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  )
}
