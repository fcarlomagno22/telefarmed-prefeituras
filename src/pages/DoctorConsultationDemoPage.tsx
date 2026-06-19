import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ConsultationChatMessage } from '../components/attendance/consultationChatTypes'
import type { ConsultationDocumentItem } from '../components/attendance/ConsultationDocumentsPanel'
import { ConsultationDocumentsPanel } from '../components/attendance/ConsultationDocumentsPanel'
import { DoctorClinicalTriageDrawer } from '../components/attendance/doctor/DoctorClinicalTriageDrawer'
import { DoctorConsultationChatPanel } from '../components/attendance/doctor/DoctorConsultationChatPanel'
import { DoctorConsultationDemoVideoStage } from '../components/attendance/doctor/DoctorConsultationDemoVideoStage'
import { DoctorConsultationEndConfirmModal } from '../components/attendance/doctor/DoctorConsultationEndConfirmModal'
import { DemoConsultationHeader } from '../components/attendance/doctor/demo/DemoConsultationHeader'
import type { DoctorClinicalDocumentKind } from '../components/attendance/doctor/doctorClinicalDocumentTypes'
import { PsychologistAtestadoModal } from '../components/attendance/doctor/demo/psicologo/PsychologistAtestadoModal'
import { PsychologistRelatorioModal } from '../components/attendance/doctor/demo/psicologo/PsychologistRelatorioModal'
import { PsychologistRelatorioMultiprofissionalModal } from '../components/attendance/doctor/demo/psicologo/PsychologistRelatorioMultiprofissionalModal'
import { PsychologistLaudoModal } from '../components/attendance/doctor/demo/psicologo/PsychologistLaudoModal'
import { PsychologistParecerModal } from '../components/attendance/doctor/demo/psicologo/PsychologistParecerModal'
import { PsychologistEncaminhamentoModal } from '../components/attendance/doctor/demo/psicologo/PsychologistEncaminhamentoModal'
import { NutritionistPlanoAlimentarModal } from '../components/attendance/doctor/demo/nutricionista/NutritionistPlanoAlimentarModal'
import { NutritionistPrescricaoDieteticaModal } from '../components/attendance/doctor/demo/nutricionista/NutritionistPrescricaoDieteticaModal'
import { NutritionistPrescricaoSuplementosModal } from '../components/attendance/doctor/demo/nutricionista/NutritionistPrescricaoSuplementosModal'
import { NutritionistRelatorioModal } from '../components/attendance/doctor/demo/nutricionista/NutritionistRelatorioModal'
import { NutritionistParecerModal } from '../components/attendance/doctor/demo/nutricionista/NutritionistParecerModal'
import { NutritionistLaudoModal } from '../components/attendance/doctor/demo/nutricionista/NutritionistLaudoModal'
import { NutritionistDeclaracaoComparecimentoModal } from '../components/attendance/doctor/demo/nutricionista/NutritionistDeclaracaoComparecimentoModal'
import { FonoaudiologoDeclaracaoComparecimentoModal } from '../components/attendance/doctor/demo/fonoaudiologo/FonoaudiologoDeclaracaoComparecimentoModal'
import { FonoaudiologoRelatorioModal } from '../components/attendance/doctor/demo/fonoaudiologo/FonoaudiologoRelatorioModal'
import { FonoaudiologoLaudoModal } from '../components/attendance/doctor/demo/fonoaudiologo/FonoaudiologoLaudoModal'
import { FonoaudiologoParecerModal } from '../components/attendance/doctor/demo/fonoaudiologo/FonoaudiologoParecerModal'
import { FonoaudiologoAtestadoModal } from '../components/attendance/doctor/demo/fonoaudiologo/FonoaudiologoAtestadoModal'
import { FonoaudiologoPlanoTerapeuticoModal } from '../components/attendance/doctor/demo/fonoaudiologo/FonoaudiologoPlanoTerapeuticoModal'
import { FonoaudiologoResultadoAvaliacaoModal } from '../components/attendance/doctor/demo/fonoaudiologo/FonoaudiologoResultadoAvaliacaoModal'
import { FonoaudiologoEncaminhamentoModal } from '../components/attendance/doctor/demo/fonoaudiologo/FonoaudiologoEncaminhamentoModal'
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
import {
  getDemoProfessionProfile,
  isDemoFonoaudiologoDocumentKind,
  isDemoNutritionistDocumentKind,
  isDemoPsychologistDocumentKind,
  type DemoClinicalDocumentKind,
  type DemoConsultationProfession,
} from '../data/demoConsultationProfessions'
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
  mapExamModalToNutritionistPedidoExame,
  mapPrescriptionModalToPdfItems,
} from '../utils/clinicalDocuments/buildClinicalDocumentPayload'
import { mapEncaminhamentoModalToPdfData } from '../utils/clinicalDocuments/encaminhamentoLines'
import { mapRelatorioModalToPdfData } from '../utils/clinicalDocuments/relatorioLines'
import { mapLaudoModalToPdfData } from '../utils/clinicalDocuments/laudoLines'
import { mapAvaliacaoPresencialModalToPdfData } from '../utils/clinicalDocuments/avaliacaoPresencialLines'
import { mapInternacaoModalToPdfData } from '../utils/clinicalDocuments/internacaoLines'
import {
  buildPsychologistAtestadoClinicalDocumentPayload,
  buildPsychologistEncaminhamentoClinicalDocumentPayload,
  buildPsychologistLaudoClinicalDocumentPayload,
  buildPsychologistParecerClinicalDocumentPayload,
  buildPsychologistRelatorioClinicalDocumentPayload,
  buildPsychologistRelatorioMultiprofissionalClinicalDocumentPayload,
} from '../utils/clinicalDocuments/buildPsychologistDocumentPayload'
import {
  buildNutritionistDeclaracaoComparecimentoClinicalDocumentPayload,
  buildNutritionistLaudoClinicalDocumentPayload,
  buildNutritionistParecerClinicalDocumentPayload,
  buildNutritionistPedidoExameClinicalDocumentPayload,
  buildNutritionistPlanoAlimentarClinicalDocumentPayload,
  buildNutritionistPrescricaoDieteticaClinicalDocumentPayload,
  buildNutritionistPrescricaoSuplementosClinicalDocumentPayload,
  buildNutritionistRelatorioClinicalDocumentPayload,
} from '../utils/clinicalDocuments/buildNutritionistDocumentPayload'
import {
  buildFonoaudiologoAtestadoClinicalDocumentPayload,
  buildFonoaudiologoDeclaracaoComparecimentoClinicalDocumentPayload,
  buildFonoaudiologoEncaminhamentoClinicalDocumentPayload,
  buildFonoaudiologoLaudoClinicalDocumentPayload,
  buildFonoaudiologoParecerClinicalDocumentPayload,
  buildFonoaudiologoPlanoTerapeuticoClinicalDocumentPayload,
  buildFonoaudiologoRelatorioClinicalDocumentPayload,
  buildFonoaudiologoResultadoAvaliacaoClinicalDocumentPayload,
} from '../utils/clinicalDocuments/buildFonoaudiologoDocumentPayload'
import { openClinicalDocumentPdf } from '../utils/clinicalDocuments/generateClinicalDocumentPdf'

