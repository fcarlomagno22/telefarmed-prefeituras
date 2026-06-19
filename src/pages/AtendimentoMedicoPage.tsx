import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ConsultationDocumentsPanel } from '../components/attendance/ConsultationDocumentsPanel'
import { DoctorClinicalTriageDrawer } from '../components/attendance/doctor/DoctorClinicalTriageDrawer'
import { DoctorConsultationChatPanel } from '../components/attendance/doctor/DoctorConsultationChatPanel'
import { DoctorConsultationEndConfirmModal } from '../components/attendance/doctor/DoctorConsultationEndConfirmModal'
import { DoctorConsultationHeader } from '../components/attendance/doctor/DoctorConsultationHeader'
import type { DoctorClinicalDocumentKind } from '../components/attendance/doctor/doctorClinicalDocumentTypes'
import { DoctorConsultationStatusFooter } from '../components/attendance/doctor/DoctorConsultationStatusFooter'
import { DoctorConsultationVideoStage } from '../components/attendance/doctor/DoctorConsultationVideoStage'
import { ProfissionalPacienteHistoricoDrawer } from '../components/profissional/historico/ProfissionalPacienteHistoricoDrawer'
import type { ConsultationVideoStageHandle } from '../components/attendance/consultationVideoStageShared'
import { buildDoctorRecordPatientProfile } from '../components/attendance/doctor/doctorRecordPatient'
import { DoctorAtestadoModal } from '../components/attendance/doctor/DoctorAtestadoModal'
import { DoctorEncaminhamentoModal } from '../components/attendance/doctor/DoctorEncaminhamentoModal'
import { DoctorRelatorioModal } from '../components/attendance/doctor/DoctorRelatorioModal'
import { DoctorLaudoModal } from '../components/attendance/doctor/DoctorLaudoModal'
import { DoctorAvaliacaoPresencialModal } from '../components/attendance/doctor/DoctorAvaliacaoPresencialModal'
import { DoctorInternacaoModal } from '../components/attendance/doctor/DoctorInternacaoModal'
import { DoctorExamRequestModal } from '../components/attendance/doctor/DoctorExamRequestModal'
import { DoctorPrescriptionModal } from '../components/attendance/doctor/DoctorPrescriptionModal'
import { DoctorPatientRecordPanel } from '../components/attendance/doctor/DoctorPatientRecordPanel'
import {
  DOCTOR_CONSULTATION_PAGE_BG,
  doctorConsultationCardClass,
} from '../components/attendance/doctor/doctorConsultationUi'
import { useConsultationElapsed } from '../components/attendance/patient/useConsultationElapsed'
import { Toast } from '../components/ui/Toast'
import {
  PROFISSIONAL_HISTORICO_DEMO_ATENDIMENTO_CODIGO,
  PROFISSIONAL_HISTORICO_DEMO_PACIENTE_ID,
} from '../config/profissionalHistoricoDemo'
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
  emitirProfissionalEncaminhamento,
  emitirProfissionalPedidoExame,
  emitirProfissionalReceita,
  emitirProfissionalRelatorio,
  emitirProfissionalLaudo,
  emitirProfissionalAvaliacaoPresencial,
  emitirProfissionalInternacao,
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

