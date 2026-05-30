import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ConsultationChatPanel } from '../components/attendance/ConsultationChatPanel'
import {
  ConsultationDocumentsPanel,
  type ConsultationDocumentItem,
} from '../components/attendance/ConsultationDocumentsPanel'
import { DoctorConsultationEndConfirmModal } from '../components/attendance/doctor/DoctorConsultationEndConfirmModal'
import { DoctorConsultationHeader } from '../components/attendance/doctor/DoctorConsultationHeader'
import { DoctorConsultationStatusFooter } from '../components/attendance/doctor/DoctorConsultationStatusFooter'
import { DoctorConsultationVideoStage } from '../components/attendance/doctor/DoctorConsultationVideoStage'
import { buildDoctorRecordPatientProfile } from '../components/attendance/doctor/doctorRecordPatient'
import { DoctorExamRequestModal } from '../components/attendance/doctor/DoctorExamRequestModal'
import { DoctorPrescriptionModal } from '../components/attendance/doctor/DoctorPrescriptionModal'
import { DoctorPatientRecordPanel } from '../components/attendance/doctor/DoctorPatientRecordPanel'
import {
  DOCTOR_CONSULTATION_PAGE_BG,
  doctorConsultationCardClass,
} from '../components/attendance/doctor/doctorConsultationUi'
import { useConsultationElapsed } from '../components/attendance/patient/useConsultationElapsed'
import { Toast } from '../components/ui/Toast'
import { profissionalRoutes } from '../config/profissionalRoutes'
import { ubtRoutes } from '../config/ubtRoutes'
import { appendConsultationDocument, removeConsultationDocument } from '../data/attendanceSession'
import {
  buildAttendanceSessionFromWaitingRoom,
  readAttendanceSession,
  writeAttendanceSession,
  type AttendanceSession,
} from '../data/attendanceSession'
import { createExamOrderDocument, createPrescriptionDocument } from '../data/consultationDocuments'
import {
  completeProfissionalQueueAttendance,
  isProfissionalAttendanceOrigin,
} from '../data/profissionalQueueStore'
import { readWaitingRoomSession } from '../data/waitingRoomSession'
import { useBrandTheme } from '../hooks/useBrandTheme'
import {
  useConsultationSessionGuard,
  writeConsultationLockToStorage,
} from '../hooks/useConsultationSessionGuard'
import { isValidAttendanceId } from '../utils/generateAttendanceId'

const DOCTOR_NAV_BLOCK_TOAST_MESSAGE =
  'Para sair, clique em Finalizar consulta. Voltar, recarregar ou trocar de página não é permitido durante o atendimento.'

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

