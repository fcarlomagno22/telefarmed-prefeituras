import { useCallback } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { PatientConsultationFeedbackFlow } from '../components/attendance/patient/PatientConsultationFeedbackFlow'
import type { PatientConsultationFeedback } from '../components/attendance/patient/patientConsultationFeedbackTypes'
import { readAttendanceSession } from '../data/attendanceSession'
import { brand } from '../config/brand'
import { ubtRoutes } from '../config/ubtRoutes'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { writeConsultationLockToStorage } from '../hooks/useConsultationSessionGuard'
import { isValidAttendanceId } from '../utils/generateAttendanceId'

export function AtendimentoAvaliacaoPage() {
  useBrandTheme()
  const navigate = useNavigate()
  const { attendanceId } = useParams<{ attendanceId: string }>()

  const session = isValidAttendanceId(attendanceId)
    ? readAttendanceSession(attendanceId)
    : null

  const finishFlow = useCallback(() => {
    writeConsultationLockToStorage(false)
    navigate(ubtRoutes.triagem, { replace: true })
  }, [navigate])

  function handleSubmit(_feedback: PatientConsultationFeedback) {
    finishFlow()
  }

  if (!isValidAttendanceId(attendanceId) || !session) {
    return <Navigate to="/sala-de-espera" replace />
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
        <PatientConsultationFeedbackFlow
          professional={{
            photoUrl: session.doctorPhotoUrl,
            name: session.doctorName,
            specialty: session.doctorSpecialty,
          }}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  )
}