const DOCTOR_DOCUMENT_COMING_SOON_MESSAGE =
  'Este tipo de documento ainda não está disponível. Em breve você poderá emiti-lo por aqui.'

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
  const [encaminhamentoOpen, setEncaminhamentoOpen] = useState(false)
  const [relatorioOpen, setRelatorioOpen] = useState(false)
  const [laudoOpen, setLaudoOpen] = useState(false)
  const [avaliacaoPresencialOpen, setAvaliacaoPresencialOpen] = useState(false)
  const [internacaoOpen, setInternacaoOpen] = useState(false)
  const [examCatalog, setExamCatalog] = useState<ExamCatalogItem[]>([])
  const [navBlockToastVisible, setNavBlockToastVisible] = useState(false)
  const [comingSoonToastVisible, setComingSoonToastVisible] = useState(false)
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false)
  const [triageDrawerOpen, setTriageDrawerOpen] = useState(false)
  const [historicoDrawerOpen, setHistoricoDrawerOpen] = useState(false)
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

  const handleIssueDocument = useCallback((kind: DoctorClinicalDocumentKind) => {
    if (kind === 'pedido_exame') {
      setExamRequestOpen(true)
      return
    }
    if (kind === 'receita') {
      setPrescriptionOpen(true)
      return
    }
    if (kind === 'atestado') {
      setAtestadoOpen(true)
      return
    }
    if (kind === 'encaminhamento') {
      setEncaminhamentoOpen(true)
      return
    }
    if (kind === 'relatorio') {
      setRelatorioOpen(true)
      return
    }
    if (kind === 'laudo') {
      setLaudoOpen(true)
      return
    }
    if (kind === 'avaliacao_presencial') {
      setAvaliacaoPresencialOpen(true)
      return
    }
    if (kind === 'internacao') {
      setInternacaoOpen(true)
      return
    }
    setComingSoonToastVisible(true)
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
    async (payload: import('../components/attendance/doctor/DoctorExamRequestModal').DoctorExamRequestSignedPayload) => {
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
        urgent: payload.priority === 'urgent',
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
    async (payload: import('../components/attendance/doctor/DoctorAtestadoModal').DoctorAtestadoSignedPayload) => {
      if (!accessToken || !sessao) return
      await emitirProfissionalAtestado(accessToken, sessao.consultaId, payload)
      await refresh()
    },
    [accessToken, refresh, sessao],
  )

  const handleEncaminhamentoSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/DoctorEncaminhamentoModal').DoctorEncaminhamentoSignedPayload,
    ) => {
      if (!accessToken || !sessao) return

      await emitirProfissionalEncaminhamento(accessToken, sessao.consultaId, {
        specialtyLabel: payload.specialtyLabel,
        tipoSolicitacao: payload.tipoSolicitacao,
        prioridade: payload.prioridade,
        motivoEncaminhamento: payload.motivoEncaminhamento,
        historiaClinica: payload.historiaClinica,
        exameFisico: payload.exameFisico,
        hipoteseDiagnostica: payload.hipoteseDiagnostica,
        cid: payload.cid,
        cidDescricao: payload.cidDescricao,
        tratamentosEMedicacoes: payload.tratamentosEMedicacoes,
        examesRealizados: payload.examesRealizados,
        observacoes: payload.observacoes,
      })

      await refresh()
    },
    [accessToken, refresh, sessao],
  )

  const handleRelatorioSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/DoctorRelatorioModal').DoctorRelatorioSignedPayload,
    ) => {
      if (!accessToken || !sessao) return

      await emitirProfissionalRelatorio(accessToken, sessao.consultaId, {
        finalidade: payload.finalidade,
        destinatario: payload.destinatario,
        motivoRelatorio: payload.motivoRelatorio,
        queixaPrincipal: payload.queixaPrincipal,
        historiaDoencaAtual: payload.historiaDoencaAtual,
        antecedentesRelevantes: payload.antecedentesRelevantes,
        medicacoesEmUso: payload.medicacoesEmUso,
        exameFisico: payload.exameFisico,
        examesComplementares: payload.examesComplementares,
        hipoteseDiagnostica: payload.hipoteseDiagnostica,
        cid: payload.cid,
        cidDescricao: payload.cidDescricao,
        condutaAdotada: payload.condutaAdotada,
        tratamentoEOrientacoes: payload.tratamentoEOrientacoes,
        evolucaoPrognostico: payload.evolucaoPrognostico,
        conclusaoParecer: payload.conclusaoParecer,
        recomendacoes: payload.recomendacoes,
        observacoes: payload.observacoes,
      })

      await refresh()
    },
    [accessToken, refresh, sessao],
  )

  const handleLaudoSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/DoctorLaudoModal').DoctorLaudoSignedPayload,
    ) => {
      if (!accessToken || !sessao) return

      await emitirProfissionalLaudo(accessToken, sessao.consultaId, {
        tipoLaudo: payload.tipoLaudo,
        destinatario: payload.destinatario,
        objetoLaudo: payload.objetoLaudo,
        solicitacaoOrigem: payload.solicitacaoOrigem,
        descricaoAchados: payload.descricaoAchados,
        correlacaoClinica: payload.correlacaoClinica,
        discussaoInterpretacao: payload.discussaoInterpretacao,
        conclusaoLaudo: payload.conclusaoLaudo,
        cid: payload.cid,
        cidDescricao: payload.cidDescricao,
        recomendacoes: payload.recomendacoes,
        limitacoesExame: payload.limitacoesExame,
        observacoes: payload.observacoes,
      })

      await refresh()
    },
    [accessToken, refresh, sessao],
  )

  const handleAvaliacaoPresencialSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/DoctorAvaliacaoPresencialModal').DoctorAvaliacaoPresencialSignedPayload,
    ) => {
      if (!accessToken || !sessao) return

      await emitirProfissionalAvaliacaoPresencial(accessToken, sessao.consultaId, {
        tipoAvaliacao: payload.tipoAvaliacao,
        prioridade: payload.prioridade,
        servicoDestino: payload.servicoDestino,
        motivoAvaliacao: payload.motivoAvaliacao,
        justificativaPresencial: payload.justificativaPresencial,
        historiaClinica: payload.historiaClinica,
        exameFisicoRemoto: payload.exameFisicoRemoto,
        hipoteseDiagnostica: payload.hipoteseDiagnostica,
        cid: payload.cid,
        cidDescricao: payload.cidDescricao,
        examesRealizados: payload.examesRealizados,
        condutaAdotada: payload.condutaAdotada,
        expectativaAvaliacao: payload.expectativaAvaliacao,
        observacoes: payload.observacoes,
      })

      await refresh()
    },
    [accessToken, refresh, sessao],
  )

  const handleInternacaoSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/DoctorInternacaoModal').DoctorInternacaoSignedPayload,
    ) => {
      if (!accessToken || !sessao) return

      await emitirProfissionalInternacao(accessToken, sessao.consultaId, {
        tipoInternacao: payload.tipoInternacao,
        caraterInternacao: payload.caraterInternacao,
        unidadeDestino: payload.unidadeDestino,
        motivoInternacao: payload.motivoInternacao,
        justificativaClinica: payload.justificativaClinica,
        historiaClinica: payload.historiaClinica,
        exameFisico: payload.exameFisico,
        hipoteseDiagnostica: payload.hipoteseDiagnostica,
        cid: payload.cid,
        cidDescricao: payload.cidDescricao,
        examesComplementares: payload.examesComplementares,
        tratamentosEMedicacoes: payload.tratamentosEMedicacoes,
        condutaAdotada: payload.condutaAdotada,
        procedimentoPrincipalPrevisto: payload.procedimentoPrincipalPrevisto,
        tempoEstimadoInternacao: payload.tempoEstimadoInternacao,
        observacoes: payload.observacoes,
      })

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
          onFinishConsultation={handleRequestFinishConsultation}
          onIssueDocument={handleIssueDocument}
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
              onViewClinicalTriage={() => setTriageDrawerOpen(true)}
              onViewPreviousConsultations={() => setHistoricoDrawerOpen(true)}
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

      <DoctorEncaminhamentoModal
        open={encaminhamentoOpen}
        onClose={() => setEncaminhamentoOpen(false)}
        onSigned={handleEncaminhamentoSigned}
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

      <DoctorRelatorioModal
        open={relatorioOpen}
        onClose={() => setRelatorioOpen(false)}
        onSigned={handleRelatorioSigned}
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

      <DoctorLaudoModal
        open={laudoOpen}
        onClose={() => setLaudoOpen(false)}
        onSigned={handleLaudoSigned}
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

      <DoctorAvaliacaoPresencialModal
        open={avaliacaoPresencialOpen}
        onClose={() => setAvaliacaoPresencialOpen(false)}
        onSigned={handleAvaliacaoPresencialSigned}
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

      <DoctorInternacaoModal
        open={internacaoOpen}
        onClose={() => setInternacaoOpen(false)}
        onSigned={handleInternacaoSigned}
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

      <DoctorClinicalTriageDrawer
        open={triageDrawerOpen}
        onClose={() => setTriageDrawerOpen(false)}
        patientName={attendanceSession.patientName}
        patientAgeGender={patientAgeGender}
        unitName={sessao.unitName}
        triageSummary={sessao.triageSummary}
      />

      <ProfissionalPacienteHistoricoDrawer
        open={historicoDrawerOpen}
        onClose={() => setHistoricoDrawerOpen(false)}
        accessToken={accessToken}
        pacienteId={
          codigo === PROFISSIONAL_HISTORICO_DEMO_ATENDIMENTO_CODIGO
            ? PROFISSIONAL_HISTORICO_DEMO_PACIENTE_ID
            : undefined
        }
        patientName={attendanceSession.patientName}
        specialty={attendanceSession.doctorSpecialty}
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

      <Toast
        message={DOCTOR_DOCUMENT_COMING_SOON_MESSAGE}
        visible={comingSoonToastVisible}
        onClose={() => setComingSoonToastVisible(false)}
        variant="warning"
        durationMs={4000}
      />
    </div>
  )
}
