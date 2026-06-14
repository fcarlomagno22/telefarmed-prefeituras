import type {
  AdminCandidaturaDocumentStatus,
  AdminCandidaturaEmpresaStatus,
  AdminCandidaturaStatus,
  AdminCandidaturaDocument,
} from '../../../types/adminProfissionais'
import type { SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'
import type { ConsultationChatAttachment } from '../../attendance/consultationChatTypes'
import { formatDatePtBr } from '../../../utils/calendar'

export const adminProfissionaisCardsRowClass = [
  'grid min-w-0 w-full shrink-0 items-stretch gap-4',
  'grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))]',
].join(' ')

export const adminCandidaturaStatusBadgeConfig: Record<
  AdminCandidaturaStatus,
  SituationStatusBadgeStyle
> = {
  pendente: {
    label: 'Pendente',
    text: 'text-blue-700',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(59,130,246,0.55)]',
  },
  incompleto: {
    label: 'Incompleto',
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(249,115,22,0.55)]',
  },
  aprovado: {
    label: 'Aprovado',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  reprovado: {
    label: 'Reprovado',
    text: 'text-red-700',
    accent: 'bg-gradient-to-r from-red-400 via-rose-500 to-orange-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(248,113,113,0.55)]',
  },
  em_analise: {
    label: 'Em análise',
    text: 'text-indigo-700',
    accent: 'bg-gradient-to-r from-indigo-400 via-violet-500 to-indigo-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(99,102,241,0.55)]',
  },
}

/** Candidatura ainda em triagem (documentos e/ou decisão final). */
export function isCandidaturaEmDecisao(status: AdminCandidaturaStatus): boolean {
  return status === 'pendente' || status === 'em_analise' || status === 'incompleto'
}

export function countApprovedDocuments(
  documents: { status: AdminCandidaturaDocumentStatus }[],
): number {
  return documents.filter((doc) => doc.status === 'aprovado').length
}

export const adminCandidaturaDocumentStatusConfig: Record<
  AdminCandidaturaDocumentStatus,
  { label: string; className: string }
> = {
  pendente: { label: 'Pendente', className: 'bg-orange-50 text-orange-700' },
  aprovado: { label: 'Aprovado', className: 'bg-emerald-50 text-emerald-700' },
  reprovado: { label: 'Reprovado', className: 'bg-red-50 text-red-700' },
}

export function getEmpresaStatusLabel(status: AdminCandidaturaEmpresaStatus): string {
  switch (status) {
    case 'nao_informado':
      return 'Será informado na finalização do cadastro'
    case 'aguardando_finalizacao':
      return 'Aguardando finalização (código enviado)'
    case 'vinculada':
      return 'Empresa vinculada'
    default:
      return status
  }
}

export function countPendingDocuments(
  documents: { status: AdminCandidaturaDocumentStatus }[],
): number {
  return documents.filter((doc) => doc.status === 'pendente').length
}

export function allRequiredDocumentsApproved(
  documents: { status: AdminCandidaturaDocumentStatus }[],
): boolean {
  return documents.length > 0 && documents.every((doc) => doc.status === 'aprovado')
}

export function allDocumentsReviewed(
  documents: { status: AdminCandidaturaDocumentStatus }[],
): boolean {
  return (
    documents.length > 0 &&
    documents.every((doc) => doc.status === 'aprovado' || doc.status === 'reprovado')
  )
}

/** Docs que exigem nova ação do admin (não conta pendente de primeira análise). */
export function documentsNeedingAttention(
  documents: AdminCandidaturaDocument[],
  candidaturaStatus: AdminCandidaturaStatus,
): AdminCandidaturaDocument[] {
  return documents.filter((doc) => {
    if (doc.status === 'reprovado') return true
    if (doc.complementRequestedAtLabel) return true
    if (doc.status === 'pendente' && candidaturaStatus === 'incompleto') return true
    return false
  })
}

export function findLatestCorrectionMessage(
  timeline: { title: string; detail?: string }[],
): string | undefined {
  const event = timeline.find((item) => item.title === 'Correção solicitada')
  return event?.detail?.trim() || undefined
}

export function findSubmittedCorrectionsEvent(
  timeline: { title: string; detail?: string; atLabel?: string }[],
) {
  return timeline.find((item) => item.title === 'Correções enviadas')
}

export function isCandidaturaReviewingSubmittedCorrections(
  timeline: { title: string }[],
): boolean {
  const submittedIdx = timeline.findIndex((item) => item.title === 'Correções enviadas')
  if (submittedIdx === -1) return false

  const correctionIdx = timeline.findIndex((item) => item.title === 'Correção solicitada')
  if (correctionIdx === -1) return false

  return submittedIdx < correctionIdx
}

export function parseCorrectionRequestMessage(message: string) {
  const documentNotes: Record<string, string> = {}
  let dataNote: string | undefined

  for (const part of message.split(/\n\n+/)) {
    const separatorIndex = part.indexOf(':\n')
    if (separatorIndex === -1) continue

    const title = part.slice(0, separatorIndex).trim()
    const note = part.slice(separatorIndex + 2).trim()
    if (!note) continue

    if (title === 'Dados pessoais') {
      dataNote = note
    } else {
      documentNotes[title] = note
    }
  }

  return { dataNote, documentNotes }
}