export function AtendimentoMedicoPage() {
  useBrandTheme()
  const navigate = useNavigate()
  const { attendanceId } = useParams<{ attendanceId: string }>()
  const [examRequestOpen, setExamRequestOpen] = useState(false)
  const [prescriptionOpen, setPrescriptionOpen] = useState(false)
  const [consultationDocuments, setConsultationDocuments] = useState<ConsultationDocumentItem[]>([])
  const [navBlockToastVisible, setNavBlockToastVisible] = useState(false)
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false)
  const allowLeaveRef = useRef(false)

  const session = useMemo(() => {
    if (!isValidAttendanceId(attendanceId)) return null

    const stored = readAttendanceSession(attendanceId)
    if (stored) return stored

    const built = buildAttendanceSessionFromWaitingRoom(readWaitingRoomSession(), attendanceId)
    writeAttendanceSession(built)
    return built
  }, [attendanceId])

  const guardActive = Boolean(session)

  const showNavBlockToast = useCallback(() => {
    setNavBlockToastVisible(true)
  }, [])

  const dismissNavBlockToast = useCallback(() => {
    setNavBlockToastVisible(false)
  }, [])

  useConsultationSessionGuard(guardActive, {
    onBlocked: showNavBlockToast,
    allowNavigationRef: allowLeaveRef,
  })

  useEffect(() => {
    if (session) writeConsultationLockToStorage(true)
  }, [session])

  useEffect(() => {
    if (!session) {
      setConsultationDocuments([])
      return
    }
    setConsultationDocuments(session.consultationDocuments)
  }, [session?.id, session?.consultationDocuments])

  const elapsed = useConsultationElapsed(session?.startedAtIso ?? new Date().toISOString())

  const handleRequestFinishConsultation = useCallback(() => {
    setFinishConfirmOpen(true)
  }, [])

  const handleConfirmFinishConsultation = useCallback(() => {
    setFinishConfirmOpen(false)
    allowLeaveRef.current = true
    writeConsultationLockToStorage(false)

    const fromProfissional = isProfissionalAttendanceOrigin()

    if (attendanceId) {
      completeProfissionalQueueAttendance(attendanceId)
    }

    if (fromProfissional) {
      navigate(profissionalRoutes.agenda, {
        replace: true,
        state: { agendaTab: 'fila' },
      })
      return
    }
    navigate(ubtRoutes.consultas, { replace: true })
  }, [attendanceId, navigate])

  const handleSwitchToPatientView = useCallback(() => {
    showNavBlockToast()
  }, [showNavBlockToast])

  const handleExamRequestSigned = useCallback(() => {
    if (!session) return
    const updated = appendConsultationDocument(session, createExamOrderDocument())
    setConsultationDocuments(updated.consultationDocuments)
  }, [session])

  const handlePrescriptionSigned = useCallback(() => {
    if (!session) return
    const updated = appendConsultationDocument(session, createPrescriptionDocument())
    setConsultationDocuments(updated.consultationDocuments)
  }, [session])

  const handleDeleteConsultationDocument = useCallback(
    (documentId: string) => {
      if (!session) return
      const updated = removeConsultationDocument(session, documentId)
      setConsultationDocuments(updated.consultationDocuments)
    },
    [session],
  )

  if (!isValidAttendanceId(attendanceId) || !session) {
    return (
      <Navigate
        to={
          isProfissionalAttendanceOrigin()
            ? profissionalRoutes.agenda
            : ubtRoutes.consultas
        }
        replace
      />
    )
  }

  const patientAge = '28 anos'
  const patientGender = 'Feminino'
  const patientAgeGender = `${patientAge} • ${patientGender}`

  const patientBirthDateIso = session.patientBirthDateIso ?? '1998-03-15'
  const patientCity = session.patientCity ?? 'Campinas, SP'

  const recordPatientProfile = buildDoctorRecordPatientProfile({
    patientName: session.patientName,
    patientPhotoUrl: session.patientPhotoUrl,
    patientBirthDateIso,
    patientCity,
  })

  return (
    <div
      className="flex h-[100dvh] flex-col overflow-hidden"
      style={{ backgroundColor: DOCTOR_CONSULTATION_PAGE_BG }}
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col px-3 sm:px-5">
        <DoctorConsultationHeader
          elapsed={elapsed}
          startedAtLabel={formatStartedAtLabel(session)}
          onSwitchToPatientView={handleSwitchToPatientView}
          onFinishConsultation={handleRequestFinishConsultation}
          onRequestExam={() => setExamRequestOpen(true)}
          onIssuePrescription={() => setPrescriptionOpen(true)}
        />

        <main className="flex min-h-0 flex-1 flex-col gap-3 pb-3 sm:gap-4 sm:pb-4">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[minmax(400px,2fr)_minmax(160px,0.75fr)] lg:gap-4">
            <DoctorConsultationVideoStage
              className="min-h-[320px] lg:col-start-1 lg:row-start-1 lg:min-h-0"
              patientName={session.patientName}
              patientCpfMasked={session.patientCpfMasked}
              patientAgeGender={patientAgeGender}
              patientVideoPosterUrl={session.patientPhotoUrl}
              doctorPhotoUrl={session.doctorPhotoUrl}
            />

            <ConsultationChatPanel
              viewerRole="doctor"
              cardClassName={doctorConsultationCardClass}
              className="min-h-[400px] lg:col-start-2 lg:row-start-1 lg:min-h-0 lg:h-full"
            />

            <DoctorPatientRecordPanel
              className="min-h-[160px] lg:col-start-1 lg:row-start-2 lg:h-full"
              doctorSpecialty={session.doctorSpecialty}
              doctorName={session.doctorName}
              patient={recordPatientProfile}
            />

            <ConsultationDocumentsPanel
              cardClassName={doctorConsultationCardClass}
              className="min-h-[160px] lg:col-start-2 lg:row-start-2 lg:h-full"
              documents={consultationDocuments}
              onDeleteDocument={handleDeleteConsultationDocument}
            />
          </div>

          <DoctorConsultationStatusFooter />
        </main>
      </div>

      <DoctorExamRequestModal
        open={examRequestOpen}
        onClose={() => setExamRequestOpen(false)}
        onSigned={handleExamRequestSigned}
        patient={{
          name: session.patientName,
          cpfMasked: session.patientCpfMasked,
          photoUrl: session.patientPhotoUrl,
          ageGenderLabel: patientAgeGender,
        }}
        doctor={{
          name: session.doctorName,
          specialty: session.doctorSpecialty,
          crm: session.doctorCrm,
        }}
      />

      <DoctorPrescriptionModal
        open={prescriptionOpen}
        onClose={() => setPrescriptionOpen(false)}
        onSigned={handlePrescriptionSigned}
        patient={{
          name: session.patientName,
          cpfMasked: session.patientCpfMasked,
          photoUrl: session.patientPhotoUrl,
          ageGenderLabel: patientAgeGender,
        }}
        doctor={{
          name: session.doctorName,
          specialty: session.doctorSpecialty,
          crm: session.doctorCrm,
        }}
      />

      <DoctorConsultationEndConfirmModal
        open={finishConfirmOpen}
        patientName={session.patientName}
        onCancel={() => setFinishConfirmOpen(false)}
        onConfirm={handleConfirmFinishConsultation}
      />

      <Toast
        message={DOCTOR_NAV_BLOCK_TOAST_MESSAGE}
        visible={navBlockToastVisible}
        onClose={dismissNavBlockToast}
        variant="error"
        durationMs={5500}
      />
    </div>
  )
}
