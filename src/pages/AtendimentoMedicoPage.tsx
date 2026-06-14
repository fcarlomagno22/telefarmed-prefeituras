import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ConsultationDocumentsPanel } from '../components/attendance/ConsultationDocumentsPanel'
import { DoctorConsultationChatPanel } from '../components/attendance/doctor/DoctorConsultationChatPanel'
import { DoctorConsultationEndConfirmModal } from '../components/attendance/doctor/DoctorConsultationEndConfirmModal'
import { DoctorConsultationHeader } from '../components/attendance/doctor/DoctorConsultationHeader'
import { DoctorConsultationStatusFooter } from '../components/attendance/doctor/DoctorConsultationStatusFooter'
import { DoctorConsultationVideoStage } from '../components/attendance/doctor/DoctorConsultationVideoStage'
import type { ConsultationVideoStageHandle } from '../components/attendance/consultationVideoStageShared'
import { buildDoctorRecordPatientProfile } from '../components/attendance/doctor/doctorRecordPatient'
import { DoctorAtestadoModal } from '../components/attendance/doctor/DoctorAtestadoModal'
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
import type { ExamCatalogItem } from '../data/doctorExamRequestMock'
import {
  completeProfissionalQueueAttendance,
  isProfissionalAttendanceOrigin,
} from '../data/profissionalQueueStore'
import { useProfissionalAuth } from '../contexts/ProfissionalAuthContext'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useDoctorConsultationSession } from '../hooks/useDoctorConsultationSession'
import {
  useConsultationSessionGuard,
  writeConsultationLockToStorage,
} from '../hooks/useConsultationSessionGuard'
import {
  enviarProfissionalMensagem,
  emitirProfissionalAtestado,
  emitirProfissionalPedidoExame,
  emitirProfissionalReceita,
  fetchPublicExamCatalog,
  fetchProfissionalDocumentoDownloadUrl,
  finalizarProfissionalAtendimento,
  removerProfissionalAnexo,
  salvarProfissionalNotaProntuario,
  uploadProfissionalMensagemAnexo,
} from '../lib/services/profissional/atendimentos'
import { isValidAttendanceId } from '../utils/generateAttendanceId'

const DOCTOR_NAV_BLOCK_TOAST_MESSAGE =
  'Para sair, clique em Finalizar consulta. Voltar, recarregar ou trocar de página não é permitido durante o atendimento.'