const DEMO_TOAST_MESSAGE = 'Demonstração — ação simulada, nada foi salvo.'

type DemoExamRequestTargetKind = 'pedido_exame' | 'pedido_exame_nutricional'

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
  const [demoProfession, setDemoProfession] = useState<DemoConsultationProfession>('medico')
  const professionProfile = useMemo(
    () => getDemoProfessionProfile(demoProfession),
    [demoProfession],
  )

  const attendanceSession = useMemo(
    () => ({
      ...snapshot.attendanceSession,
      doctorName: professionProfile.doctorName,
      doctorSpecialty: professionProfile.doctorSpecialty,
      doctorCrm: professionProfile.doctorCouncilRegistration,
      specialty: professionProfile.doctorSpecialty,
    }),
    [professionProfile, snapshot.attendanceSession],
  )

  const [messages, setMessages] = useState<ConsultationChatMessage[]>(snapshot.messages)
  const [documents, setDocuments] = useState<ConsultationDocumentItem[]>(snapshot.documents)

  const [examRequestOpen, setExamRequestOpen] = useState(false)
  const [examRequestTargetKind, setExamRequestTargetKind] =
    useState<DemoExamRequestTargetKind>('pedido_exame')
  const [prescriptionOpen, setPrescriptionOpen] = useState(false)
  const [atestadoOpen, setAtestadoOpen] = useState(false)
  const [encaminhamentoOpen, setEncaminhamentoOpen] = useState(false)
  const [relatorioOpen, setRelatorioOpen] = useState(false)
  const [laudoOpen, setLaudoOpen] = useState(false)
  const [avaliacaoPresencialOpen, setAvaliacaoPresencialOpen] = useState(false)
  const [internacaoOpen, setInternacaoOpen] = useState(false)
  const [psychologistAtestadoOpen, setPsychologistAtestadoOpen] = useState(false)
  const [psychologistRelatorioOpen, setPsychologistRelatorioOpen] = useState(false)
  const [psychologistRelatorioMultiprofissionalOpen, setPsychologistRelatorioMultiprofissionalOpen] =
    useState(false)
  const [psychologistLaudoOpen, setPsychologistLaudoOpen] = useState(false)
  const [psychologistParecerOpen, setPsychologistParecerOpen] = useState(false)
  const [psychologistEncaminhamentoOpen, setPsychologistEncaminhamentoOpen] = useState(false)
  const [nutritionistPlanoAlimentarOpen, setNutritionistPlanoAlimentarOpen] = useState(false)
  const [nutritionistPrescricaoDieteticaOpen, setNutritionistPrescricaoDieteticaOpen] =
    useState(false)
  const [nutritionistPrescricaoSuplementosOpen, setNutritionistPrescricaoSuplementosOpen] =
    useState(false)
  const [nutritionistRelatorioOpen, setNutritionistRelatorioOpen] = useState(false)
  const [nutritionistParecerOpen, setNutritionistParecerOpen] = useState(false)
  const [nutritionistLaudoOpen, setNutritionistLaudoOpen] = useState(false)
  const [nutritionistDeclaracaoComparecimentoOpen, setNutritionistDeclaracaoComparecimentoOpen] =
    useState(false)
  const [fonoaudiologoDeclaracaoComparecimentoOpen, setFonoaudiologoDeclaracaoComparecimentoOpen] =
    useState(false)
  const [fonoaudiologoRelatorioOpen, setFonoaudiologoRelatorioOpen] = useState(false)
  const [fonoaudiologoLaudoOpen, setFonoaudiologoLaudoOpen] = useState(false)
  const [fonoaudiologoParecerOpen, setFonoaudiologoParecerOpen] = useState(false)
  const [fonoaudiologoAtestadoOpen, setFonoaudiologoAtestadoOpen] = useState(false)
  const [fonoaudiologoPlanoTerapeuticoOpen, setFonoaudiologoPlanoTerapeuticoOpen] = useState(false)
  const [fonoaudiologoResultadoAvaliacaoOpen, setFonoaudiologoResultadoAvaliacaoOpen] =
    useState(false)
  const [fonoaudiologoEncaminhamentoOpen, setFonoaudiologoEncaminhamentoOpen] = useState(false)
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
    (kind: DemoClinicalDocumentKind) => {
      if (isDemoPsychologistDocumentKind(kind)) {
        if (kind === 'atestado_psicologico') {
          setPsychologistAtestadoOpen(true)
          return
        }
        if (kind === 'relatorio_psicologico') {
          setPsychologistRelatorioOpen(true)
          return
        }
        if (kind === 'relatorio_multiprofissional') {
          setPsychologistRelatorioMultiprofissionalOpen(true)
          return
        }
        if (kind === 'laudo_psicologico') {
          setPsychologistLaudoOpen(true)
          return
        }
        if (kind === 'parecer_psicologico') {
          setPsychologistParecerOpen(true)
          return
        }
        if (kind === 'encaminhamento_psicologico') {
          setPsychologistEncaminhamentoOpen(true)
          return
        }
      }

      if (isDemoNutritionistDocumentKind(kind)) {
        if (kind === 'plano_alimentar') {
          setNutritionistPlanoAlimentarOpen(true)
          return
        }
        if (kind === 'prescricao_dietetica') {
          setNutritionistPrescricaoDieteticaOpen(true)
          return
        }
        if (kind === 'prescricao_suplementos') {
          setNutritionistPrescricaoSuplementosOpen(true)
          return
        }
        if (kind === 'pedido_exame_nutricional') {
          setExamRequestTargetKind('pedido_exame_nutricional')
          setExamRequestOpen(true)
          return
        }
        if (kind === 'relatorio_nutricional') {
          setNutritionistRelatorioOpen(true)
          return
        }
        if (kind === 'parecer_nutricional') {
          setNutritionistParecerOpen(true)
          return
        }
        if (kind === 'laudo_nutricional') {
          setNutritionistLaudoOpen(true)
          return
        }
        if (kind === 'declaracao_comparecimento_nutricional') {
          setNutritionistDeclaracaoComparecimentoOpen(true)
          return
        }
      }

      if (isDemoFonoaudiologoDocumentKind(kind)) {
        if (kind === 'declaracao_comparecimento_fonoaudiologico') {
          setFonoaudiologoDeclaracaoComparecimentoOpen(true)
          return
        }
        if (kind === 'relatorio_fonoaudiologico') {
          setFonoaudiologoRelatorioOpen(true)
          return
        }
        if (kind === 'laudo_fonoaudiologico') {
          setFonoaudiologoLaudoOpen(true)
          return
        }
        if (kind === 'parecer_fonoaudiologico') {
          setFonoaudiologoParecerOpen(true)
          return
        }
        if (kind === 'atestado_fonoaudiologico') {
          setFonoaudiologoAtestadoOpen(true)
          return
        }
        if (kind === 'plano_terapeutico_fonoaudiologico') {
          setFonoaudiologoPlanoTerapeuticoOpen(true)
          return
        }
        if (kind === 'resultado_avaliacao_fonoaudiologico') {
          setFonoaudiologoResultadoAvaliacaoOpen(true)
          return
        }
        if (kind === 'encaminhamento_fonoaudiologico') {
          setFonoaudiologoEncaminhamentoOpen(true)
          return
        }
      }

      const medicalKind = kind as DoctorClinicalDocumentKind
      if (medicalKind === 'pedido_exame') {
        setExamRequestTargetKind('pedido_exame')
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
        if (examRequestTargetKind === 'pedido_exame_nutricional') {
          const pedidoExameNutricional = mapExamModalToNutritionistPedidoExame(payload)
          const urgent = pedidoExameNutricional.urgent === true
          const fallbackPayload = buildNutritionistPedidoExameClinicalDocumentPayload({
            context: documentContext,
            pedidoExameNutricional,
          })
          const result = await emitDemoClinicalDocument({
            apiBody: {
              kind: 'pedido_exame_nutricional',
              context: buildDemoClinicalDocumentContext(documentContext),
              pedidoExameNutricional,
            },
            fallbackPayload,
            titulo: urgent ? 'Pedido de exames (urgente)' : 'Pedido de exames',
            fileName: 'pedido-exames.pdf',
          })
          appendGeneratedDocument(result.document, result.blobUrl)
          setExamRequestOpen(false)
          return
        }

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
    [appendGeneratedDocument, documentContext, examRequestTargetKind],
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

  const psychologistPatient = {
    name: attendanceSession.patientName,
    cpfMasked: attendanceSession.patientCpfMasked,
    ageGenderLabel: snapshot.patientAgeGender,
  }

  const psychologistProfessional = {
    name: professionProfile.doctorName,
    specialty: professionProfile.doctorSpecialty,
    councilLabel: professionProfile.doctorCouncilLabel,
    councilRegistration: professionProfile.doctorCouncilRegistration,
  }

  const handlePsychologistAtestadoSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/psicologo/PsychologistAtestadoModal').PsychologistAtestadoSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildPsychologistAtestadoClinicalDocumentPayload({
          context: documentContext,
          atestado: payload,
        })
        const documentMeta =
          payload.tipo === 'comparecimento'
            ? {
                titulo: 'Atestado psicológico de comparecimento',
                fileName: 'atestado-psicologico-comparecimento.pdf',
              }
            : {
                titulo: `Atestado psicológico (${payload.diasAfastamento} dia(s))`,
                fileName: 'atestado-psicologico.pdf',
              }
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'atestado_psicologico',
            context: buildDemoClinicalDocumentContext(documentContext),
            atestadoPsicologico: payload,
          },
          fallbackPayload,
          titulo: documentMeta.titulo,
          fileName: documentMeta.fileName,
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setPsychologistAtestadoOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o atestado psicológico.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handlePsychologistRelatorioSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/psicologo/PsychologistRelatorioModal').PsychologistRelatorioSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildPsychologistRelatorioClinicalDocumentPayload({
          context: documentContext,
          relatorio: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'relatorio_psicologico',
            context: buildDemoClinicalDocumentContext(documentContext),
            relatorioPsicologico: payload,
          },
          fallbackPayload,
          titulo: 'Relatório psicológico',
          fileName: 'relatorio-psicologico.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setPsychologistRelatorioOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o relatório psicológico.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handlePsychologistRelatorioMultiprofissionalSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/psicologo/PsychologistRelatorioMultiprofissionalModal').PsychologistRelatorioMultiprofissionalSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildPsychologistRelatorioMultiprofissionalClinicalDocumentPayload({
          context: documentContext,
          relatorio: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'relatorio_multiprofissional',
            context: buildDemoClinicalDocumentContext(documentContext),
            relatorioMultiprofissional: payload,
          },
          fallbackPayload,
          titulo: 'Relatório multiprofissional',
          fileName: 'relatorio-multiprofissional.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setPsychologistRelatorioMultiprofissionalOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível gerar o relatório multiprofissional.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handlePsychologistLaudoSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/psicologo/PsychologistLaudoModal').PsychologistLaudoSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildPsychologistLaudoClinicalDocumentPayload({
          context: documentContext,
          laudo: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'laudo_psicologico',
            context: buildDemoClinicalDocumentContext(documentContext),
            laudoPsicologico: payload,
          },
          fallbackPayload,
          titulo: 'Laudo psicológico',
          fileName: 'laudo-psicologico.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setPsychologistLaudoOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o laudo psicológico.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handlePsychologistParecerSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/psicologo/PsychologistParecerModal').PsychologistParecerSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildPsychologistParecerClinicalDocumentPayload({
          context: documentContext,
          parecer: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'parecer_psicologico',
            context: buildDemoClinicalDocumentContext(documentContext),
            parecerPsicologico: payload,
          },
          fallbackPayload,
          titulo: 'Parecer psicológico',
          fileName: 'parecer-psicologico.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setPsychologistParecerOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o parecer psicológico.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handlePsychologistEncaminhamentoSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/psicologo/PsychologistEncaminhamentoModal').PsychologistEncaminhamentoSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildPsychologistEncaminhamentoClinicalDocumentPayload({
          context: documentContext,
          encaminhamento: payload,
        })
        const urgent = payload.prioridade === 'urgente'
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'encaminhamento_psicologico',
            context: buildDemoClinicalDocumentContext(documentContext),
            encaminhamentoPsicologico: payload,
          },
          fallbackPayload,
          titulo: urgent ? 'Encaminhamento psicológico (urgente)' : 'Encaminhamento psicológico',
          fileName: 'encaminhamento-psicologico.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setPsychologistEncaminhamentoOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o encaminhamento psicológico.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleNutritionistPlanoAlimentarSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/nutricionista/NutritionistPlanoAlimentarModal').NutritionistPlanoAlimentarSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildNutritionistPlanoAlimentarClinicalDocumentPayload({
          context: documentContext,
          planoAlimentar: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'plano_alimentar',
            context: buildDemoClinicalDocumentContext(documentContext),
            planoAlimentar: payload,
          },
          fallbackPayload,
          titulo: 'Plano alimentar',
          fileName: 'plano-alimentar.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setNutritionistPlanoAlimentarOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o plano alimentar.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleNutritionistPrescricaoDieteticaSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/nutricionista/NutritionistPrescricaoDieteticaModal').NutritionistPrescricaoDieteticaSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildNutritionistPrescricaoDieteticaClinicalDocumentPayload({
          context: documentContext,
          prescricaoDietetica: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'prescricao_dietetica',
            context: buildDemoClinicalDocumentContext(documentContext),
            prescricaoDietetica: payload,
          },
          fallbackPayload,
          titulo: 'Prescrição dietética',
          fileName: 'prescricao-dietetica.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setNutritionistPrescricaoDieteticaOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar a prescrição dietética.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleNutritionistPrescricaoSuplementosSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/nutricionista/NutritionistPrescricaoSuplementosModal').NutritionistPrescricaoSuplementosSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildNutritionistPrescricaoSuplementosClinicalDocumentPayload({
          context: documentContext,
          prescricaoSuplementos: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'prescricao_suplementos',
            context: buildDemoClinicalDocumentContext(documentContext),
            prescricaoSuplementos: payload,
          },
          fallbackPayload,
          titulo: 'Prescrição de suplementos',
          fileName: 'prescricao-suplementos.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setNutritionistPrescricaoSuplementosOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível gerar a prescrição de suplementos.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleNutritionistRelatorioSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/nutricionista/NutritionistRelatorioModal').NutritionistRelatorioSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildNutritionistRelatorioClinicalDocumentPayload({
          context: documentContext,
          relatorioNutricional: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'relatorio_nutricional',
            context: buildDemoClinicalDocumentContext(documentContext),
            relatorioNutricional: payload,
          },
          fallbackPayload,
          titulo: 'Relatório nutricional',
          fileName: 'relatorio-nutricional.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setNutritionistRelatorioOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o relatório nutricional.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleNutritionistParecerSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/nutricionista/NutritionistParecerModal').NutritionistParecerSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildNutritionistParecerClinicalDocumentPayload({
          context: documentContext,
          parecerNutricional: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'parecer_nutricional',
            context: buildDemoClinicalDocumentContext(documentContext),
            parecerNutricional: payload,
          },
          fallbackPayload,
          titulo: 'Parecer nutricional',
          fileName: 'parecer-nutricional.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setNutritionistParecerOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o parecer nutricional.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleNutritionistLaudoSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/nutricionista/NutritionistLaudoModal').NutritionistLaudoSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildNutritionistLaudoClinicalDocumentPayload({
          context: documentContext,
          laudoNutricional: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'laudo_nutricional',
            context: buildDemoClinicalDocumentContext(documentContext),
            laudoNutricional: payload,
          },
          fallbackPayload,
          titulo: 'Laudo / avaliação nutricional',
          fileName: 'laudo-nutricional.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setNutritionistLaudoOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o laudo nutricional.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleNutritionistDeclaracaoComparecimentoSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/nutricionista/NutritionistDeclaracaoComparecimentoModal').NutritionistDeclaracaoComparecimentoSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildNutritionistDeclaracaoComparecimentoClinicalDocumentPayload({
          context: documentContext,
          declaracaoComparecimentoNutricional: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'declaracao_comparecimento_nutricional',
            context: buildDemoClinicalDocumentContext(documentContext),
            declaracaoComparecimentoNutricional: payload,
          },
          fallbackPayload,
          titulo: 'Declaração de comparecimento',
          fileName: 'declaracao-comparecimento-nutricional.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setNutritionistDeclaracaoComparecimentoOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível gerar a declaração de comparecimento.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleFonoaudiologoDeclaracaoComparecimentoSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/fonoaudiologo/FonoaudiologoDeclaracaoComparecimentoModal').FonoaudiologoDeclaracaoComparecimentoSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildFonoaudiologoDeclaracaoComparecimentoClinicalDocumentPayload({
          context: documentContext,
          declaracaoComparecimentoFonoaudiologico: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'declaracao_comparecimento_fonoaudiologico',
            context: buildDemoClinicalDocumentContext(documentContext),
            declaracaoComparecimentoFonoaudiologico: payload,
          },
          fallbackPayload,
          titulo: 'Declaração de comparecimento',
          fileName: 'declaracao-comparecimento-fonoaudiologico.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setFonoaudiologoDeclaracaoComparecimentoOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível gerar a declaração de comparecimento.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleFonoaudiologoRelatorioSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/fonoaudiologo/FonoaudiologoRelatorioModal').FonoaudiologoRelatorioSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildFonoaudiologoRelatorioClinicalDocumentPayload({
          context: documentContext,
          relatorioFonoaudiologico: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'relatorio_fonoaudiologico',
            context: buildDemoClinicalDocumentContext(documentContext),
            relatorioFonoaudiologico: payload,
          },
          fallbackPayload,
          titulo: 'Relatório fonoaudiológico',
          fileName: 'relatorio-fonoaudiologico.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setFonoaudiologoRelatorioOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o relatório fonoaudiológico.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleFonoaudiologoLaudoSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/fonoaudiologo/FonoaudiologoLaudoModal').FonoaudiologoLaudoSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildFonoaudiologoLaudoClinicalDocumentPayload({
          context: documentContext,
          laudoFonoaudiologico: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'laudo_fonoaudiologico',
            context: buildDemoClinicalDocumentContext(documentContext),
            laudoFonoaudiologico: payload,
          },
          fallbackPayload,
          titulo: 'Laudo fonoaudiológico',
          fileName: 'laudo-fonoaudiologico.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setFonoaudiologoLaudoOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o laudo fonoaudiológico.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleFonoaudiologoParecerSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/fonoaudiologo/FonoaudiologoParecerModal').FonoaudiologoParecerSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildFonoaudiologoParecerClinicalDocumentPayload({
          context: documentContext,
          parecerFonoaudiologico: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'parecer_fonoaudiologico',
            context: buildDemoClinicalDocumentContext(documentContext),
            parecerFonoaudiologico: payload,
          },
          fallbackPayload,
          titulo: 'Parecer fonoaudiológico',
          fileName: 'parecer-fonoaudiologico.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setFonoaudiologoParecerOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o parecer fonoaudiológico.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleFonoaudiologoAtestadoSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/fonoaudiologo/FonoaudiologoAtestadoModal').FonoaudiologoAtestadoSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildFonoaudiologoAtestadoClinicalDocumentPayload({
          context: documentContext,
          atestadoFonoaudiologico: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'atestado_fonoaudiologico',
            context: buildDemoClinicalDocumentContext(documentContext),
            atestadoFonoaudiologico: payload,
          },
          fallbackPayload,
          titulo: 'Atestado fonoaudiológico',
          fileName: 'atestado-fonoaudiologico.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setFonoaudiologoAtestadoOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error ? error.message : 'Não foi possível gerar o atestado fonoaudiológico.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleFonoaudiologoPlanoTerapeuticoSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/fonoaudiologo/FonoaudiologoPlanoTerapeuticoModal').FonoaudiologoPlanoTerapeuticoSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildFonoaudiologoPlanoTerapeuticoClinicalDocumentPayload({
          context: documentContext,
          planoTerapeuticoFonoaudiologico: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'plano_terapeutico_fonoaudiologico',
            context: buildDemoClinicalDocumentContext(documentContext),
            planoTerapeuticoFonoaudiologico: payload,
          },
          fallbackPayload,
          titulo: 'Plano terapêutico fonoaudiológico',
          fileName: 'plano-terapeutico-fonoaudiologico.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setFonoaudiologoPlanoTerapeuticoOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível gerar o plano terapêutico fonoaudiológico.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleFonoaudiologoResultadoAvaliacaoSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/fonoaudiologo/FonoaudiologoResultadoAvaliacaoModal').FonoaudiologoResultadoAvaliacaoSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildFonoaudiologoResultadoAvaliacaoClinicalDocumentPayload({
          context: documentContext,
          resultadoAvaliacaoFonoaudiologico: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'resultado_avaliacao_fonoaudiologico',
            context: buildDemoClinicalDocumentContext(documentContext),
            resultadoAvaliacaoFonoaudiologico: payload,
          },
          fallbackPayload,
          titulo: 'Resultado de avaliação / exame fonoaudiológico',
          fileName: 'resultado-avaliacao-fonoaudiologico.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setFonoaudiologoResultadoAvaliacaoOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível gerar o resultado de avaliação/exame.',
        )
      } finally {
        setEmittingDocument(false)
      }
    },
    [appendGeneratedDocument, documentContext],
  )

  const handleFonoaudiologoEncaminhamentoSigned = useCallback(
    async (
      payload: import('../components/attendance/doctor/demo/fonoaudiologo/FonoaudiologoEncaminhamentoModal').FonoaudiologoEncaminhamentoSignedPayload,
    ) => {
      setEmittingDocument(true)
      setErrorToastMessage(null)
      try {
        const fallbackPayload = buildFonoaudiologoEncaminhamentoClinicalDocumentPayload({
          context: documentContext,
          encaminhamentoFonoaudiologico: payload,
        })
        const result = await emitDemoClinicalDocument({
          apiBody: {
            kind: 'encaminhamento_fonoaudiologico',
            context: buildDemoClinicalDocumentContext(documentContext),
            encaminhamentoFonoaudiologico: payload,
          },
          fallbackPayload,
          titulo: 'Encaminhamento fonoaudiológico',
          fileName: 'encaminhamento-fonoaudiologico.pdf',
        })
        appendGeneratedDocument(result.document, result.blobUrl)
        setFonoaudiologoEncaminhamentoOpen(false)
      } catch (error) {
        setErrorToastMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível gerar o encaminhamento fonoaudiológico.',
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
        (teleconsulta em andamento com paciente fictício). Use o seletor de profissão para visualizar
        os documentos de cada categoria. PDFs reais são gerados para visualização.
      </div>

      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col px-3 sm:px-5">
        <DemoConsultationHeader
          elapsed={elapsed}
          startedAtLabel={formatStartedAtLabel(snapshot.startedAtIso)}
          headerTitle={professionProfile.headerTitle}
          profession={demoProfession}
          onProfessionChange={setDemoProfession}
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

      <PsychologistAtestadoModal
        open={psychologistAtestadoOpen}
        onClose={() => setPsychologistAtestadoOpen(false)}
        onSigned={handlePsychologistAtestadoSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <PsychologistRelatorioModal
        open={psychologistRelatorioOpen}
        onClose={() => setPsychologistRelatorioOpen(false)}
        onSigned={handlePsychologistRelatorioSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <PsychologistRelatorioMultiprofissionalModal
        open={psychologistRelatorioMultiprofissionalOpen}
        onClose={() => setPsychologistRelatorioMultiprofissionalOpen(false)}
        onSigned={handlePsychologistRelatorioMultiprofissionalSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <PsychologistLaudoModal
        open={psychologistLaudoOpen}
        onClose={() => setPsychologistLaudoOpen(false)}
        onSigned={handlePsychologistLaudoSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <PsychologistParecerModal
        open={psychologistParecerOpen}
        onClose={() => setPsychologistParecerOpen(false)}
        onSigned={handlePsychologistParecerSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <PsychologistEncaminhamentoModal
        open={psychologistEncaminhamentoOpen}
        onClose={() => setPsychologistEncaminhamentoOpen(false)}
        onSigned={handlePsychologistEncaminhamentoSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <NutritionistPlanoAlimentarModal
        open={nutritionistPlanoAlimentarOpen}
        onClose={() => setNutritionistPlanoAlimentarOpen(false)}
        onSigned={handleNutritionistPlanoAlimentarSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <NutritionistPrescricaoDieteticaModal
        open={nutritionistPrescricaoDieteticaOpen}
        onClose={() => setNutritionistPrescricaoDieteticaOpen(false)}
        onSigned={handleNutritionistPrescricaoDieteticaSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <NutritionistPrescricaoSuplementosModal
        open={nutritionistPrescricaoSuplementosOpen}
        onClose={() => setNutritionistPrescricaoSuplementosOpen(false)}
        onSigned={handleNutritionistPrescricaoSuplementosSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <NutritionistRelatorioModal
        open={nutritionistRelatorioOpen}
        onClose={() => setNutritionistRelatorioOpen(false)}
        onSigned={handleNutritionistRelatorioSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <NutritionistParecerModal
        open={nutritionistParecerOpen}
        onClose={() => setNutritionistParecerOpen(false)}
        onSigned={handleNutritionistParecerSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <NutritionistLaudoModal
        open={nutritionistLaudoOpen}
        onClose={() => setNutritionistLaudoOpen(false)}
        onSigned={handleNutritionistLaudoSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <NutritionistDeclaracaoComparecimentoModal
        open={nutritionistDeclaracaoComparecimentoOpen}
        onClose={() => setNutritionistDeclaracaoComparecimentoOpen(false)}
        onSigned={handleNutritionistDeclaracaoComparecimentoSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <FonoaudiologoDeclaracaoComparecimentoModal
        open={fonoaudiologoDeclaracaoComparecimentoOpen}
        onClose={() => setFonoaudiologoDeclaracaoComparecimentoOpen(false)}
        onSigned={handleFonoaudiologoDeclaracaoComparecimentoSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <FonoaudiologoRelatorioModal
        open={fonoaudiologoRelatorioOpen}
        onClose={() => setFonoaudiologoRelatorioOpen(false)}
        onSigned={handleFonoaudiologoRelatorioSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <FonoaudiologoLaudoModal
        open={fonoaudiologoLaudoOpen}
        onClose={() => setFonoaudiologoLaudoOpen(false)}
        onSigned={handleFonoaudiologoLaudoSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <FonoaudiologoParecerModal
        open={fonoaudiologoParecerOpen}
        onClose={() => setFonoaudiologoParecerOpen(false)}
        onSigned={handleFonoaudiologoParecerSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <FonoaudiologoAtestadoModal
        open={fonoaudiologoAtestadoOpen}
        onClose={() => setFonoaudiologoAtestadoOpen(false)}
        onSigned={handleFonoaudiologoAtestadoSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <FonoaudiologoPlanoTerapeuticoModal
        open={fonoaudiologoPlanoTerapeuticoOpen}
        onClose={() => setFonoaudiologoPlanoTerapeuticoOpen(false)}
        onSigned={handleFonoaudiologoPlanoTerapeuticoSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <FonoaudiologoResultadoAvaliacaoModal
        open={fonoaudiologoResultadoAvaliacaoOpen}
        onClose={() => setFonoaudiologoResultadoAvaliacaoOpen(false)}
        onSigned={handleFonoaudiologoResultadoAvaliacaoSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <FonoaudiologoEncaminhamentoModal
        open={fonoaudiologoEncaminhamentoOpen}
        onClose={() => setFonoaudiologoEncaminhamentoOpen(false)}
        onSigned={handleFonoaudiologoEncaminhamentoSigned}
        patient={psychologistPatient}
        professional={psychologistProfessional}
      />

      <DoctorClinicalTriageDrawer
        open={triageDrawerOpen}
        onClose={() => setTriageDrawerOpen(false)}
        patientName={attendanceSession.patientName}
        patientAgeGender={snapshot.patientAgeGender}
        unitName={attendanceSession.unitName}
        triageSummary={professionProfile.triageSummary}
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