export function parseSubmittedCorrectionsDetail(detail?: string) {
  if (!detail?.trim()) {
    return { includesData: false, documentLabels: [] as string[] }
  }

  const normalized = detail.trim()
  const includesData = normalized.includes('dados pessoais')
  const match = /correções de (.+)\.?$/i.exec(normalized)
  const rest = match?.[1] ?? ''
  const parts = rest
    .split(' e ')
    .map((part) => part.trim())
    .filter(Boolean)

  const documentLabels = parts
    .filter((part) => part.toLowerCase() !== 'dados pessoais')
    .flatMap((part) =>
      part
        .split(',')
        .map((label) => label.trim())
        .filter(Boolean),
    )

  return { includesData, documentLabels }
}

export type SubmittedCorrectionReview = {
  submittedAtLabel?: string
  submittedSummary?: string
  includesData: boolean
  documentLabels: string[]
  requestedMessage?: string
  requestedDataNote?: string
  requestedDocumentNotes: Record<string, string>
}

export function buildSubmittedCorrectionReview(
  timeline: { title: string; detail?: string; atLabel?: string }[],
): SubmittedCorrectionReview | null {
  if (!isCandidaturaReviewingSubmittedCorrections(timeline)) return null

  const submittedEvent = findSubmittedCorrectionsEvent(timeline)
  const requestedMessage = findLatestCorrectionMessage(timeline)
  const { dataNote, documentNotes } = requestedMessage
    ? parseCorrectionRequestMessage(requestedMessage)
    : { dataNote: undefined, documentNotes: {} as Record<string, string> }
  const parsedSubmitted = parseSubmittedCorrectionsDetail(submittedEvent?.detail)

  return {
    submittedAtLabel: submittedEvent?.atLabel,
    submittedSummary: submittedEvent?.detail?.trim(),
    includesData: parsedSubmitted.includesData,
    documentLabels: parsedSubmitted.documentLabels,
    requestedMessage,
    requestedDataNote: dataNote,
    requestedDocumentNotes: documentNotes,
  }
}

export function getSubmittedCorrectionDocuments(
  documents: AdminCandidaturaDocument[],
  review: Pick<SubmittedCorrectionReview, 'documentLabels'>,
): AdminCandidaturaDocument[] {
  if (review.documentLabels.length > 0) {
    return documents.filter((doc) =>
      review.documentLabels.some(
        (label) =>
          doc.label.localeCompare(label, 'pt-BR', { sensitivity: 'accent' }) === 0 ||
          doc.label.toLowerCase().includes(label.toLowerCase()),
      ),
    )
  }

  return documents.filter((doc) => doc.status === 'pendente')
}

export type DataFieldHighlight = 'email' | 'phone' | 'council' | 'rqe'

export function inferDataFieldsFromCorrectionNote(note: string): Set<DataFieldHighlight> {
  const normalized = note.toLowerCase()
  const fields = new Set<DataFieldHighlight>()

  if (/crm|conselho|crefito|crp|crn|cff|registro/.test(normalized)) fields.add('council')
  if (/e-?mail|email/.test(normalized)) fields.add('email')
  if (/telefone|celular|fone|whatsapp/.test(normalized)) fields.add('phone')
  if (/rqe/.test(normalized)) fields.add('rqe')

  if (fields.size === 0) {
    fields.add('council')
    fields.add('email')
    fields.add('phone')
  }

  return fields
}

export function findCorrectionTimelineEvents(
  timeline: { id: string; atLabel: string; title: string; detail?: string; actor?: string }[],
) {
  return timeline.filter((item) => item.title === 'Correção solicitada')
}

export function isCandidaturaReenvio(status: AdminCandidaturaStatus): boolean {
  return status === 'incompleto'
}

export function isCandidaturaCorrecaoEmAnalise(
  status: AdminCandidaturaStatus,
  timeline: { title: string }[],
): boolean {
  return status === 'em_analise' && isCandidaturaReviewingSubmittedCorrections(timeline)
}

export function isDocumentEffectivelyApproved(
  doc: AdminCandidaturaDocument,
  documentApprovalDrafts: ReadonlySet<string>,
): boolean {
  return doc.status === 'aprovado' || documentApprovalDrafts.has(doc.id)
}

export function countEffectiveApprovedDocuments(
  documents: AdminCandidaturaDocument[],
  documentApprovalDrafts: ReadonlySet<string>,
): number {
  return documents.filter((doc) => isDocumentEffectivelyApproved(doc, documentApprovalDrafts)).length
}

export function allRequiredDocumentsEffectivelyApproved(
  documents: AdminCandidaturaDocument[],
  documentApprovalDrafts: ReadonlySet<string>,
): boolean {
  return (
    documents.length > 0 &&
    documents.every((doc) => isDocumentEffectivelyApproved(doc, documentApprovalDrafts))
  )
}

