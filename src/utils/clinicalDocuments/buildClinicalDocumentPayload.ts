import type { ExamCatalogItem } from '../../data/doctorExamRequestMock'
import type {
  AtestadoPdfData,
  AvaliacaoPresencialPdfData,
  ClinicalDocumentContext,
  ClinicalDocumentPayload,
  EncaminhamentoPdfData,
  ExamePdfItem,
  InternacaoPdfData,
  LaudoPdfData,
  PrescricaoPdfItem,
  RelatorioPdfData,
} from '../../types/clinicalDocument'
import type { PrescriptionMedicationItem } from '../../components/attendance/doctor/doctorPrescriptionTypes'
import {
  buildDocumentoVerificacaoUrl,
  formatClinicalDocumentVerificationLabel,
  generateCodigoVerificacaoDocumento,
} from './codigoVerificacao'
import { buildAvaliacaoPresencialSections } from './avaliacaoPresencialLines'
import { buildEncaminhamentoSections } from './encaminhamentoLines'
import { buildInternacaoSections } from './internacaoLines'
import { buildLaudoSections } from './laudoLines'
import { buildRelatorioSections } from './relatorioLines'

function formatBrazilianDateLabel(isoDate: string): string {
  const parts = isoDate.split('-')
  if (parts.length !== 3) return isoDate
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function addDaysToIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`)
  date.setDate(date.getDate() + Math.max(0, days - 1))
  return date.toISOString().slice(0, 10)
}

function formatPatientBirthDateLabel(birthIso: string): string {
  const iso = birthIso.trim().slice(0, 10)
  const parts = iso.split('-')
  if (parts.length !== 3) return '—'
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

export function buildClinicalDocumentEmitContext(input: {
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
  emitidoEm?: Date
}): ClinicalDocumentContext {
  const emitidoEm = input.emitidoEm ?? new Date()
  const patientBirthDateLabel =
    input.patientBirthDateLabel?.trim() ||
    (input.patientBirthDateIso ? formatPatientBirthDateLabel(input.patientBirthDateIso) : '—')
  const patientAddress = input.patientAddress?.trim() || input.patientCity?.trim() || '—'

  return {
    entidadeNome: input.entidadeNome,
    unitName: input.unitName,
    specialty: input.specialty,
    patientName: input.patientName,
    patientCpfMasked: input.patientCpfMasked,
    patientBirthDateLabel,
    patientAddress,
    patientAgeLabel: input.patientAgeLabel,
    patientCity: input.patientCity,
    doctorName: input.doctorName,
    doctorSpecialty: input.doctorSpecialty,
    doctorCrm: input.doctorCrm,
    doctorRqe: input.doctorRqe,
    entidadeLogoUrl: input.entidadeLogoUrl,
    entidadeSlug: input.entidadeSlug,
    emitidoEmIso: emitidoEm.toISOString(),
    emitidoEmLabel: new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(emitidoEm),
  }
}

export function buildReceitaClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  medicamentos: PrescricaoPdfItem[]
  observacoesGerais?: string
}): ClinicalDocumentPayload {
  const codigoVerificacao = generateCodigoVerificacaoDocumento()
  const medicationLines = input.medicamentos.flatMap((med, index) => {
    const lines = [`${index + 1}. ${med.medicamentoNome}`]
    if (med.dosagem) lines.push(`   Dosagem: ${med.dosagem}`)
    if (med.via) lines.push(`   Via: ${med.via}`)
    if (med.frequencia) lines.push(`   Posologia: ${med.frequencia}`)
    if (med.duracao) lines.push(`   Duração: ${med.duracao}`)
    if (med.observacoes) lines.push(`   Obs.: ${med.observacoes}`)
    return lines
  })

  return {
    kind: 'receita',
    context: input.context,
    sections: [{ title: 'Prescrição', lines: medicationLines }],
    footerNote: input.observacoesGerais?.trim(),
    codigoVerificacao,
    verificationUrl: buildDocumentoVerificacaoUrl(codigoVerificacao, input.context.entidadeSlug),
  }
}

export function buildPedidoExameClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  exames: ExamePdfItem[]
  indicacaoClinica?: string
  urgent?: boolean
}): ClinicalDocumentPayload {
  const codigoVerificacao = generateCodigoVerificacaoDocumento()
  const indicacaoClinica = input.indicacaoClinica?.trim() ?? ''
  const examLines = input.exames.map((exam, index) => {
    const obs = exam.observacoes?.trim() ?? ''
    const suffix = obs && obs !== indicacaoClinica ? ` — ${obs}` : ''
    return `${index + 1}. ${exam.name}${suffix}`
  })

  return {
    kind: 'pedido_exame',
    context: input.context,
    sections: [
      ...(indicacaoClinica ? [{ title: 'Indicação clínica', lines: [indicacaoClinica] }] : []),
      { title: 'Exames solicitados', lines: examLines },
    ],
    urgent: input.urgent === true,
    codigoVerificacao,
    verificationUrl: buildDocumentoVerificacaoUrl(codigoVerificacao, input.context.entidadeSlug),
  }
}

export function buildAtestadoClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  atestado: AtestadoPdfData
}): ClinicalDocumentPayload {
  const codigoVerificacao = generateCodigoVerificacaoDocumento()
  const lines = buildAtestadoDeclarationLines(input.context.patientName, input.atestado)

  return {
    kind: 'atestado',
    context: input.context,
    sections: [{ title: 'Declaração', lines }],
    codigoVerificacao,
    verificationUrl: buildDocumentoVerificacaoUrl(codigoVerificacao, input.context.entidadeSlug),
  }
}

export function buildEncaminhamentoClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  encaminhamento: EncaminhamentoPdfData
}): ClinicalDocumentPayload {
  const codigoVerificacao = generateCodigoVerificacaoDocumento()

  return {
    kind: 'encaminhamento',
    context: input.context,
    sections: buildEncaminhamentoSections(input.encaminhamento),
    urgent: input.encaminhamento.prioridade === 'urgente',
    codigoVerificacao,
    verificationUrl: buildDocumentoVerificacaoUrl(codigoVerificacao, input.context.entidadeSlug),
  }
}

export function buildRelatorioClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  relatorio: RelatorioPdfData
}): ClinicalDocumentPayload {
  const codigoVerificacao = generateCodigoVerificacaoDocumento()

  return {
    kind: 'relatorio',
    context: input.context,
    sections: buildRelatorioSections(input.relatorio),
    codigoVerificacao,
    verificationUrl: buildDocumentoVerificacaoUrl(codigoVerificacao, input.context.entidadeSlug),
  }
}

export function buildLaudoClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  laudo: LaudoPdfData
}): ClinicalDocumentPayload {
  const codigoVerificacao = generateCodigoVerificacaoDocumento()

  return {
    kind: 'laudo',
    context: input.context,
    sections: buildLaudoSections(input.laudo),
    codigoVerificacao,
    verificationUrl: buildDocumentoVerificacaoUrl(codigoVerificacao, input.context.entidadeSlug),
  }
}

export function buildAvaliacaoPresencialClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  avaliacaoPresencial: AvaliacaoPresencialPdfData
}): ClinicalDocumentPayload {
  const codigoVerificacao = generateCodigoVerificacaoDocumento()

  return {
    kind: 'avaliacao_presencial',
    context: input.context,
    sections: buildAvaliacaoPresencialSections(input.avaliacaoPresencial),
    urgent: input.avaliacaoPresencial.prioridade === 'urgente',
    codigoVerificacao,
    verificationUrl: buildDocumentoVerificacaoUrl(codigoVerificacao, input.context.entidadeSlug),
  }
}

export function buildInternacaoClinicalDocumentPayload(input: {
  context: ClinicalDocumentContext
  internacao: InternacaoPdfData
}): ClinicalDocumentPayload {
  const codigoVerificacao = generateCodigoVerificacaoDocumento()
  const urgent =
    input.internacao.caraterInternacao === 'urgencia' ||
    input.internacao.caraterInternacao === 'emergencia'

  return {
    kind: 'internacao',
    context: input.context,
    sections: buildInternacaoSections(input.internacao),
    urgent,
    codigoVerificacao,
    verificationUrl: buildDocumentoVerificacaoUrl(codigoVerificacao, input.context.entidadeSlug),
  }
}

function buildAtestadoDeclarationLines(patientName: string, atestado: AtestadoPdfData): string[] {
  const dataLabel = formatBrazilianDateLabel(atestado.dataInicio)

  if (atestado.tipo === 'comparecimento') {
    const lines = [
      `Atesto, para os devidos fins, que o(a) paciente ${patientName} compareceu à consulta médica nesta unidade em ${dataLabel}.`,
    ]

    if (atestado.cid?.trim()) {
      lines.push(formatCidLine(atestado.cid, atestado.cidDescricao))
    }
    if (atestado.observacoes?.trim()) {
      lines.push(`Observações: ${atestado.observacoes.trim()}`)
    }

    return lines
  }

  const dias = atestado.diasAfastamento ?? 1
  const dataFim = addDaysToIsoDate(atestado.dataInicio, dias)
  const lines = [
    `Atesto, para os devidos fins, que o(a) paciente ${patientName} necessita de afastamento de suas atividades por ${dias} dia(s).`,
    `Período: ${dataLabel} a ${formatBrazilianDateLabel(dataFim)}.`,
    `Motivo: ${atestado.motivo?.trim() ?? ''}`,
  ]

  if (atestado.cid?.trim()) {
    lines.push(formatCidLine(atestado.cid, atestado.cidDescricao))
  }
  if (atestado.observacoes?.trim()) {
    lines.push(`Observações: ${atestado.observacoes.trim()}`)
  }

  return lines
}

function formatCidLine(code: string, description?: string): string {
  const trimmedCode = code.trim()
  const trimmedDescription = description?.trim()
  return trimmedDescription
    ? `CID: ${trimmedCode} — ${trimmedDescription}`
    : `CID: ${trimmedCode}`
}

export function mapPrescriptionModalToPdfItems(
  medications: PrescriptionMedicationItem[],
  generalNotes: string,
): PrescricaoPdfItem[] {
  return medications.map((med) => ({
    medicamentoNome: med.presentation ? `${med.name} — ${med.presentation}` : med.name,
    dosagem: med.dosage,
    via: med.route,
    frequencia: med.instructions,
    duracao: med.duration,
    observacoes: [med.notes, generalNotes].filter(Boolean).join('\n'),
  }))
}

export function mapExamModalToPdfItems(input: {
  selectedExams: ExamCatalogItem[]
  clinicalIndication: string
  customExamNames: string[]
}): ExamePdfItem[] {
  const selected = [...input.selectedExams]
  for (const name of input.customExamNames) {
    if (!selected.some((exam) => exam.name === name)) {
      selected.push({ id: `custom-${name}`, name, category: 'Personalizado' })
    }
  }

  const indicacaoClinica = input.clinicalIndication.trim()
  return selected.map((exam) => ({
    exameId: exam.id.startsWith('custom-') ? undefined : exam.id,
    name: exam.name,
    observacoes: indicacaoClinica,
  }))
}