function formatStartedAtLabel(startedAtIso: string) {
  const started = new Date(startedAtIso)
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
  const { getAccessToken, isAuthenticated } = useProfissionalAuth()
  const accessToken = getAccessToken()
  const { attendanceId } = useParams<{ attendanceId: string }>()
  const codigo = isValidAttendanceId(attendanceId) ? attendanceId : undefined

  const {
    sessao,
    attendanceSession,
    messages,
    documents,
    historicoNotes,
    patientAgeGender,
    loading,
    error,
    refresh,
    reloadMessages,
    setDocuments,
  } = useDoctorConsultationSession(codigo, { accessToken })

  const [examRequestOpen, setExamRequestOpen] = useState(false)
  const [prescriptionOpen, setPrescriptionOpen] = useState(false)
  const [atestadoOpen, setAtestadoOpen] = useState(false)
  const [examCatalog, setExamCatalog] = useState<ExamCatalogItem[]>([])
  const [navBlockToastVisible, setNavBlockToastVisible] = useState(false)
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const allowLeaveRef = useRef(false)
  const videoStageRef = useRef<ConsultationVideoStageHandle>(null)

  const guardActive = Boolean(attendanceSession)

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
    if (attendanceSession) writeConsultationLockToStorage(true)
  }, [attendanceSession])

  useEffect(() => {
    if (!examRequestOpen || !accessToken) return
    void fetchPublicExamCatalog(accessToken).then(setExamCatalog)
  }, [accessToken, examRequestOpen])

  const elapsed = useConsultationElapsed(attendanceSession?.startedAtIso ?? new Date().toISOString())

  const handleRequestFinishConsultation = useCallback(() => {
    setFinishConfirmOpen(true)
  }, [])

  const handleConfirmFinishConsultation = useCallback(async () => {
    if (!accessToken || !sessao) return

    setFinishConfirmOpen(false)
    videoStageRef.current?.disconnect()
    try {
      await finalizarProfissionalAtendimento(accessToken, sessao.consultaId, {
        notasClinicas: sessao.notasClinicas,
      })
      allowLeaveRef.current = true
      writeConsultationLockToStorage(false)

      const fromProfissional = isProfissionalAttendanceOrigin()
      if (codigo) {
        completeProfissionalQueueAttendance(codigo)
      }

      if (fromProfissional) {
        navigate(profissionalRoutes.agenda, {
          replace: true,
          state: { agendaTab: 'fila' },
        })
        return
      }
      navigate(ubtRoutes.consultas, { replace: true })
    } catch {
      setActionError('Não foi possível finalizar a consulta.')
    }
  }, [accessToken, codigo, navigate, sessao])

  const handleSwitchToPatientView = useCallback(() => {
    showNavBlockToast()
  }, [showNavBlockToast])

  const handleSendChatMessage = useCallback(
    async (text: string) => {
      if (!accessToken || !sessao) return
      await enviarProfissionalMensagem(accessToken, sessao.consultaId, text)
      await reloadMessages()
    },
    [accessToken, reloadMessages, sessao],
  )

  const handleSendChatAttachmentFile = useCallback(
    async (file: File) => {
      if (!accessToken || !sessao) return
      await uploadProfissionalMensagemAnexo(accessToken, sessao.consultaId, file)
      await reloadMessages()
    },
    [accessToken, reloadMessages, sessao],
  )

  const handleSaveProntuarioNote = useCallback(
    async (nota: string) => {
      if (!accessToken || !sessao) return
      await salvarProfissionalNotaProntuario(accessToken, sessao.consultaId, nota)
      await refresh()
    },
    [accessToken, refresh, sessao],
  )

  const handleExamRequestSigned = useCallback(
    async (payload: {
      selectedExams: ExamCatalogItem[]
      clinicalIndication: string
      customExamNames: string[]
    }) => {
      if (!accessToken || !sessao) return

      const selected = [...payload.selectedExams]
      for (const name of payload.customExamNames) {
        if (!selected.some((exam) => exam.name === name)) {
          selected.push({ id: `custom-${name}`, name, category: 'Personalizado' })
        }
      }

      await emitirProfissionalPedidoExame(accessToken, sessao.consultaId, {
        exames: selected.map((exam) => ({
          exameId: exam.id.startsWith('custom-') ? undefined : exam.id,
          name: exam.name,
          observacoes: payload.clinicalIndication,
        })),
        indicacaoClinica: payload.clinicalIndication,
      })

      await refresh()
    },
    [accessToken, refresh, sessao],
  )

  const handlePrescriptionSigned = useCallback(
    async (payload: {
      medications: Array<{
        name: string
        presentation: string
        route: string
        dosage: string
        instructions: string
        duration: string
        notes: string
      }>
      generalNotes: string
    }) => {
      if (!accessToken || !sessao) return

      await emitirProfissionalReceita(accessToken, sessao.consultaId, {
        medicamentos: payload.medications.map((med) => ({
          medicamentoNome: med.presentation ? `${med.name} — ${med.presentation}` : med.name,
          dosagem: med.dosage,
          via: med.route,
          frequencia: med.instructions,
          duracao: med.duration,
          observacoes: [med.notes, payload.generalNotes].filter(Boolean).join('\n'),
        })),
        observacoesGerais: payload.generalNotes,
      })

      await refresh()
    },
    [accessToken, refresh, sessao],
  )

  const handleAtestadoSigned = useCallback(
    async (payload: {
      diasAfastamento: number
      dataInicio: string
      cid?: string
      motivo: string
      observacoes?: string
    }) => {
      if (!accessToken || !sessao) return
      await emitirProfissionalAtestado(accessToken, sessao.consultaId, payload)
      await refresh()
    },
    [accessToken, refresh, sessao],
  )

  const handleDownloadConsultationDocument = useCallback(
    async (document: import('../components/attendance/ConsultationDocumentsPanel').ConsultationDocumentItem) => {
      if (!accessToken || !sessao) return
      if (document.downloadUrl) {
        window.open(document.downloadUrl, '_blank', 'noopener,noreferrer')
        return
      }
      const url = await fetchProfissionalDocumentoDownloadUrl(
        accessToken,
        sessao.consultaId,
        document.id,
      )
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
    },
    [accessToken, sessao],
  )

  const handleDeleteConsultationDocument = useCallback(
    async (documentId: string) => {
      if (!accessToken || !sessao) return
      await removerProfissionalAnexo(accessToken, sessao.consultaId, documentId)
      setDocuments((current) => current.filter((doc) => doc.id !== documentId))
    },
    [accessToken, sessao, setDocuments],
  )

  if (!isAuthenticated || !accessToken) {
    return <Navigate to={profissionalRoutes.login} replace />
  }

  if (!codigo) {
    return <Navigate to={profissionalRoutes.agenda} replace />
  }

  if (loading && !attendanceSession) {
    return (
      <div
        className="flex h-[100dvh] items-center justify-center text-sm text-gray-600"
        style={{ backgroundColor: DOCTOR_CONSULTATION_PAGE_BG }}
      >
        Carregando atendimento…
      </div>
    )
  }

  if (error || !attendanceSession || !sessao) {
    return (
      <div
        className="flex h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ backgroundColor: DOCTOR_CONSULTATION_PAGE_BG }}
      >
        <p className="max-w-md text-sm font-medium text-gray-800" role="alert">
          {error ?? 'Não foi possível abrir a sala de atendimento.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              void refresh()
            }}
            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Tentar novamente
          </button>
          <button
            type="button"
            onClick={() =>
              navigate(profissionalRoutes.agenda, {
                replace: true,
                state: { agendaTab: 'fila' },
              })
            }
            className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Voltar à fila
          </button>
        </div>
      </div>
    )
  }

  const recordPatientProfile = buildDoctorRecordPatientProfile({
    patientName: attendanceSession.patientName,
    patientPhotoUrl: attendanceSession.patientPhotoUrl,
    patientBirthDateIso: attendanceSession.patientBirthDateIso,
    patientCity: attendanceSession.patientCity,
  })

  return (
    <div
      className="flex h-[100dvh] flex-col overflow-hidden"
      style={{ backgroundColor: DOCTOR_CONSULTATION_PAGE_BG }}
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col px-3 sm:px-5">
        <DoctorConsultationHeader
          elapsed={elapsed}
          startedAtLabel={formatStartedAtLabel(attendanceSession.startedAtIso)}
          onSwitchToPatientView={handleSwitchToPatientView}
          onFinishConsultation={handleRequestFinishConsultation}
          onRequestExam={() => setExamRequestOpen(true)}
          onIssuePrescription={() => setPrescriptionOpen(true)}
          onIssueAtestado={() => setAtestadoOpen(true)}
        />

        {actionError ? (
          <p className="mt-2 text-sm font-medium text-red-600" role="alert">
            {actionError}
          </p>
        ) : null}

        <main className="flex min-h-0 flex-1 flex-col gap-3 pb-3 sm:gap-4 sm:pb-4">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[minmax(400px,2fr)_minmax(160px,0.75fr)] lg:gap-4">
            <DoctorConsultationVideoStage
              ref={videoStageRef}
              className="min-h-[320px] lg:col-start-1 lg:row-start-1 lg:min-h-0"
              codigoAtendimento={codigo!}
              getAccessToken={getAccessToken}
              videoEnabled={sessao?.status === 'em_andamento'}
              patientName={attendanceSession.patientName}
              patientCpfMasked={attendanceSession.patientCpfMasked}
              patientAgeGender={patientAgeGender}
              patientVideoPosterUrl={attendanceSession.patientPhotoUrl}
              doctorPhotoUrl={attendanceSession.doctorPhotoUrl}
            />

            <DoctorConsultationChatPanel
              className="min-h-[400px] lg:col-start-2 lg:row-start-1 lg:min-h-0 lg:h-full"
              cardClassName={doctorConsultationCardClass}
              messages={messages}
              onSendMessage={handleSendChatMessage}
              onSendAttachmentFile={handleSendChatAttachmentFile}
            />

            <DoctorPatientRecordPanel
              className="min-h-[160px] lg:col-start-1 lg:row-start-2 lg:h-full"
              doctorSpecialty={attendanceSession.doctorSpecialty}
              doctorName={attendanceSession.doctorName}
              patient={recordPatientProfile}
              historicoNotes={historicoNotes}
              onSaveNote={handleSaveProntuarioNote}
            />

            <ConsultationDocumentsPanel
              cardClassName={doctorConsultationCardClass}
              className="min-h-[160px] lg:col-start-2 lg:row-start-2 lg:h-full"
              documents={documents}
              onDeleteDocument={handleDeleteConsultationDocument}
              onDownloadDocument={(doc) => void handleDownloadConsultationDocument(doc)}
            />
          </div>

          <DoctorConsultationStatusFooter />
        </main>
      </div>

      <DoctorExamRequestModal
        open={examRequestOpen}
        onClose={() => setExamRequestOpen(false)}
        onSigned={handleExamRequestSigned}
        examCatalog={examCatalog}
        patient={{
          name: attendanceSession.patientName,
          cpfMasked: attendanceSession.patientCpfMasked,
          photoUrl: attendanceSession.patientPhotoUrl,
          ageGenderLabel: patientAgeGender,
        }}
        doctor={{
          name: attendanceSession.doctorName,
          specialty: attendanceSession.doctorSpecialty,
          crm: attendanceSession.doctorCrm,
        }}
      />

      <DoctorPrescriptionModal
        open={prescriptionOpen}
        onClose={() => setPrescriptionOpen(false)}
        onSigned={handlePrescriptionSigned}
        patient={{
          name: attendanceSession.patientName,
          cpfMasked: attendanceSession.patientCpfMasked,
          photoUrl: attendanceSession.patientPhotoUrl,
          ageGenderLabel: patientAgeGender,
        }}
        doctor={{
          name: attendanceSession.doctorName,
          specialty: attendanceSession.doctorSpecialty,
          crm: attendanceSession.doctorCrm,
        }}
      />

      <DoctorAtestadoModal
        open={atestadoOpen}
        onClose={() => setAtestadoOpen(false)}
        onSigned={handleAtestadoSigned}
        patient={{
          name: attendanceSession.patientName,
          cpfMasked: attendanceSession.patientCpfMasked,
          photoUrl: attendanceSession.patientPhotoUrl,
          ageGenderLabel: patientAgeGender,
        }}
        doctor={{
          name: attendanceSession.doctorName,
          specialty: attendanceSession.doctorSpecialty,
          crm: attendanceSession.doctorCrm,
        }}
      />

      <DoctorConsultationEndConfirmModal
        open={finishConfirmOpen}
        patientName={attendanceSession.patientName}
        onCancel={() => setFinishConfirmOpen(false)}
        onConfirm={() => void handleConfirmFinishConsultation()}
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