export function allDocumentsHandledForReview(
  documents: AdminCandidaturaDocument[],
  documentCorrectionDrafts: Record<string, string>,
  documentApprovalDrafts: ReadonlySet<string>,
): boolean {
  return documents.every((doc) => {
    if (isDocumentEffectivelyApproved(doc, documentApprovalDrafts)) return true
    if (documentCorrectionDrafts[doc.id]?.trim()) return true
    return false
  })
}

export function hasCorrectionDraft(
  dataCorrectionDraft: string,
  documentCorrectionDrafts: Record<string, string>,
): boolean {
  if (dataCorrectionDraft.trim()) return true
  return Object.values(documentCorrectionDrafts).some((reason) => reason.trim())
}

export function buildCorrectionRequestMessage(
  dataCorrectionDraft: string,
  documents: AdminCandidaturaDocument[],
  documentCorrectionDrafts: Record<string, string>,
): string {
  const parts: string[] = []
  const dataNote = dataCorrectionDraft.trim()
  if (dataNote) {
    parts.push(`Dados pessoais:\n${dataNote}`)
  }

  for (const doc of documents) {
    const reason = documentCorrectionDrafts[doc.id]?.trim()
    if (reason) {
      parts.push(`${doc.label}:\n${reason}`)
    }
  }

  return parts.join('\n\n')
}

export type CandidaturaRejectionPreset = {
  id: string
  label: string
  message: string
}

/** Frases prontas — cordiais, sem fechar a porta para uma futura oportunidade. */
export const candidaturaRejectionPresets: CandidaturaRejectionPreset[] = [
  {
    id: 'demanda-atual',
    label: 'Demanda no momento',
    message:
      'Agradecemos seu interesse em integrar a Telefarmed. Neste momento, estamos equilibrando a capacidade da nossa rede e não temos vagas abertas compatíveis com seu perfil. Seu cadastro permanece em nossa base e entraremos em contato assim que surgir uma oportunidade alinhada à sua especialidade.',
  },
  {
    id: 'especialidade',
    label: 'Especialidade',
    message:
      'Recebemos sua candidatura com atenção e reconhecemos sua qualificação. No momento, nossa demanda operacional para sua especialidade já está atendida e estamos priorizando o equilíbrio da plataforma. Manteremos seus dados registrados e retornaremos o contato quando houver nova abertura.',
  },
  {
    id: 'regiao',
    label: 'Cobertura regional',
    message:
      'Obrigado por considerar a Telefarmed. Nesta fase, estamos consolidando a cobertura na sua região e, por isso, não seguiremos com a integração imediata. Ficamos à disposição para uma nova conversa quando expandirmos nossa operação na sua área de atuação.',
  },
  {
    id: 'perfil-futuro',
    label: 'Perfil para o futuro',
    message:
      'Seu perfil profissional chamou nossa atenção. Por uma questão de alinhamento com o momento atual da operação, não daremos continuidade agora — mas gostaríamos de manter seu cadastro em nossa base de talentos para futuras oportunidades, quando a expansão da rede permitir novas integrações.',
  },
  {
    id: 'retorno-futuro',
    label: 'Retorno futuro',
    message:
      'Agradecemos o tempo dedicado ao seu cadastro. Neste ciclo, optamos por não ampliar o número de profissionais ativos na plataforma, para garantir a qualidade do atendimento aos que já estão conosco. Assim que abrirmos novas vagas, você será um dos primeiros a ser considerado.',
  },
]

export function formatCpfDisplay(cpf: string) {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function formatBirthDateDisplay(value: string): string {
  if (!value.trim()) return '—'
  const isoMatch = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim())
  if (isoMatch) return formatDatePtBr(isoMatch[1])
  return value
}

export const adminProfissionaisStatusFilterOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'incompleto', label: 'Incompleto' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'reprovado', label: 'Reprovado' },
  { value: 'em_analise', label: 'Em análise' },
] as const

export function formatAdminProfissionaisNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|bmp|heic)$/i
const MOCK_IMAGE_PREVIEW_URL = '/doctors.png'
/** PDF mínimo embutido para pré-visualização simulada de candidaturas. */
const MOCK_PDF_PREVIEW_URL =
  'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAyNCBUZgoxMDAgNzAwIFRkCihEb2N1bWVudG8pIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQ1IDAwMDAwIG4gCjAwMDAwMDAzMjQgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MTIKJSVFT0Y='

export function inferCandidaturaDocumentAttachmentType(fileName: string): 'image' | 'pdf' {
  return IMAGE_EXTENSIONS.test(fileName.trim()) ? 'image' : 'pdf'
}

export function candidaturaDocumentToAttachment(
  doc: AdminCandidaturaDocument,
): ConsultationChatAttachment {
  const type = inferCandidaturaDocumentAttachmentType(doc.fileName)
  const url =
    doc.fileUrl ??
    (type === 'image' ? MOCK_IMAGE_PREVIEW_URL : MOCK_PDF_PREVIEW_URL)

  return {
    id: doc.id,
    type,
    url,
    name: doc.fileName,
  }
}
