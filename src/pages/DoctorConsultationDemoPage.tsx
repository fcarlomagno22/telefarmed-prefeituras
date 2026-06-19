import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ConsultationChatMessage } from '../components/attendance/consultationChatTypes'
import type { ConsultationDocumentItem } from '../components/attendance/ConsultationDocumentsPanel'
import { ConsultationDocumentsPanel } from '../components/attendance/ConsultationDocumentsPanel'
import { DoctorClinicalTriageDrawer } from '../components/attendance/doctor/DoctorClinicalTriageDrawer'
import { DoctorConsultationChatPanel } from '../components/attendance/doctor/DoctorConsultationChatPanel'
import { DoctorConsultationDemoVideoStage } from '../components/attendance/doctor/DoctorConsultationDemoVideoStage'
import { DoctorConsultationEndConfirmModal } from '../components/attendance/doctor/DoctorConsultationEndConfirmModal'
import { DoctorConsultationHeader } from '../components/attendance/doctor/DoctorConsultationHeader'
import type { DoctorClinicalDocumentKind } from '../components/attendance/doctor/doctorClinicalDocumentTypes'
import { DoctorConsultationStatusFooter } from '../components/attendance/doctor/DoctorConsultationStatusFooter'
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
import { buildDoctorRecordPatientProfile } from '../components/attendance/doctor/doctorRecordPatient'
import { useConsultationElapsed } from '../components/attendance/patient/useConsultationElapsed'
import { ProfissionalPacienteHistoricoDrawer } from '../components/profissional/historico/ProfissionalPacienteHistoricoDrawer'
import { Toast } from '../components/ui/Toast'
import { brand } from '../config/brand'
import { useClinicalDocumentBranding } from '../hooks/useClinicalDocumentBranding'
import { useTenantHost } from '../contexts/TenantHostContext'
import {
  buildDoctorConsultationDemoSnapshot,
  DOCTOR_CONSULTATION_PUBLIC_DEMO_TOKEN,
} from '../data/doctorConsultationDemo'
import { EXAM_REQUEST_CATALOG, type ExamCatalogItem } from '../data/doctorExamRequestMock'
import { useBrandTheme } from '../hooks/useBrandTheme'
import {
  buildDemoClinicalDocumentContext,
  emitDemoClinicalDocument,
  revokeDemoClinicalDocumentUrls,
} from '../lib/services/demo/clinicalDocuments'
import {
  buildAtestadoClinicalDocumentPayload,
  buildClinicalDocumentEmitContext,
  buildEncaminhamentoClinicalDocumentPayload,
  buildPedidoExameClinicalDocumentPayload,
  buildReceitaClinicalDocumentPayload,
  buildRelatorioClinicalDocumentPayload,
  buildLaudoClinicalDocumentPayload,
  buildAvaliacaoPresencialClinicalDocumentPayload,
  buildInternacaoClinicalDocumentPayload,
  mapExamModalToPdfItems,
  mapPrescriptionModalToPdfItems,
} from '../utils/clinicalDocuments/buildClinicalDocumentPayload'
import { mapEncaminhamentoModalToPdfData } from '../utils/clinicalDocuments/encaminhamentoLines'
import { mapRelatorioModalToPdfData } from '../utils/clinicalDocuments/relatorioLines'
import { mapLaudoModalToPdfData } from '../utils/clinicalDocuments/laudoLines'
import { mapAvaliacaoPresencialModalToPdfData } from '../utils/clinicalDocuments/avaliacaoPresencialLines'
import { mapInternacaoModalToPdfData } from '../utils/clinicalDocuments/internacaoLines'
import { openClinicalDocumentPdf } from '../utils/clinicalDocuments/generateClinicalDocumentPdf'

const DEMO_TOAST_MESSAGE = 'Demonstração — ação simulada, nada foi salvo.'

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

