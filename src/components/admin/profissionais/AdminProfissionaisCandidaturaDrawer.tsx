import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  History,
  Mail,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { ConsultationChatAttachment } from '../../attendance/consultationChatTypes'
import { ConsultationChatAttachmentViewer } from '../../attendance/ConsultationChatAttachmentViewer'
import { ClosureSuccessLottie } from '../../profissional/financeiro/ClosureSuccessLottie'
import type {
  AdminCandidaturaDocument,
  AdminCandidaturaDocumentStatus,
  AdminProfissionalCandidatura,
} from '../../../types/adminProfissionais'
import { AdminCandidaturaStatusBadge } from './AdminCandidaturaStatusBadge'
import {
  adminCandidaturaDocumentStatusConfig,
  allRequiredDocumentsEffectivelyApproved,
  candidaturaDocumentToAttachment,
  allDocumentsHandledForReview,
  buildCorrectionRequestMessage,
  buildSubmittedCorrectionReview,
  countEffectiveApprovedDocuments,
  getSubmittedCorrectionDocuments,
  inferDataFieldsFromCorrectionNote,
  isDocumentEffectivelyApproved,
  documentsNeedingAttention,
  findLatestCorrectionMessage,
  formatBirthDateDisplay,
  formatCpfDisplay,
  getEmpresaStatusLabel,
  hasCorrectionDraft,
  isCandidaturaEmDecisao,
  isCandidaturaReenvio,
  isCandidaturaReviewingSubmittedCorrections,
  type DataFieldHighlight,
  type SubmittedCorrectionReview,
} from './adminProfissionaisUi'

type Step = 1 | 2 | 3
type DrawerTab = 'analise' | 'historico'
type AnalysisMode = 'primeira' | 'reenvio'

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: 'Informações' },
  { id: 2, label: 'Documentos' },
  { id: 3, label: 'Decisão' },
]

const drawerShellClass =
  'absolute inset-y-0 right-0 z-10 flex h-full w-full max-w-3xl flex-col overflow-hidden border-l border-gray-200/90 bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none'

const FLOW_SUCCESS_AUTO_CLOSE_MS = 3200

type FlowOutcomeKind = 'approved' | 'rejected' | 'complement'

type FlowOutcome = {
  kind: FlowOutcomeKind
  candidateName: string
  email: string
  accessCode?: string
}

type AdminProfissionaisCandidaturaDrawerProps = {
  candidatura: AdminProfissionalCandidatura | null
  open: boolean
  closing: boolean
  canApprove: boolean
  isDetailLoading?: boolean
  onClose: () => void
  onTransitionEnd: () => void
  onToast: (message: string) => void
  actions: {
    reviewDocument: (
      documentoId: string,
      status: AdminCandidaturaDocumentStatus,
      motivoReprovacao?: string,
    ) => Promise<AdminProfissionalCandidatura>
    approve: () => Promise<{ candidatura: AdminProfissionalCandidatura; accessCode?: string }>
    reject: (motivo: string) => Promise<AdminProfissionalCandidatura>
    requestCorrection: (
      mensagem: string,
      documentoIds: string[],
    ) => Promise<AdminProfissionalCandidatura>
  }
}

function resolveAnalysisMode(candidatura: AdminProfissionalCandidatura): AnalysisMode {
  if (isCandidaturaReenvio(candidatura.status)) return 'reenvio'
  if (isCandidaturaReviewingSubmittedCorrections(candidatura.timeline)) return 'reenvio'
  return 'primeira'
}

function resolveInitialStep(
  candidatura: AdminProfissionalCandidatura,
  mode: AnalysisMode,
  submittedReview: SubmittedCorrectionReview | null,
): Step {
  if (mode !== 'reenvio') return 1

  if (submittedReview) {
    const submittedDocs = getSubmittedCorrectionDocuments(candidatura.documents, submittedReview)
    if (submittedDocs.length > 0) return 2
    if (submittedReview.includesData) return 1
  }

  return 2
}

function resolveInitialMaxStep(mode: AnalysisMode): Step {
  return mode === 'reenvio' ? 3 : 1
}

