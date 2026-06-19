import type { InternacaoPdfData } from '../../types/clinicalDocument'

const TIPO_LABELS: Record<InternacaoPdfData['tipoInternacao'], string> = {
  clinica: 'Internação clínica',
  cirurgica: 'Internação cirúrgica',
  obstetrica: 'Internação obstétrica',
  pediatrica: 'Internação pediátrica',
  psiquiatrica: 'Internação psiquiátrica',
  uti: 'Internação em UTI / terapia intensiva',
}

const CARATER_LABELS: Record<InternacaoPdfData['caraterInternacao'], string> = {
  eletiva: 'Eletiva',
  urgencia: 'Urgência',
  emergencia: 'Emergência',
}

function formatCidLine(code: string, description?: string): string {
  const trimmedCode = code.trim()
  const trimmedDescription = description?.trim()
  return trimmedDescription ? `${trimmedCode} — ${trimmedDescription}` : trimmedCode
}

function splitParagraph(text: string): string[] {
  return text
    .trim()
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export function buildInternacaoSections(internacao: InternacaoPdfData) {
  const destinoLines = [
    `Tipo de internação: ${TIPO_LABELS[internacao.tipoInternacao]}`,
    `Caráter: ${CARATER_LABELS[internacao.caraterInternacao]}`,
    `Unidade hospitalar de destino: ${internacao.unidadeDestino.trim()}`,
  ]

  if (internacao.procedimentoPrincipalPrevisto?.trim()) {
    destinoLines.push(
      `Procedimento principal previsto: ${internacao.procedimentoPrincipalPrevisto.trim()}`,
    )
  }

  if (internacao.tempoEstimadoInternacao?.trim()) {
    destinoLines.push(`Tempo estimado de internação: ${internacao.tempoEstimadoInternacao.trim()}`)
  }

  const justificativaLines = [
    'Motivo da internação:',
    ...splitParagraph(internacao.motivoInternacao),
    '',
    'Justificativa clínica (indicação de internação):',
    ...splitParagraph(internacao.justificativaClinica),
  ]

  const clinicoLines = [
    'História clínica:',
    ...splitParagraph(internacao.historiaClinica),
    '',
    'Exame físico / avaliação:',
    ...splitParagraph(internacao.exameFisico),
    '',
    `Hipótese diagnóstica: ${internacao.hipoteseDiagnostica.trim()}`,
  ]

  if (internacao.cid?.trim()) {
    clinicoLines.push(`CID-10: ${formatCidLine(internacao.cid, internacao.cidDescricao)}`)
  }

  if (internacao.examesComplementares?.trim()) {
    clinicoLines.push(
      '',
      'Exames complementares realizados:',
      ...splitParagraph(internacao.examesComplementares),
    )
  }

  const condutaLines = [
    'Tratamentos e medicações em uso:',
    ...splitParagraph(internacao.tratamentosEMedicacoes),
  ]

  if (internacao.condutaAdotada?.trim()) {
    condutaLines.push('', 'Conduta já adotada:', ...splitParagraph(internacao.condutaAdotada))
  }

  const sections = [
    { title: 'Destino e caráter', lines: destinoLines },
    { title: 'Justificativa', lines: justificativaLines.filter((line) => line !== '') },
    { title: 'Dados clínicos', lines: clinicoLines.filter((line) => line !== '') },
    { title: 'Conduta e tratamentos', lines: condutaLines.filter((line) => line !== '') },
  ]

  if (internacao.observacoes?.trim()) {
    sections.push({
      title: 'Observações',
      lines: splitParagraph(internacao.observacoes),
    })
  }

  return sections
}

export function mapInternacaoModalToPdfData(
  payload: import('../../components/attendance/doctor/DoctorInternacaoModal').DoctorInternacaoSignedPayload,
): InternacaoPdfData {
  return {
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
  }
}