function formatNowTime() {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

export function DoctorConsultationDemoPage() {
  useBrandTheme()
  const clinicalBranding = useClinicalDocumentBranding()
  const { slug: tenantSlug } = useTenantHost()

  const snapshot = useMemo(() => buildDoctorConsultationDemoSnapshot(), [])
  const attendanceSession = snapshot.attendanceSession

  const [messages, setMessages] = useState<ConsultationChatMessage[]>(snapshot.messages)
  const [documents, setDocuments] = useState<ConsultationDocumentItem[]>(snapshot.documents)

  const [examRequestOpen, setExamRequestOpen] = useState(false)
  const [prescriptionOpen, setPrescriptionOpen] = useState(false)
  const [atestadoOpen, setAtestadoOpen] = useState(false)
  const [encaminhamentoOpen, setEncaminhamentoOpen] = useState(false)
  const [relatorioOpen, setRelatorioOpen] = useState(false)
  const [laudoOpen, setLaudoOpen] = useState(false)
  const [avaliacaoPresencialOpen, setAvaliacaoPresencialOpen] = useState(false)
  const [internacaoOpen, setInternacaoOpen] = useState(false)
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false)
  const [triageDrawerOpen, setTriageDrawerOpen] = useState(false)
  const [historicoDrawerOpen, setHistoricoDrawerOpen] = useState(false)
  const [demoToastVisible, setDemoToastVisible] = useState(false)
  const [errorToastMessage, setErrorToastMessage] = useState<string | null>(null)
  const [emittingDocument, setEmittingDocument] = useState(false)

  const blobUrlsRef = useRef<string[]>([])

  const elapsed = useConsultationElapsed(snapshot.startedAtIso)
  const examCatalog: ExamCatalogItem[] = EXAM_REQUEST_CATALOG

  const documentContext = useMemo(
    () =>
      buildClinicalDocumentEmitContext({
        entidadeNome: clinicalBranding.displayName || brand.appName,
        unitName: attendanceSession.unitName,
        specialty: attendanceSession.doctorSpecialty,
        patientName: attendanceSession.patientName,
        patientCpfMasked: attendanceSession.patientCpfMasked,
        patientBirthDateIso: attendanceSession.patientBirthDateIso,
        patientAddress: attendanceSession.patientAddress,
        doctorName: attendanceSession.doctorName,
        doctorSpecialty: attendanceSession.doctorSpecialty,
        doctorCrm: attendanceSession.doctorCrm,
        entidadeLogoUrl: clinicalBranding.logoUrl,
        entidadeSlug: tenantSlug ?? undefined,
      }),
    [attendanceSession, clinicalBranding, tenantSlug],
  )

  useEffect(() => {
    const urls = blobUrlsRef.current
    return () => revokeDemoClinicalDocumentUrls(urls)
  }, [])

  const showDemoToast = useCallback(() => {
    setDemoToastVisible(true)
  }, [])

  const handleIssueDocument = useCallback(
    (kind: DoctorClinicalDocumentKind) => {
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
      showDemoToast()
    },
    [showDemoToast],
  )

  const recordPatientProfile = buildDoctorRecordPatientProfile({
    patientName: attendanceSession.patientName,
    patientPhotoUrl: attendanceSession.patientPhotoUrl,
    patientBirthDateIso: attendanceSession.patientBirthDateIso,
    patientCity: attendanceSession.patientCity,
  })

  const handleSendChatMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setMessages((current) => [
      ...current,
      {
        id: `demo-msg-${Date.now()}`,
        from: 'doctor',
        time: formatNowTime(),
        text: trimmed,
      },
    ])
  }, [])

  const handleSendChatAttachmentFile = useCallback(async (_file: File) => {
    showDemoToast()
  }, [showDemoToast])

  const handleSaveProntuarioNote = useCallback(async (_nota: string) => {
    showDemoToast()
  }, [showDemoToast])

  const handleConfirmFinishConsultation = useCallback(() => {
    setFinishConfirmOpen(false)
    showDemoToast()
  }, [showDemoToast])

  const appendGeneratedDocument = useCallback((document: ConsultationDocumentItem, blobUrl: string) => {
    blobUrlsRef.current.push(blobUrl)
    setDocuments((current) => [document, ...current])
  }, [])

  const handleEncaminhamentoSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/DoctorEncaminhamentoModal').DoctorEncaminhamentoSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const encaminhamento = mapEncaminhamentoModalToPdfData(payload)
        const urgent = payload.prioridade === 'urgente'
        const fallbackPayload = buildEncaminhamentoClinicalDocumentPayload({
          context: documentContext,
          encaminhamento,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'encaminhamento',
            context: buildDemoClinicalDocumentContext(documentContext),
            encaminhamento,
          },
          fallbackPayload,
          titulo: urgent ? 'Encaminhamento médico (urgente)' : 'Encaminhamento médico',
          fileName: 'encaminhamento-medico.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setEncaminhamentoOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o encaminhamento médico.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleRelatorioSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/DoctorRelatorioModal').DoctorRelatorioSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const relatorio = mapRelatorioModalToPdfData(payload)
        const fallbackPayload = buildRelatorioClinicalDocumentPayload({
          context: documentContext,
          relatorio,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'relatorio',
            context: buildDemoClinicalDocumentContext(documentContext),
            relatorio,
          },
          fallbackPayload,
          titulo: 'Relatório médico',
          fileName: 'relatorio-medico.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setRelatorioOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o relatório médico.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleLaudoSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/DoctorLaudoModal').DoctorLaudoSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const laudo = mapLaudoModalToPdfData(payload)
        const fallbackPayload = buildLaudoClinicalDocumentPayload({
          context: documentContext,
          laudo,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'laudo',
            context: buildDemoClinicalDocumentContext(documentContext),
            laudo,
          },
          fallbackPayload,
          titulo: 'Laudo médico',
          fileName: 'laudo-medico.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setLaudoOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o laudo médico.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleAvaliacaoPresencialSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/DoctorAvaliacaoPresencialModal').DoctorAvaliacaoPresencialSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const avaliacaoPresencial = mapAvaliacaoPresencialModalToPdfData(payload)
        const fallbackPayload = buildAvaliacaoPresencialClinicalDocumentPayload({
          context: documentContext,
          avaliacaoPresencial,
        })
        const urgent = payload.prioridade === 'urgente'
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'avaliacao_presencial',
            context: buildDemoClinicalDocumentContext(documentContext),
            avaliacaoPresencial,
          },
          fallbackPayload,
          titulo: urgent ? 'Avaliação presencial (urgente)' : 'Avaliação presencial',
          fileName: 'avaliacao-presencial.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setAvaliacaoPresencialOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível gerar a avaliação presencial.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleInternacaoSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/DoctorInternacaoModal').DoctorInternacaoSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const internacao = mapInternacaoModalToPdfData(payload)
        const fallbackPayload = buildInternacaoClinicalDocumentPayload({
          context: documentContext,
          internacao,
        })
        const urgent =
          payload.caraterInternacao === 'urgencia' || payload.caraterInternacao === 'emergencia'
        const caraterLabel =
          payload.caraterInternacao === 'emergencia'
            ? 'emergência'
            : payload.caraterInternacao === 'urgencia'
              ? 'urgência'
              : ''
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'internacao',
            context: buildDemoClinicalDocumentContext(documentContext),
            internacao,
          },
          fallbackPayload,
          titulo: urgent ? `Internação (${caraterLabel})` : 'Internação',
          fileName: 'solicitacao-internacao.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setInternacaoOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar a solicitação de internação.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleExamRequestSigned = useCallback(
    async (payload: import('../components/attendance/doctor/DoctorExamRequestModal').DoctorExamRequestSignedPayload) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const exames = mapExamModalToPdfItems(payload)
        const urgent = payload.priority === 'urgent'
        const fallbackPayload = buildPedidoExameClinicalDocumentPayload({
          context: documentContext,
          exames,
          indicacaoClinica: payload.clinicalIndication,
          urgent,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'pedido_exame',
            context: buildDemoClinicalDocumentContext(documentContext),
            exames,
            indicacaoClinica: payload.clinicalIndication,
            urgent,
          },
          fallbackPayload,
          titulo: 'Pedido de exames',
          fileName: 'pedido-exames.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setExamRequestOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o pedido de exames.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
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
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const medicamentos = mapPrescriptionModalToPdfItems(
          payload.medications,
          payload.generalNotes,
        )
        const fallbackPayload = buildReceitaClinicalDocumentPayload({
          context: documentContext,
          medicamentos,
          observacoesGerais: payload.generalNotes,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'receita',
            context: buildDemoClinicalDocumentContext(documentContext),
            medicamentos,
            observacoesGerais: payload.generalNotes,
          },
          fallbackPayload,
          titulo: 'Receita médica',
          fileName: 'receita-medica.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setPrescriptionOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar a receita médica.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleAtestadoSigned = useCallback(
    async (payload: import('../components/attendance/doctor/DoctorAtestadoModal').DoctorAtestadoSignedPayload) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildAtestadoClinicalDocumentPayload({
          context: documentContext,
          atestado: payload,
        })
        const documentMeta =
          payload.tipo === 'comparecimento'
            ? {
                titulo: 'Atestado de comparecimento',
                fileName: 'atestado-comparecimento.pdf',
              }
            : {
                titulo: `Atestado médico (${payload.diasAfastamento} dia(s))`,
                fileName: 'atestado-medico.pdf',
              }
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'atestado',
            context: buildDemoClinicalDocumentContext(documentContext),
            atestado: payload,
          },
          fallbackPayload,
          titulo: documentMeta.titulo,
          fileName: documentMeta.fileName,
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setAtestadoOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o atestado médico.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleDownloadConsultationDocument = useCallback(
    async (document: ConsultationDocumentItem) => {
      if (!document.downloadUrl) {
        setErrorToastMessage('PDF indisponível para este documento.')
        return
      }

      try {
        const response = await fetch(document.downloadUrl)
        const blob = await response.blob()
        const fileName = document.title.toLowerCase().includes('receita')
          ? 'receita-medica.pdf'
          : document.title.toLowerCase().includes('exame')
            ? 'pedido-exames.pdf'
            : document.title.toLowerCase().includes('encaminhamento')
              ? 'encaminhamento-medico.pdf'
              : document.title.toLowerCase().includes('relatório') ||
                  document.title.toLowerCase().includes('relatorio')
                ? 'relatorio-medico.pdf'
                : document.title.toLowerCase().includes('laudo')
                  ? 'laudo-medico.pdf'
                  : 'atestado-medico.pdf'
        openClinicalDocumentPdf(blob, fileName)
      } catch {
        window.open(document.downloadUrl, '_blank', 'noopener,noreferrer')
      }
    },
    [],
  )

  const patientCard = {
    name: attendanceSession.patientName,
    cpfMasked: attendanceSession.patientCpfMasked,
    photoUrl: attendanceSession.patientPhotoUrl,
    ageGenderLabel: snapshot.patientAgeGender,
  }

  const doctorCard = {
    name: attendanceSession.doctorName,
    specialty: attendanceSession.doctorSpecialty,
    crm: attendanceSession.doctorCrm,
  }

  return (
    <div
      className="flex h-[100dvh] flex-col overflow-hidden"
      style={{ backgroundColor: DOCTOR_CONSULTATION_PAGE_BG }}
    >
      <div className="shrink-0 border-b border-amber-200/80 bg-amber-50 px-4 py-2 text-center text-xs text-amber-950 sm:text-sm">
        <span className="font-semibold">Demonstração</span> — sala de atendimento do profissional
        (teleconsulta em andamento com paciente fictício). Receitas, exames e atestados geram PDF
        real para visualização.
      </div>

      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col px-3 sm:px-5">
        <DoctorConsultationHeader
          elapsed={elapsed}
          startedAtLabel={formatStartedAtLabel(snapshot.startedAtIso)}
          onFinishConsultation={() => setFinishConfirmOpen(true)}
          onIssueDocument={handleIssueDocument}
        />

        <main className="flex min-h-0 flex-1 flex-col gap-3 pb-3 sm:gap-4 sm:pb-4">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[minmax(400px,2fr)_minmax(160px,0.75fr)] lg:gap-4">
            <DoctorConsultationDemoVideoStage
              className="min-h-[320px] lg:col-start-1 lg:row-start-1 lg:min-h-0"
              patientName={attendanceSession.patientName}
              patientCpfMasked={attendanceSession.patientCpfMasked}
              patientAgeGender={snapshot.patientAgeGender}
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
              historicoNotes={snapshot.historicoNotes}
              onSaveNote={handleSaveProntuarioNote}
            />

            <ConsultationDocumentsPanel
              cardClassName={doctorConsultationCardClass}
              className="min-h-[160px] lg:col-start-2 lg:row-start-2 lg:h-full"
              documents={documents}
              onDeleteDocument={(documentId) => {
                setDocuments((current) => {
                  const removed = current.find((doc) => doc.id === documentId)
                  if (removed?.downloadUrl?.startsWith('blob:')) {
                    URL.revokeObjectURL(removed.downloadUrl)
                    blobUrlsRef.current = blobUrlsRef.current.filter(
                      (url) => url !== removed.downloadUrl,
                    )
                  }
                  return current.filter((doc) => doc.id !== documentId)
                })
              }}
              onDownloadDocument={handleDownloadConsultationDocument}
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
        patient={patientCard}
        doctor={doctorCard}
      />

      <DoctorPrescriptionModal
        open={prescriptionOpen}
        onClose={() => setPrescriptionOpen(false)}
        onSigned={handlePrescriptionSigned}
        patient={patientCard}
        doctor={doctorCard}
      />

      <DoctorAtestadoModal
        open={atestadoOpen}
        onClose={() => setAtestadoOpen(false)}
        onSigned={handleAtestadoSigned}
        patient={patientCard}
        doctor={doctorCard}
      />

      <DoctorEncaminhamentoModal
        open={encaminhamentoOpen}
        onClose={() => setEncaminhamentoOpen(false)}
        onSigned={handleEncaminhamentoSigned}
        patient={patientCard}
        doctor={doctorCard}
      />

      <DoctorRelatorioModal
        open={relatorioOpen}
        onClose={() => setRelatorioOpen(false)}
        onSigned={handleRelatorioSigned}
        patient={patientCard}
        doctor={doctorCard}
      />

      <DoctorLaudoModal
        open={laudoOpen}
        onClose={() => setLaudoOpen(false)}
        onSigned={handleLaudoSigned}
        patient={patientCard}
        doctor={doctorCard}
      />

      <DoctorAvaliacaoPresencialModal
        open={avaliacaoPresencialOpen}
        onClose={() => setAvaliacaoPresencialOpen(false)}
        onSigned={handleAvaliacaoPresencialSigned}
        patient={patientCard}
        doctor={doctorCard}
      />

      <DoctorInternacaoModal
        open={internacaoOpen}
        onClose={() => setInternacaoOpen(false)}
        onSigned={handleInternacaoSigned}
        patient={patientCard}
        doctor={doctorCard}
      />

      <DoctorClinicalTriageDrawer
        open={triageDrawerOpen}
        onClose={() => setTriageDrawerOpen(false)}
        patientName={attendanceSession.patientName}
        patientAgeGender={snapshot.patientAgeGender}
        unitName={attendanceSession.unitName}
        triageSummary={snapshot.triageSummary}
      />

      <ProfissionalPacienteHistoricoDrawer
        open={historicoDrawerOpen}
        onClose={() => setHistoricoDrawerOpen(false)}
        accessToken={DOCTOR_CONSULTATION_PUBLIC_DEMO_TOKEN}
        pacienteId={snapshot.pacienteId}
        patientName={attendanceSession.patientName}
        specialty={attendanceSession.doctorSpecialty}
      />

      <DoctorConsultationEndConfirmModal
        open={finishConfirmOpen}
        patientName={attendanceSession.patientName}
        onCancel={() => setFinishConfirmOpen(false)}
        onConfirm={handleConfirmFinishConsultation}
      />

      {emittingDocument ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4">
          <div className="rounded-full bg-slate-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg">
            Gerando PDF…
          </div>
        </div>
      ) : null}

      <Toast
        message={DEMO_TOAST_MESSAGE}
        visible={demoToastVisible}
        onClose={() => setDemoToastVisible(false)}
        variant="warning"
        durationMs={3200}
      />

      <Toast
        message={errorToastMessage ?? ''}
        visible={Boolean(errorToastMessage)}
        onClose={() => setErrorToastMessage(null)}
        variant="error"
        durationMs={4200}
      />
    </div>
  )
}
