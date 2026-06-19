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
  const downloadLabels: Partial<Record<ClinicalDocumentKind, string>> = {
    receita: 'Baixar receita médica',
    pedido_exame: 'Baixar pedido de exames',
    encaminhamento: 'Baixar encaminhamento médico',
    relatorio: 'Baixar relatório médico',
    laudo: 'Baixar laudo médico',
    avaliacao_presencial: 'Baixar avaliação presencial',
    internacao: 'Baixar solicitação de internação',
    atestado: 'Baixar atestado médico',
    atestado_psicologico: 'Baixar atestado psicológico',
    relatorio_psicologico: 'Baixar relatório psicológico',
    relatorio_multiprofissional: 'Baixar relatório multiprofissional',
    laudo_psicologico: 'Baixar laudo psicológico',
    parecer_psicologico: 'Baixar parecer psicológico',
    encaminhamento_psicologico: 'Baixar encaminhamento psicológico',
    plano_alimentar: 'Baixar plano alimentar',
    prescricao_dietetica: 'Baixar prescrição dietética',
    prescricao_suplementos: 'Baixar prescrição de suplementos',
    pedido_exame_nutricional: 'Baixar pedido de exames',
    relatorio_nutricional: 'Baixar relatório nutricional',
    parecer_nutricional: 'Baixar parecer nutricional',
    laudo_nutricional: 'Baixar laudo nutricional',
    declaracao_comparecimento_nutricional: 'Baixar declaração de comparecimento',
    declaracao_comparecimento_fonoaudiologico: 'Baixar declaração de comparecimento',
    relatorio_fonoaudiologico: 'Baixar relatório fonoaudiológico',
    laudo_fonoaudiologico: 'Baixar laudo fonoaudiológico',
    parecer_fonoaudiologico: 'Baixar parecer fonoaudiológico',
    atestado_fonoaudiologico: 'Baixar atestado fonoaudiológico',
    plano_terapeutico_fonoaudiologico: 'Baixar plano terapêutico fonoaudiológico',
    resultado_avaliacao_fonoaudiologico: 'Baixar resultado de avaliação/exame',
    encaminhamento_fonoaudiologico: 'Baixar encaminhamento fonoaudiológico',
  }

  const iconClasses: Partial<Record<ClinicalDocumentKind, string>> = {
    receita: 'bg-red-50 text-red-500',
    pedido_exame: 'bg-sky-50 text-sky-600',
    encaminhamento: 'bg-violet-50 text-violet-600',
    relatorio: 'bg-indigo-50 text-indigo-600',
    laudo: 'bg-blue-50 text-blue-600',
    avaliacao_presencial: 'bg-teal-50 text-teal-600',
    internacao: 'bg-rose-50 text-rose-600',
    atestado: 'bg-amber-50 text-amber-600',
    atestado_psicologico: 'bg-amber-50 text-amber-600',
    relatorio_psicologico: 'bg-indigo-50 text-indigo-600',
    relatorio_multiprofissional: 'bg-teal-50 text-teal-600',
    laudo_psicologico: 'bg-blue-50 text-blue-600',
    parecer_psicologico: 'bg-fuchsia-50 text-fuchsia-600',
    encaminhamento_psicologico: 'bg-violet-50 text-violet-600',
    plano_alimentar: 'bg-lime-50 text-lime-700',
    prescricao_dietetica: 'bg-teal-50 text-teal-600',
    prescricao_suplementos: 'bg-amber-50 text-amber-600',
    pedido_exame_nutricional: 'bg-sky-50 text-sky-600',
    relatorio_nutricional: 'bg-indigo-50 text-indigo-600',
    parecer_nutricional: 'bg-fuchsia-50 text-fuchsia-600',
    laudo_nutricional: 'bg-blue-50 text-blue-600',
    declaracao_comparecimento_nutricional: 'bg-emerald-50 text-emerald-600',
    declaracao_comparecimento_fonoaudiologico: 'bg-emerald-50 text-emerald-600',
    relatorio_fonoaudiologico: 'bg-indigo-50 text-indigo-600',
    laudo_fonoaudiologico: 'bg-blue-50 text-blue-600',
    parecer_fonoaudiologico: 'bg-fuchsia-50 text-fuchsia-600',
    atestado_fonoaudiologico: 'bg-amber-50 text-amber-600',
    plano_terapeutico_fonoaudiologico: 'bg-teal-50 text-teal-600',
    resultado_avaliacao_fonoaudiologico: 'bg-sky-50 text-sky-600',
    encaminhamento_fonoaudiologico: 'bg-violet-50 text-violet-600',
  }

  const isPrescription = input.kind === 'receita'
  const signedPrefix = isPrescription ? 'Assinada' : 'Assinado'

  return {
    id: input.id,
    title: input.titulo,
    meta: `PDF • ${signedPrefix} às ${input.signedAtLabel}`,
    downloadUrl: input.downloadUrl,
    downloadLabel: downloadLabels[input.kind] ?? 'Baixar documento',
    iconClass: iconClasses[input.kind] ?? 'bg-slate-50 text-slate-600',
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
