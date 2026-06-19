import type { AvaliacaoPresencialPdfData } from '../../types/clinicalDocument'

const TIPO_LABELS: Record<AvaliacaoPresencialPdfData['tipoAvaliacao'], string> = {
  retorno_presencial: 'Retorno presencial à unidade',
  avaliacao_especializada: 'Avaliação especializada presencial',
  reavaliacao_clinica: 'Reavaliação clínica presencial',
  procedimento_presencial: 'Procedimento presencial',
  urgencia_presencial: 'Urgência — avaliação presencial imediata',
}

const PRIORIDADE_LABELS: Record<AvaliacaoPresencialPdfData['prioridade'], string> = {
  eletivo: 'Eletivo',
  prioritario: 'Prioritário',
  urgente: 'Urgente',
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

export function buildAvaliacaoPresencialSections(avaliacao: AvaliacaoPresencialPdfData) {
  const destinoLines = [
    `Tipo de avaliação: ${TIPO_LABELS[avaliacao.tipoAvaliacao]}`,
    `Prioridade: ${PRIORIDADE_LABELS[avaliacao.prioridade]}`,
    `Serviço / unidade de destino: ${avaliacao.servicoDestino.trim()}`,
  ]

  const justificativaLines = [
    'Motivo da avaliação presencial:',
    ...splitParagraph(avaliacao.motivoAvaliacao),
    '',
    'Justificativa para avaliação presencial (limitações da teleconsulta):',
    ...splitParagraph(avaliacao.justificativaPresencial),
  ]

  const clinicoLines = [
    'História clínica:',
    ...splitParagraph(avaliacao.historiaClinica),
    '',
    'Exame físico / avaliação remota:',
    ...splitParagraph(avaliacao.exameFisicoRemoto),
    '',
    `Hipótese diagnóstica: ${avaliacao.hipoteseDiagnostica.trim()}`,
  ]

  if (avaliacao.cid?.trim()) {
    clinicoLines.push(`CID-10: ${formatCidLine(avaliacao.cid, avaliacao.cidDescricao)}`)
  }

  if (avaliacao.examesRealizados?.trim()) {
    clinicoLines.push('', 'Exames já realizados:', ...splitParagraph(avaliacao.examesRealizados))
  }

  const condutaLines = [
    'Expectativa da avaliação presencial:',
    ...splitParagraph(avaliacao.expectativaAvaliacao),
  ]

  if (avaliacao.condutaAdotada?.trim()) {
    condutaLines.unshift('Conduta já adotada:', ...splitParagraph(avaliacao.condutaAdotada), '')
  }

  const sections = [
    { title: 'Destino e prioridade', lines: destinoLines },
    { title: 'Justificativa', lines: justificativaLines.filter((line) => line !== '') },
    { title: 'Dados clínicos', lines: clinicoLines.filter((line) => line !== '' || clinicoLines.length > 1) },
    { title: 'Conduta e expectativas', lines: condutaLines.filter((line) => line !== '') },
  ]

  if (avaliacao.observacoes?.trim()) {
    sections.push({
      title: 'Observações',
      lines: splitParagraph(avaliacao.observacoes),
    })
  }

  return sections
}

export function mapAvaliacaoPresencialModalToPdfData(
  payload: import('../../components/attendance/doctor/DoctorAvaliacaoPresencialModal').DoctorAvaliacaoPresencialSignedPayload,
): AvaliacaoPresencialPdfData {
  return {
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
  }
}
