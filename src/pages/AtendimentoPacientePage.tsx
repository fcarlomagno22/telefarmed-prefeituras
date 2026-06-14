import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ubtAtendimentoAvaliacaoPath, ubtRoutes } from '../config/ubtRoutes'
import { PatientConsultationEndConfirmModal } from '../components/attendance/patient/PatientConsultationEndConfirmModal'
import { PatientConsultationChatPanel } from '../components/attendance/patient/PatientConsultationChatPanel'
import { PatientConsultationDocumentsPanel } from '../components/attendance/patient/PatientConsultationDocumentsPanel'
import { PatientConsultationFooter } from '../components/attendance/patient/PatientConsultationFooter'
import { PatientConsultationHeader } from '../components/attendance/patient/PatientConsultationHeader'
import { PatientConsultationInfoSection } from '../components/attendance/patient/PatientConsultationInfoSection'
import { PatientConsultationVideoStage } from '../components/attendance/patient/PatientConsultationVideoStage'
import type { ConsultationVideoStageHandle } from '../components/attendance/consultationVideoStageShared'
import { useConsultationElapsed } from '../components/attendance/patient/useConsultationElapsed'
import type { AttendanceSession } from '../data/attendanceSession'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useConsultationSessionGuard, writeConsultationLockToStorage } from '../hooks/useConsultationSessionGuard'
import { usePublicAtendimentoSession, usePublicFilaStatus } from '../hooks/usePublicAtendimentoSession'
import { registrarPacienteEntradaSalaAtendimento } from '../lib/services/public/atendimento'
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
  const token = isValidAttendanceId(attendanceId) ? attendanceId : undefined
  const { attendanceSession, sessao, loading, error, refresh } = usePublicAtendimentoSession(token)
  const { fila } = usePublicFilaStatus(token, { pollingIntervalMs: 3_000 })
  const consultationReady = fila?.readyForConsultation ?? sessao?.readyForConsultation ?? false
  const [now, setNow] = useState(() => new Date())
  const [endConfirmOpen, setEndConfirmOpen] = useState(false)
  const videoStageRef = useRef<ConsultationVideoStageHandle>(null)

  useConsultationSessionGuard(Boolean(attendanceSession))

  useEffect(() => {
    if (!sessao || !attendanceId || loading) return

    if (sessao.consultaStatus === 'aguardando_medico' && !consultationReady) {
      navigate(ubtRoutes.salaDeEspera, { replace: true })
      return
    }

    if (sessao.consultaStatus === 'concluida' || sessao.consultaStatus === 'interrompida') {
      videoStageRef.current?.disconnect()
      writeConsultationLockToStorage(false)
      navigate(ubtAtendimentoAvaliacaoPath(attendanceId), { replace: true })
    }
  }, [attendanceId, consultationReady, loading, navigate, sessao])

  useEffect(() => {
    if (!consultationReady || !token || sessao?.consultaStatus === 'em_andamento') return

    const retryId = window.setInterval(() => {
      void refresh()
    }, 2_000)

    return () => window.clearInterval(retryId)
  }, [consultationReady, refresh, sessao?.consultaStatus, token])

  useEffect(() => {
    if (attendanceSession) writeConsultationLockToStorage(true)
  }, [attendanceSession])

  useEffect(() => {
    if (!token || !sessao || sessao.consultaStatus !== 'em_andamento') return
    void registrarPacienteEntradaSalaAtendimento(token)
  }, [sessao, token])

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const elapsed = useConsultationElapsed(attendanceSession?.startedAtIso ?? new Date().toISOString())

  const handleRequestEndConsultation = useCallback(() => {
    setEndConfirmOpen(true)
  }, [])

  const handleConfirmEndConsultation = useCallback(() => {
    setEndConfirmOpen(false)
    videoStageRef.current?.disconnect()
    writeConsultationLockToStorage(false)
    navigate(ubtAtendimentoAvaliacaoPath(attendanceId))
  }, [attendanceId, navigate])

  if (!token) {
    return <Navigate to={ubtRoutes.salaDeEspera} replace />
  }

  if (loading && !attendanceSession && !consultationReady) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-white text-sm text-gray-600">
        Carregando atendimento…
      </div>
    )
  }

  if ((loading && consultationReady) || (consultationReady && !attendanceSession && !error)) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-white px-6 text-center">
        <p className="text-sm font-medium text-gray-800">Conectando à teleconsulta…</p>
        <p className="text-xs text-gray-500">Aguarde enquanto preparamos sua sala de atendimento.</p>
      </div>
    )
  }

  if (error || !attendanceSession) {
    if (consultationReady) {
      return (
        <div className="flex h-[100dvh] flex-col items-center justify-center gap-3 bg-white px-6 text-center">
          <p className="text-sm font-medium text-gray-800">Conectando à teleconsulta…</p>
          <p className="text-xs text-gray-500">{error ?? 'Sincronizando sessão com o profissional.'}</p>
        </div>
      )
    }
    return <Navigate to={ubtRoutes.salaDeEspera} replace />
  }

  const session = attendanceSession

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col px-3 sm:px-5">
        <PatientConsultationHeader
          elapsed={elapsed}
          startedAtLabel={formatStartedAtLabel(session)}
          datePill={formatDatePill(now)}
          timePill={formatTimePill(now)}
          onEndConsultation={handleRequestEndConsultation}
        />

        <main className="flex min-h-0 flex-1 flex-col gap-3 pb-3 sm:gap-4 sm:pb-4">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[minmax(400px,2fr)_minmax(160px,0.75fr)] lg:gap-4">
            <PatientConsultationVideoStage
              ref={videoStageRef}
              className="min-h-[320px] lg:col-start-1 lg:row-start-1 lg:min-h-0"
              atendimentoToken={token}
              videoEnabled={sessao?.consultaStatus === 'em_andamento'}
              doctorName={session.doctorName}
              doctorSpecialty={session.doctorSpecialty}
              doctorCrm={session.doctorCrm}
              doctorVideoPosterUrl={session.doctorVideoPosterUrl}
              patientPhotoUrl={session.patientPhotoUrl}
            />

            <PatientConsultationChatPanel
              className="min-h-[400px] lg:col-start-2 lg:row-start-1 lg:min-h-0 lg:h-full"
              token={token}
            />

            <PatientConsultationInfoSection
              className="min-h-[160px] lg:col-start-1 lg:row-start-2 lg:h-full"
              session={session}
            />

            <PatientConsultationDocumentsPanel
              className="min-h-[160px] lg:col-start-2 lg:row-start-2 lg:h-full"
              token={token}
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
