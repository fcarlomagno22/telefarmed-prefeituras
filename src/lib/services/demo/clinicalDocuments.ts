import type { ConsultationDocumentItem } from '../../../components/attendance/ConsultationDocumentsPanel'
import type { ClinicalDocumentKind, ClinicalDocumentPayload } from '../../../types/clinicalDocument'
import {
  apiEmitDemoClinicalDocument,
  type EmitDemoClinicalDocumentBody,
  type EmitDemoClinicalDocumentContext,
} from '../../api/public/demoClinicalDocuments'
import {
  generateClinicalDocumentPdf,
  openClinicalDocumentPdf,
} from '../../../utils/clinicalDocuments/generateClinicalDocumentPdf'

export type DemoClinicalDocumentResult = {
  document: ConsultationDocumentItem
  blobUrl: string
}

function base64ToBlob(base64: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new Blob([bytes], { type: 'application/pdf' })
}

function buildDocumentItem(input: {
  id: string
  kind: ClinicalDocumentKind
  titulo: string
  signedAtLabel: string
  downloadUrl: string
}): ConsultationDocumentItem {
  const isPrescription = input.kind === 'receita'
  const isExam = input.kind === 'pedido_exame'
  const isEncaminhamento = input.kind === 'encaminhamento'
  const isRelatorio = input.kind === 'relatorio'
  const isLaudo = input.kind === 'laudo'
  const isAvaliacaoPresencial = input.kind === 'avaliacao_presencial'
  const isInternacao = input.kind === 'internacao'
  const signedPrefix = isPrescription ? 'Assinada' : 'Assinado'

  return {
    id: input.id,
    title: input.titulo,
    meta: `PDF • ${signedPrefix} às ${input.signedAtLabel}`,
    downloadUrl: input.downloadUrl,
    downloadLabel: isPrescription
      ? 'Baixar receita médica'
      : isExam
        ? 'Baixar pedido de exames'
        : isEncaminhamento
          ? 'Baixar encaminhamento médico'
          : isRelatorio
            ? 'Baixar relatório médico'
            : isLaudo
              ? 'Baixar laudo médico'
              : isAvaliacaoPresencial
                ? 'Baixar avaliação presencial'
                : isInternacao
                  ? 'Baixar solicitação de internação'
                  : 'Baixar atestado médico',
    iconClass: isPrescription
      ? 'bg-red-50 text-red-500'
      : isExam
        ? 'bg-sky-50 text-sky-600'
        : isEncaminhamento
          ? 'bg-violet-50 text-violet-600'
          : isRelatorio
            ? 'bg-indigo-50 text-indigo-600'
            : isLaudo
              ? 'bg-blue-50 text-blue-600'
              : isAvaliacaoPresencial
                ? 'bg-teal-50 text-teal-600'
                : isInternacao
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-amber-50 text-amber-600',
  }
}

async function emitFromPayload(payload: ClinicalDocumentPayload, titulo: string, fileName: string) {
  const blob = await generateClinicalDocumentPdf(payload)
  const blobUrl = URL.createObjectURL(blob)
  openClinicalDocumentPdf(blob, fileName)

  const signedAtLabel = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(payload.context.emitidoEmIso))

  return {
    document: buildDocumentItem({
      id: `demo-doc-${payload.kind}-${Date.now()}`,
      kind: payload.kind,
      titulo,
      signedAtLabel,
      downloadUrl: blobUrl,
    }),
    blobUrl,
  }
}

async function emitFromApi(body: EmitDemoClinicalDocumentBody) {
  const response = await apiEmitDemoClinicalDocument(body)
  const blob = base64ToBlob(response.pdfBase64)
  const blobUrl = URL.createObjectURL(blob)
  openClinicalDocumentPdf(blob, response.fileName)

  return {
    document: buildDocumentItem({
      id: `demo-doc-${response.kind}-${Date.now()}`,
      kind: response.kind,
      titulo: response.titulo,
      signedAtLabel: response.signedAtLabel,
      downloadUrl: blobUrl,
    }),
    blobUrl,
  }
}

export async function emitDemoClinicalDocument(input: {
  apiBody: EmitDemoClinicalDocumentBody
  fallbackPayload: ClinicalDocumentPayload
  titulo: string
  fileName: string
}): Promise<DemoClinicalDocumentResult> {
  try {
    return await emitFromApi(input.apiBody)
  } catch {
    return emitFromPayload(input.fallbackPayload, input.titulo, input.fileName)
  }
}

export function buildDemoClinicalDocumentContext(input: {
  entidadeNome: string
  unitName: string
  specialty: string
  patientName: string
  patientCpfMasked: string
  patientBirthDateLabel?: string
  patientBirthDateIso?: string
  patientAddress?: string
  patientAgeLabel?: string
  patientCity?: string
  doctorName: string
  doctorSpecialty: string
  doctorCrm: string
  doctorRqe?: string
  entidadeLogoUrl?: string
  entidadeSlug?: string
}): EmitDemoClinicalDocumentContext {
  const birthDateLabel =
    input.patientBirthDateLabel?.trim() ||
    (input.patientBirthDateIso
      ? (() => {
          const parts = input.patientBirthDateIso.slice(0, 10).split('-')
          return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : '—'
        })()
      : input.patientAgeLabel?.trim() || '')

  return {
    ...input,
    patientBirthDateLabel: birthDateLabel,
    patientAddress: input.patientAddress?.trim() || input.patientCity?.trim() || '',
    patientAgeLabel: input.patientAgeLabel ?? '',
    patientCity: input.patientCity ?? '',
  }
}

export function revokeDemoClinicalDocumentUrls(urls: string[]) {
  for (const url of urls) {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }
}