export function AdminProfissionaisCandidaturaDrawer({
  candidatura,
  open,
  closing,
  canApprove,
  onClose,
  onTransitionEnd,
  onToast,
  actions,
}: AdminProfissionaisCandidaturaDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [tab, setTab] = useState<DrawerTab>('analise')
  const [step, setStep] = useState<Step>(1)
  const [maxUnlockedStep, setMaxUnlockedStep] = useState<Step>(1)
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('primeira')
  const [local, setLocal] = useState<AdminProfissionalCandidatura | null>(null)
  const [dataCorrectionDraft, setDataCorrectionDraft] = useState('')
  const [documentApprovalDrafts, setDocumentApprovalDrafts] = useState<Set<string>>(() => new Set())
  const [documentCorrectionDrafts, setDocumentCorrectionDrafts] = useState<Record<string, string>>({})
  const initializedCandidaturaIdRef = useRef<string | null>(null)
  const [docRejectId, setDocRejectId] = useState<string | null>(null)
  const [docRejectReason, setDocRejectReason] = useState('')
  const [viewingAttachment, setViewingAttachment] = useState<ConsultationChatAttachment | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [flowOutcome, setFlowOutcome] = useState<FlowOutcome | null>(null)

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing
  const row = local
  const candidaturaId = candidatura?.id ?? null

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) {
      initializedCandidaturaIdRef.current = null
      return
    }
    if (!candidaturaId || !candidatura) return
    if (initializedCandidaturaIdRef.current === candidaturaId) return

    initializedCandidaturaIdRef.current = candidaturaId
    const mode = resolveAnalysisMode(candidatura)
    const submittedReview = buildSubmittedCorrectionReview(candidatura.timeline)
    setTab('analise')
    setAnalysisMode(mode)
    setStep(resolveInitialStep(candidatura, mode, submittedReview))
    setMaxUnlockedStep(resolveInitialMaxStep(mode))
    setDataCorrectionDraft('')
    setDocumentApprovalDrafts(new Set())
    setDocumentCorrectionDrafts({})
    setDocRejectId(null)
    setDocRejectReason('')
    setViewingAttachment(null)
    setFlowOutcome(null)
    setLocal(candidatura)
  }, [open, candidaturaId, candidatura])

  useEffect(() => {
    if (!open || !candidatura) return
    if (initializedCandidaturaIdRef.current !== candidatura.id) return
    setLocal(candidatura)
  }, [open, candidatura])

  useEffect(() => {
    if (!isActive) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  useEffect(() => {
    if (!flowOutcome || !open) return
    const timer = window.setTimeout(() => onClose(), FLOW_SUCCESS_AUTO_CLOSE_MS)
    return () => window.clearTimeout(timer)
  }, [flowOutcome, open, onClose])

  function completeFlow(kind: FlowOutcomeKind, accessCode?: string) {
    if (!row) return
    setFlowOutcome({
      kind,
      candidateName: row.fullName,
      email: row.email,
      ...(accessCode ? { accessCode } : {}),
    })
  }

  function markDocumentApproved(docId: string) {
    setDocumentApprovalDrafts((current) => new Set([...current, docId]))
    setDocumentCorrectionDrafts((current) => {
      const next = { ...current }
      delete next[docId]
      return next
    })
    setDocRejectId(null)
    setDocRejectReason('')
  }

  function clearDocumentApprovalDraft(docId: string) {
    setDocumentApprovalDrafts((current) => {
      const next = new Set(current)
      next.delete(docId)
      return next
    })
  }

  function markDocumentForCorrection(docId: string, reason: string) {
    setDocumentCorrectionDrafts((current) => ({ ...current, [docId]: reason }))
    setDocumentApprovalDrafts((current) => {
      const next = new Set(current)
      next.delete(docId)
      return next
    })
    setDocRejectId(null)
    setDocRejectReason('')
  }

  function clearDocumentCorrectionDraft(docId: string) {
    setDocumentCorrectionDrafts((current) => {
      const next = { ...current }
      delete next[docId]
      return next
    })
  }

  async function persistDocumentApprovalDrafts(
    candidatura: AdminProfissionalCandidatura,
  ): Promise<AdminProfissionalCandidatura> {
    const pendingApprovals = [...documentApprovalDrafts].filter((docId) => {
      const doc = candidatura.documents.find((item) => item.id === docId)
      return doc && doc.status !== 'aprovado'
    })

    let updated = candidatura
    for (const docId of pendingApprovals) {
      updated = await actions.reviewDocument(docId, 'aprovado')
    }

    if (pendingApprovals.length > 0) {
      setDocumentApprovalDrafts(new Set())
    }

    return updated
  }

  async function handleAdvanceToStep3() {
    if (!row || isSaving || !allDocsHandled) return

    setIsSaving(true)
    try {
      const updated = await persistDocumentApprovalDrafts(row)
      setLocal(updated)
      setMaxUnlockedStep(3)
      setStep(3)
    } catch {
      onToast('Não foi possível salvar as aprovações dos documentos.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleApprove() {
    if (!row || !canApprove || isSaving) return
    if (!allRequiredDocumentsEffectivelyApproved(row.documents, documentApprovalDrafts)) {
      onToast('Aprove todos os documentos antes.')
      setStep(2)
      return
    }

    setIsSaving(true)
    try {
      const synced = await persistDocumentApprovalDrafts(row)
      setLocal(synced)
      const result = await actions.approve()
      setLocal(result.candidatura)
      completeFlow('approved', result.accessCode)
    } catch (error: unknown) {
      onToast(error instanceof Error ? error.message : 'Não foi possível aprovar.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSendCorrectionRequest() {
    if (!row || isSaving) return

    const message = buildCorrectionRequestMessage(
      dataCorrectionDraft,
      row.documents,
      documentCorrectionDrafts,
    )
    if (!message.trim()) {
      onToast('Não há correções para enviar.')
      return
    }

    const rejectedEntries = Object.entries(documentCorrectionDrafts).filter(([, reason]) =>
      reason.trim(),
    )

    setIsSaving(true)
    try {
      let updated = await persistDocumentApprovalDrafts(row)

      for (const [docId, reason] of rejectedEntries) {
        updated = await actions.reviewDocument(docId, 'reprovado', reason.trim())
      }

      const documentoIds = rejectedEntries.map(([docId]) => docId)
      const final = await actions.requestCorrection(message, documentoIds)
      setLocal(final)
      completeFlow('complement')
    } catch {
      onToast('Não foi possível enviar a solicitação de correção.')
    } finally {
      setIsSaving(false)
    }
  }

  const canAct = Boolean(row && canApprove && !isSaving && isCandidaturaEmDecisao(row.status))
  const docsReady = row
    ? allRequiredDocumentsEffectivelyApproved(row.documents, documentApprovalDrafts)
    : false
  const approvedCount = row
    ? countEffectiveApprovedDocuments(row.documents, documentApprovalDrafts)
    : 0
  const totalDocs = row?.documents.length ?? 0
  const submittedReview = row ? buildSubmittedCorrectionReview(row.timeline) : null
  const reviewingSubmitted = Boolean(submittedReview)
  const reenvioDocs = row
    ? reviewingSubmitted
      ? getSubmittedCorrectionDocuments(row.documents, submittedReview!)
      : documentsNeedingAttention(row.documents, row.status)
    : []
  const step2Documents =
    analysisMode === 'reenvio' && reenvioDocs.length > 0 ? reenvioDocs : row?.documents ?? []
  const latestCorrectionMessage = row ? findLatestCorrectionMessage(row.timeline) : undefined
  const highlightedDataFields = submittedReview?.includesData
    ? inferDataFieldsFromCorrectionNote(submittedReview.requestedDataNote ?? 'dados pessoais')
    : null
  const hasDraftCorrections = hasCorrectionDraft(dataCorrectionDraft, documentCorrectionDrafts)
  const documentsForStep2Completion =
    analysisMode === 'reenvio'
      ? reenvioDocs
      : row?.documents ?? []
  const allDocsHandled = row
    ? documentsForStep2Completion.length === 0 ||
      allDocumentsHandledForReview(
        documentsForStep2Completion,
        documentCorrectionDrafts,
        documentApprovalDrafts,
      )
    : false
  const isDataOnlyReenvio =
    analysisMode === 'reenvio' && reenvioDocs.length === 0 && Boolean(submittedReview?.includesData)
  const canApproveCandidatura = docsReady && !hasDraftCorrections

  if (!isActive || !row) return null

  const documentReviewProps = {
    canReview: canApprove && canAct,
    docRejectId,
    docRejectReason,
    documentApprovalDrafts,
    documentCorrectionDrafts,
    onRejectReasonChange: setDocRejectReason,
    onStartReject: (id: string) => {
      setDocRejectId(id)
      setDocRejectReason(documentCorrectionDrafts[id] ?? '')
    },
    onCancelReject: () => {
      setDocRejectId(null)
      setDocRejectReason('')
    },
    onApprove: markDocumentApproved,
    onClearApprovalDraft: clearDocumentApprovalDraft,
    onMarkForCorrection: markDocumentForCorrection,
    onClearCorrectionDraft: clearDocumentCorrectionDraft,
    onView: (doc: AdminCandidaturaDocument) =>
      setViewingAttachment(candidaturaDocumentToAttachment(doc)),
    onToast,
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[9998] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${panelVisible ? 'opacity-100' : 'opacity-0'}`}
        aria-label="Fechar"
        onClick={() => {
          if (!flowOutcome) onClose()
        }}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-candidatura-title"
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && e.propertyName === 'transform') onTransitionEnd()
        }}
        className={`${drawerShellClass} ${panelVisible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {flowOutcome ? (
          <CandidaturaFlowSuccessPanel outcome={flowOutcome} />
        ) : (
          <>
        <header className="shrink-0 border-b border-gray-200 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="admin-candidatura-title" className="text-lg font-bold text-gray-900">
                {row.fullName}
              </h2>
              <p className="text-xs text-gray-500">
                {row.formationLabel} · {row.specialty}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AdminCandidaturaStatusBadge status={row.status} />
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex gap-1 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setTab('analise')}
              className={[
                'flex-1 rounded-md py-1.5 text-xs font-semibold transition',
                tab === 'analise' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500',
              ].join(' ')}
            >
              Análise
            </button>
            <button
              type="button"
              onClick={() => setTab('historico')}
              className={[
                'flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-semibold transition',
                tab === 'historico' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500',
              ].join(' ')}
            >
              <History className="h-3.5 w-3.5" />
              Histórico
            </button>
          </div>

          {tab === 'analise' ? (
            <div className="mt-3 flex items-center gap-2">
              {STEPS.map((item, index) => (
                <div key={item.id} className="flex min-w-0 flex-1 items-center gap-2">
                  <button
                    type="button"
                    disabled={item.id > maxUnlockedStep}
                    onClick={() => {
                      if (item.id > maxUnlockedStep) return
                      setStep(item.id)
                    }}
                    className={[
                      'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition',
                      item.id > maxUnlockedStep
                        ? 'cursor-not-allowed opacity-40'
                        : step === item.id
                          ? 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                          : 'text-gray-500 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                        step === item.id
                          ? 'btn-brand-gradient text-white'
                          : step > item.id
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-200 text-gray-600',
                      ].join(' ')}
                    >
                      {step > item.id ? <Check className="h-3 w-3" /> : item.id}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                  {index < STEPS.length - 1 ? (
                    <span className="h-px w-2 shrink-0 bg-gray-200" aria-hidden />
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </header>

        <div
          className={[
            'min-h-0 flex-1 px-5 py-3',
            tab === 'analise' && step === 1 ? 'overflow-hidden' : 'overflow-y-auto',
          ].join(' ')}
        >
          {tab === 'historico' ? (
            <ul className="space-y-2">
              {[...row.timeline].reverse().map((event) => (
                <li key={event.id} className="rounded-lg border border-gray-100 px-3 py-2.5">
                  <p className="text-[11px] text-gray-400">{event.atLabel}</p>
                  <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                  {event.detail ? (
                    <p className="mt-0.5 whitespace-pre-line text-xs text-gray-600">{event.detail}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          {tab === 'analise' && step === 1 ? (
            <CandidaturaDadosStep
              row={row}
              reenvioHighlightMessage={
                analysisMode === 'reenvio' && !reviewingSubmitted
                  ? latestCorrectionMessage
                  : undefined
              }
              submittedReview={submittedReview}
              highlightedDataFields={highlightedDataFields}
            />
          ) : null}

          {tab === 'analise' && step === 2 ? (
            <div className="space-y-3">
              {reviewingSubmitted && submittedReview ? (
                <CorrecoesRecebidasHighlightPanel review={submittedReview} documents={reenvioDocs} />
              ) : null}

              {analysisMode === 'reenvio' && !reviewingSubmitted ? (
                <ReenvioHighlightPanel
                  message={latestCorrectionMessage}
                  documents={reenvioDocs}
                />
              ) : analysisMode !== 'reenvio' ? (
                <p className="text-sm text-gray-600">
                  Aprove os documentos corretos. Se reprovar, descreva o motivo — a mensagem só é
                  enviada na etapa de decisão.
                </p>
              ) : null}

              {reviewingSubmitted && submittedReview?.requestedMessage ? (
                <ReenvioHighlightPanel
                  message={submittedReview.requestedMessage}
                  documents={reenvioDocs}
                  title="O que havíamos pedido"
                />
              ) : null}

              {isDataOnlyReenvio && latestCorrectionMessage ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                  A solicitação anterior refere-se aos dados cadastrais. Confira na etapa
                  Informações ou siga para a decisão se já validou.
                </p>
              ) : null}

              {!isDataOnlyReenvio ? (
              <ul className="space-y-3">
                {step2Documents.map((doc) => (
                  <DocumentReviewCard
                    key={doc.id}
                    doc={doc}
                    highlighted={analysisMode === 'reenvio'}
                    receivedFromCandidate={reviewingSubmitted && reenvioDocs.some((item) => item.id === doc.id)}
                    requestedNote={submittedReview?.requestedDocumentNotes[doc.label]}
                    {...documentReviewProps}
                  />
                ))}
              </ul>
              ) : null}

              {!isDataOnlyReenvio ? (
                <p className="text-center text-xs font-medium text-gray-500">
                  {approvedCount}/{totalDocs} aprovados
                </p>
              ) : null}
            </div>
          ) : null}

          {tab === 'analise' && step === 3 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Revise o que será comunicado ao candidato. Se não houver correções, aprove a
                candidatura.
              </p>

              {reviewingSubmitted && submittedReview ? (
                <CorrecoesRecebidasHighlightPanel review={submittedReview} documents={reenvioDocs} />
              ) : null}

              {analysisMode === 'reenvio' && latestCorrectionMessage && !reviewingSubmitted ? (
                <ReenvioHighlightPanel
                  message={latestCorrectionMessage}
                  documents={reenvioDocs}
                />
              ) : null}

              {reviewingSubmitted && submittedReview?.requestedMessage ? (
                <ReenvioHighlightPanel
                  message={submittedReview.requestedMessage}
                  documents={reenvioDocs}
                  title="O que havíamos pedido"
                />
              ) : null}

              {hasDraftCorrections ? (
                <CorrectionDraftSummary
                  dataCorrectionDraft={dataCorrectionDraft}
                  documents={row.documents}
                  documentCorrectionDrafts={documentCorrectionDrafts}
                />
              ) : analysisMode === 'reenvio' ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                  {reviewingSubmitted
                    ? isDataOnlyReenvio
                      ? 'Valide os dados destacados em Informações. Se estiverem corretos, aprove a candidatura.'
                      : 'Valide os itens destacados em verde. Se estiverem corretos, aprove. Caso contrário, registre nova correção.'
                    : isDataOnlyReenvio
                      ? 'Se os dados foram corrigidos conforme solicitado, aprove. Caso ainda falte algo, registre nova correção nas etapas anteriores.'
                      : 'Se os documentos destacados estão corretos, aprove. Caso ainda falte algo, registre nova correção antes de enviar.'}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Nenhuma correção pendente. Tudo certo para aprovar.
                </div>
              )}

              {analysisMode === 'reenvio' && reenvioDocs.length > 0 && !hasDraftCorrections ? (
                <section>
                  <p className="mb-2 text-sm font-semibold text-gray-900">
                    Confirme se o candidato corrigiu
                  </p>
                  <ul className="space-y-3">
                    {reenvioDocs.map((doc) => (
                      <DocumentReviewCard
                        key={doc.id}
                        doc={doc}
                        highlighted
                        receivedFromCandidate={reviewingSubmitted}
                        requestedNote={submittedReview?.requestedDocumentNotes[doc.label]}
                        {...documentReviewProps}
                      />
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>

        {canAct && tab === 'analise' ? (
          <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-4">
            {step === 1 && analysisMode === 'primeira' ? (
              <div className="space-y-2.5">
                <label className="block rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
                  <span className="text-[11px] font-bold text-amber-900">
                    Correção nos dados (opcional)
                  </span>
                  <textarea
                    value={dataCorrectionDraft}
                    onChange={(e) => setDataCorrectionDraft(e.target.value)}
                    rows={2}
                    placeholder="Ex.: Corrija o número do conselho."
                    className="mt-1.5 w-full resize-none rounded-md border border-amber-200/80 bg-white px-2.5 py-1.5 text-sm text-gray-800"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMaxUnlockedStep(2)
                    setStep(2)
                  }}
                  className="inline-flex w-full items-center justify-center gap-1 rounded-xl btn-brand-gradient py-2.5 text-sm font-semibold text-white"
                >
                  Ir para documentos
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            {step === 1 && analysisMode === 'reenvio' && reviewingSubmitted ? (
              <button
                type="button"
                onClick={() => setStep(isDataOnlyReenvio ? 3 : 2)}
                className="inline-flex w-full items-center justify-center gap-1 rounded-xl btn-brand-gradient py-2.5 text-sm font-semibold text-white"
              >
                {isDataOnlyReenvio ? 'Ir para decisão' : 'Ir para documentos reenviados'}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : null}

            {step === 2 ? (
              <div
                className={
                  analysisMode === 'primeira' ? 'grid grid-cols-[auto_1fr] gap-3' : 'grid grid-cols-1'
                }
              >
                {analysisMode === 'primeira' ? (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-gray-200 px-3 py-2.5"
                    aria-label="Voltar"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={!allDocsHandled || isSaving}
                  onClick={() => void handleAdvanceToStep3()}
                  className="inline-flex items-center justify-center gap-1 rounded-xl btn-brand-gradient py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isSaving ? 'Salvando…' : allDocsHandled ? 'Ir para decisão' : 'Conclua os documentos'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-3">
                {hasDraftCorrections ? (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void handleSendCorrectionRequest()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 py-3 text-sm font-bold text-amber-950 disabled:opacity-50"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Enviar solicitação ao candidato
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canApproveCandidatura || isSaving}
                    onClick={handleApprove}
                    className="w-full rounded-xl btn-brand-gradient py-3 text-sm font-bold text-white disabled:opacity-40"
                  >
                    Aprovar candidatura
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600"
                >
                  Voltar para documentos
                </button>
              </div>
            ) : null}
          </footer>
        ) : null}
          </>
        )}
      </aside>

      {viewingAttachment ? (
        <ConsultationChatAttachmentViewer
          attachment={viewingAttachment}
          onClose={() => setViewingAttachment(null)}
        />
      ) : null}
    </div>,
    document.body,
  )
}

function CandidaturaFlowSuccessPanel({ outcome }: { outcome: FlowOutcome }) {
  const copy = {
    approved: {
      title: 'Candidatura aprovada!',
      description: `O cadastro de ${outcome.candidateName} foi aprovado. O candidato receberá o código para finalizar o acesso.`,
      badge: 'Aprovado',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      cardClass: 'border-emerald-100 bg-emerald-50/70 text-emerald-900',
    },
    rejected: {
      title: 'Candidatura não aprovada',
      description: `A decisão foi registrada. ${outcome.candidateName} receberá sua mensagem por e-mail.`,
      badge: 'Reprovado',
      badgeClass: 'bg-red-100 text-red-800',
      cardClass: 'border-red-100 bg-red-50/70 text-red-900',
    },
    complement: {
      title: 'Complementação solicitada',
      description: `Pedimos ajustes ao candidato. Ele poderá corrigir pelo portal em Minha Candidatura.`,
      badge: 'Incompleto',
      badgeClass: 'bg-amber-100 text-amber-900',
      cardClass: 'border-amber-100 bg-amber-50/70 text-amber-950',
    },
  }[outcome.kind]

  return (
    <div
      className="flex min-h-full flex-col items-center justify-center px-6 py-10 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex h-[200px] w-[200px] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-50 via-white to-white ring-1 ring-emerald-100/80">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,rgba(16,185,129,0.14)_0%,transparent_70%)]"
          aria-hidden
        />
        <div className="relative z-10">
          <ClosureSuccessLottie />
        </div>
      </div>

      <span
        className={[
          'mt-5 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide',
          copy.badgeClass,
        ].join(' ')}
      >
        {copy.badge}
      </span>

      <h3 className="mt-3 text-xl font-bold text-gray-900">{copy.title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600">{copy.description}</p>

      <div
        className={[
          'mt-6 w-full max-w-md rounded-2xl border px-4 py-4 text-left ring-1',
          copy.cardClass,
        ].join(' ')}
      >
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
          <div className="min-w-0 text-sm leading-relaxed">
            <p className="font-semibold">{outcome.candidateName}</p>
            <p className="mt-0.5 opacity-90">{outcome.email}</p>
            {outcome.kind === 'approved' && outcome.accessCode ? (
              <p className="mt-2 font-mono text-xs font-bold tracking-wide">
                Código: {outcome.accessCode}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400">Fechando automaticamente…</p>
    </div>
  )
}

function CorrecoesRecebidasHighlightPanel({
  review,
  documents,
}: {
  review: SubmittedCorrectionReview
  documents: AdminCandidaturaDocument[]
}) {
  const items: string[] = []
  if (review.includesData) items.push('Dados pessoais')
  for (const doc of documents) {
    if (!items.includes(doc.label)) items.push(doc.label)
  }
  for (const label of review.documentLabels) {
    if (!items.some((item) => item.toLowerCase() === label.toLowerCase())) {
      items.push(label)
    }
  }

  return (
    <section className="rounded-xl border-2 border-emerald-400 bg-emerald-50 p-4 ring-2 ring-emerald-100">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-900">
        O candidato enviou correções
      </p>
      {review.submittedAtLabel ? (
        <p className="mt-1 text-[11px] text-emerald-800">{review.submittedAtLabel}</p>
      ) : null}
      {review.submittedSummary ? (
        <p className="mt-2 text-sm leading-relaxed text-emerald-950">{review.submittedSummary}</p>
      ) : null}
      {items.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {items.map((label) => (
            <li
              key={label}
              className="flex items-center gap-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-emerald-950"
            >
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-xs text-emerald-800">
        Valide os itens destacados em verde antes de aprovar ou solicitar nova correção.
      </p>
    </section>
  )
}

function ReenvioHighlightPanel({
  message,
  documents,
  title = 'Revisão do reenvio — o que pedimos',
}: {
  message?: string
  documents: AdminCandidaturaDocument[]
  title?: string
}) {
  return (
    <section className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 ring-2 ring-amber-100">
      <p className="text-xs font-bold uppercase tracking-wide text-amber-900">{title}</p>
      {message ? (
        <p className="mt-2 text-sm leading-relaxed text-amber-950">{message}</p>
      ) : (
        <p className="mt-2 text-sm text-amber-800">Valide apenas os itens destacados abaixo.</p>
      )}
      {documents.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5 text-xs"
            >
              <span className="font-semibold text-gray-900">{doc.label}</span>
              <span className="text-amber-800">
                {adminCandidaturaDocumentStatusConfig[doc.status].label}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function CorrectionDraftSummary({
  dataCorrectionDraft,
  documents,
  documentCorrectionDrafts,
}: {
  dataCorrectionDraft: string
  documents: AdminCandidaturaDocument[]
  documentCorrectionDrafts: Record<string, string>
}) {
  const dataNote = dataCorrectionDraft.trim()
  const docItems = documents
    .map((doc) => ({ doc, reason: documentCorrectionDrafts[doc.id]?.trim() }))
    .filter((item) => item.reason)

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
      <p className="text-sm font-bold text-amber-950">Será enviado ao candidato</p>
      {dataNote ? (
        <div className="mt-3 rounded-lg bg-white p-3 text-sm text-gray-800">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Dados pessoais</p>
          <p className="mt-1 whitespace-pre-line">{dataNote}</p>
        </div>
      ) : null}
      {docItems.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {docItems.map(({ doc, reason }) => (
            <li key={doc.id} className="rounded-lg bg-white p-3 text-sm text-gray-800">
              <p className="font-semibold text-gray-900">{doc.label}</p>
              <p className="mt-1 whitespace-pre-line text-gray-700">{reason}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function CandidaturaDadosStep({
  row,
  reenvioHighlightMessage,
  submittedReview,
  highlightedDataFields,
}: {
  row: AdminProfissionalCandidatura
  reenvioHighlightMessage?: string
  submittedReview?: SubmittedCorrectionReview | null
  highlightedDataFields?: Set<DataFieldHighlight> | null
}) {
  const extraSpecialties =
    row.specialties?.filter((item) => item.name && item.name !== row.specialty) ?? []
  const reviewingData = Boolean(submittedReview?.includesData && highlightedDataFields)

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {submittedReview?.includesData ? (
        <section className="shrink-0 rounded-lg border-2 border-emerald-400 bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-900">
            Dados corrigidos pelo candidato
          </p>
          {submittedReview.submittedAtLabel ? (
            <p className="mt-0.5 text-[10px] text-emerald-700">{submittedReview.submittedAtLabel}</p>
          ) : null}
          <p className="mt-1 text-xs leading-snug text-emerald-950">
            Confira os campos destacados abaixo e valide se atendem ao que foi solicitado.
          </p>
        </section>
      ) : null}

      {reenvioHighlightMessage ? (
        <section className="shrink-0 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900">
            O que pedimos ao candidato
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-amber-950">
            {reenvioHighlightMessage}
          </p>
        </section>
      ) : null}

      {submittedReview?.requestedDataNote ? (
        <section className="shrink-0 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900">
            O que havíamos pedido nos dados
          </p>
          <p className="mt-1 line-clamp-3 text-xs leading-snug text-amber-950">
            {submittedReview.requestedDataNote}
          </p>
        </section>
      ) : null}

      <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 bg-white text-sm">
        <CandidaturaDadosSection title="Dados pessoais">
          <CandidaturaDadosField label="CPF" value={formatCpfDisplay(row.cpf)} />
          <CandidaturaDadosField
            label="E-mail"
            value={row.email}
            highlighted={reviewingData && highlightedDataFields?.has('email')}
          />
          <CandidaturaDadosField
            label="Telefone"
            value={row.phone}
            highlighted={reviewingData && highlightedDataFields?.has('phone')}
          />
          <CandidaturaDadosField label="Nascimento" value={formatBirthDateDisplay(row.birthDate)} />
        </CandidaturaDadosSection>

        <CandidaturaDadosSection title="Dados profissionais">
          <CandidaturaDadosField label="Formação" value={row.formationLabel} />
          <CandidaturaDadosField label="Especialidade" value={row.specialty} />
          <CandidaturaDadosField
            label={row.councilLabel}
            value={`${row.councilNumber} / ${row.councilUf}`}
            highlighted={reviewingData && highlightedDataFields?.has('council')}
          />
          {row.rqe ? (
            <CandidaturaDadosField
              label="RQE"
              value={row.rqe}
              highlighted={reviewingData && highlightedDataFields?.has('rqe')}
            />
          ) : null}
          {extraSpecialties.length > 0 ? (
            <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                Outras esp.
              </span>
              {extraSpecialties.map((item) => (
                <span
                  key={`${item.name}-${item.rqe ?? ''}`}
                  className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-900"
                >
                  {item.name}
                  {item.rqe ? ` · RQE ${item.rqe}` : ''}
                </span>
              ))}
            </div>
          ) : null}
          {row.professionalDescription?.trim() ? (
            <div className="col-span-2 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Sobre</p>
              <p className="line-clamp-2 text-xs leading-snug text-gray-700">
                {row.professionalDescription}
              </p>
            </div>
          ) : null}
        </CandidaturaDadosSection>

        <CandidaturaDadosSection title="Endereço" columns={1}>
          <CandidaturaDadosField label="Endereço" value={row.addressSummary || '—'} fullWidth />
        </CandidaturaDadosSection>

        <CandidaturaDadosSection title="Empresa (PJ)">
          {row.empresa.status === 'vinculada' ? (
            <>
              <CandidaturaDadosField label="CNPJ" value={row.empresa.cnpj ?? ''} />
              <CandidaturaDadosField label="Razão social" value={row.empresa.razaoSocial ?? ''} />
              <CandidaturaDadosField
                label="Município"
                value={`${row.empresa.municipio ?? ''} / ${row.empresa.uf ?? ''}`}
                fullWidth
              />
            </>
          ) : (
            <CandidaturaDadosField
              label="Status"
              value={getEmpresaStatusLabel(row.empresa.status)}
              fullWidth
            />
          )}
        </CandidaturaDadosSection>
      </div>
    </div>
  )
}

function CandidaturaDadosSection({
  title,
  children,
  columns = 2,
}: {
  title: string
  children: ReactNode
  columns?: 1 | 2
}) {
  return (
    <section className="px-3 py-2">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">{title}</p>
      <div
        className={[
          'grid gap-x-4 gap-y-1.5',
          columns === 1 ? 'grid-cols-1' : 'grid-cols-2',
        ].join(' ')}
      >
        {children}
      </div>
    </section>
  )
}

function CandidaturaDadosField({
  label,
  value,
  fullWidth = false,
  highlighted = false,
}: {
  label: string
  value: string
  fullWidth?: boolean
  highlighted?: boolean
}) {
  return (
    <div
      className={[
        fullWidth ? 'col-span-2 min-w-0' : 'min-w-0',
        highlighted ? 'rounded-lg border border-emerald-300 bg-emerald-50/80 px-2 py-1.5 ring-1 ring-emerald-100' : '',
      ].join(' ')}
    >
      <p
        className={[
          'text-[10px] font-semibold',
          highlighted ? 'text-emerald-800' : 'text-gray-400',
        ].join(' ')}
      >
        {highlighted ? `${label} · corrigido` : label}
      </p>
      <p
        className={[
          'truncate text-sm font-medium',
          highlighted ? 'text-emerald-950' : 'text-gray-900',
        ].join(' ')}
      >
        {value || '—'}
      </p>
    </div>
  )
}

function DocumentReviewCard({
  doc,
  canReview,
  highlighted = false,
  receivedFromCandidate = false,
  requestedNote,
  docRejectId,
  docRejectReason,
  documentApprovalDrafts,
  documentCorrectionDrafts,
  onRejectReasonChange,
  onStartReject,
  onCancelReject,
  onApprove,
  onClearApprovalDraft,
  onMarkForCorrection,
  onClearCorrectionDraft,
  onView,
  onToast,
}: {
  doc: AdminCandidaturaDocument
  canReview: boolean
  highlighted?: boolean
  receivedFromCandidate?: boolean
  requestedNote?: string
  docRejectId: string | null
  docRejectReason: string
  documentApprovalDrafts: ReadonlySet<string>
  documentCorrectionDrafts: Record<string, string>
  onRejectReasonChange: (value: string) => void
  onStartReject: (id: string) => void
  onCancelReject: () => void
  onApprove: (id: string) => void
  onClearApprovalDraft: (id: string) => void
  onMarkForCorrection: (id: string, reason: string) => void
  onClearCorrectionDraft: (id: string) => void
  onView: (doc: AdminCandidaturaDocument) => void
  onToast: (message: string) => void
}) {
  const isRejecting = docRejectId === doc.id
  const draftReason = documentCorrectionDrafts[doc.id]?.trim()
  const markedForCorrection = Boolean(draftReason)
  const draftApproved =
    documentApprovalDrafts.has(doc.id) && doc.status !== 'aprovado'
  const effectivelyApproved = isDocumentEffectivelyApproved(doc, documentApprovalDrafts)
  const status = draftApproved
    ? { label: 'Aprovado', className: 'bg-emerald-50 text-emerald-700' }
    : markedForCorrection
      ? { label: 'Correção', className: 'bg-amber-50 text-amber-800' }
      : adminCandidaturaDocumentStatusConfig[doc.status]

  const emphasisClass = receivedFromCandidate
    ? 'border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-200'
    : highlighted
      ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-200'
      : 'border-gray-200'

  return (
    <li
      className={[
        'rounded-xl border p-3',
        emphasisClass,
        markedForCorrection ? 'border-amber-400 bg-amber-50/60' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-900">{doc.label}</p>
            {receivedFromCandidate ? (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Reenviado
              </span>
            ) : null}
          </div>
          <p className="truncate text-xs text-gray-500">{doc.fileName}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
          {status.label}
        </span>
      </div>

      {requestedNote ? (
        <p className="mt-1.5 rounded-md border border-amber-200/80 bg-amber-50/80 px-2 py-1 text-xs text-amber-950">
          <span className="font-semibold">Tínhamos pedido:</span> {requestedNote}
        </p>
      ) : null}

      {doc.rejectReason && !requestedNote ? (
        <p className="mt-1.5 text-xs text-red-600">Pedido anterior: {doc.rejectReason}</p>
      ) : null}
      {markedForCorrection ? (
        <p className="mt-1.5 text-xs text-amber-900">
          <span className="font-semibold">Motivo registrado:</span> {draftReason}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onView(doc)}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-[var(--brand-primary)] hover:border-[var(--brand-primary)]/30 hover:bg-orange-50/50"
        >
          <Eye className="h-3.5 w-3.5" />
          Ver
        </button>
        {draftApproved ? (
          <button
            type="button"
            onClick={() => onClearApprovalDraft(doc.id)}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700"
          >
            Desfazer
          </button>
        ) : null}
        {markedForCorrection ? (
          <button
            type="button"
            onClick={() => onClearCorrectionDraft(doc.id)}
            className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700"
          >
            Desfazer
          </button>
        ) : null}
        {canReview && !effectivelyApproved && !markedForCorrection ? (
          isRejecting ? (
            <div className="w-full space-y-2">
              <textarea
                value={docRejectReason}
                onChange={(e) => onRejectReasonChange(e.target.value)}
                placeholder="Descreva o que o candidato deve corrigir neste documento"
                rows={2}
                className="w-full rounded-lg border border-amber-200/80 bg-white px-3 py-1.5 text-sm text-gray-800 outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onCancelReject}
                  className="flex-1 rounded-lg border border-gray-200 bg-white py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!docRejectReason.trim()) {
                      onToast('Informe o motivo da correção.')
                      return
                    }
                    onMarkForCorrection(doc.id, docRejectReason.trim())
                  }}
                  className="flex-1 rounded-lg border border-amber-500 bg-amber-600 py-1 text-xs font-semibold text-white hover:bg-amber-700"
                >
                  Registrar correção
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onApprove(doc.id)}
                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white"
              >
                Aprovar
              </button>
              <button
                type="button"
                onClick={() => onStartReject(doc.id)}
                className="rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-900"
              >
                Pedir correção
              </button>
            </>
          )
        ) : null}
      </div>
    </li>
  )
}
