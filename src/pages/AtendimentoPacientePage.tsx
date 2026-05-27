import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { PatientConsultationEndConfirmModal } from '../components/attendance/patient/PatientConsultationEndConfirmModal'
import { PatientConsultationChatPanel } from '../components/attendance/patient/PatientConsultationChatPanel'
import { PatientConsultationDocumentsPanel } from '../components/attendance/patient/PatientConsultationDocumentsPanel'
import { PatientConsultationFooter } from '../components/attendance/patient/PatientConsultationFooter'
import { PatientConsultationHeader } from '../components/attendance/patient/PatientConsultationHeader'
import { PatientConsultationInfoSection } from '../components/attendance/patient/PatientConsultationInfoSection'
import { PatientConsultationVideoStage } from '../components/attendance/patient/PatientConsultationVideoStage'
import { useConsultationElapsed } from '../components/attendance/patient/useConsultationElapsed'
import {
  buildAttendanceSessionFromWaitingRoom,
  readAttendanceSession,
  writeAttendanceSession,
  type AttendanceSession,
} from '../data/attendanceSession'
import { readWaitingRoomSession } from '../data/waitingRoomSession'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useConsultationSessionGuard, writeConsultationLockToStorage } from '../hooks/useConsultationSessionGuard'
import { isValidAttendanceId } from '../utils/generateAttendanceId'

function formatDatePill(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatTimePill(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatStartedAtLabel(session: AttendanceSession) {
  const started = new Date(session.startedAtIso)
  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(started)
  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(started)
  return `Início: ${date} às ${time}`
}

export function AtendimentoPacientePage() {
  useBrandTheme()
  const navigate = useNavigate()

  const { attendanceId } = useParams<{ attendanceId: string }>()
  const [now, setNow] = useState(() => new Date())
  const [endConfirmOpen, setEndConfirmOpen] = useState(false)

  const session = useMemo(() => {
    if (!isValidAttendanceId(attendanceId)) return null

    const stored = readAttendanceSession(attendanceId)
    if (stored) return stored

    const built = buildAttendanceSessionFromWaitingRoom(readWaitingRoomSession(), attendanceId)
    writeAttendanceSession(built)
    return built
  }, [attendanceId])

  useConsultationSessionGuard(Boolean(session))

  useEffect(() => {
    if (session) writeConsultationLockToStorage(true)
  }, [session])

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const elapsed = useConsultationElapsed(session?.startedAtIso ?? new Date().toISOString())

  const handleRequestEndConsultation = useCallback(() => {
    setEndConfirmOpen(true)
  }, [])

  const handleConfirmEndConsultation = useCallback(() => {
    setEndConfirmOpen(false)
    writeConsultationLockToStorage(false)
    navigate(`/atendimento/${attendanceId}/avaliacao`)
  }, [attendanceId, navigate])

  const handleSwitchToDoctorView = useCallback(() => {
    navigate(`/atendimento/${attendanceId}/medico`)
  }, [attendanceId, navigate])

  if (!isValidAttendanceId(attendanceId) || !session) {
    return <Navigate to="/sala-de-espera" replace />
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col px-3 sm:px-5">
        <PatientConsultationHeader
          elapsed={elapsed}
          startedAtLabel={formatStartedAtLabel(session)}
          datePill={formatDatePill(now)}
          timePill={formatTimePill(now)}
          onSwitchToDoctorView={handleSwitchToDoctorView}
          onEndConsultation={handleRequestEndConsultation}
        />

        <main className="flex min-h-0 flex-1 flex-col gap-3 pb-3 sm:gap-4 sm:pb-4">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[minmax(400px,2fr)_minmax(160px,0.75fr)] lg:gap-4">
            <PatientConsultationVideoStage
              className="min-h-[320px] lg:col-start-1 lg:row-start-1 lg:min-h-0"
              doctorName={session.doctorName}
              doctorSpecialty={session.doctorSpecialty}
              doctorCrm={session.doctorCrm}
              doctorVideoPosterUrl={session.doctorVideoPosterUrl}
              patientPhotoUrl={session.patientPhotoUrl}
            />

            <PatientConsultationChatPanel className="min-h-[400px] lg:col-start-2 lg:row-start-1 lg:min-h-0 lg:h-full" />

            <PatientConsultationInfoSection
              className="min-h-[160px] lg:col-start-1 lg:row-start-2 lg:h-full"
              session={session}
            />

            <PatientConsultationDocumentsPanel
              className="min-h-[160px] lg:col-start-2 lg:row-start-2 lg:h-full"
              documents={session.consultationDocuments}
            />
          </div>
        </main>

        <PatientConsultationFooter />
      </div>

      <PatientConsultationEndConfirmModal
        open={endConfirmOpen}
        onCancel={() => setEndConfirmOpen(false)}
        onConfirm={handleConfirmEndConsultation}
      />
    </div>
  )
}
