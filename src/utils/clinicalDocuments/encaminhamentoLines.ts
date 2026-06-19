import type { EncaminhamentoPdfData } from '../../types/clinicalDocument'

const TIPO_LABELS: Record<EncaminhamentoPdfData['tipoSolicitacao'], string> = {
  consulta_especializada: 'Consulta especializada',
  retorno: 'Retorno',
  procedimento: 'Procedimento',
  avaliacao_cirurgica: 'Avaliação cirúrgica',
  segunda_opiniao: 'Segunda opinião',
}

const PRIORIDADE_LABELS: Record<EncaminhamentoPdfData['prioridade'], string> = {
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

export function buildEncaminhamentoSections(encaminhamento: EncaminhamentoPdfData) {
  const destinoLines = [
    `Especialidade de destino: ${encaminhamento.specialtyLabel.trim()}`,
    `Tipo de solicitação: ${TIPO_LABELS[encaminhamento.tipoSolicitacao]}`,
    `Prioridade: ${PRIORIDADE_LABELS[encaminhamento.prioridade]}`,
  ]

  const clinicoLines = [
    ...splitParagraph(encaminhamento.historiaClinica),
    '',
    'Exame físico:',
    ...splitParagraph(encaminhamento.exameFisico),
    '',
    `Hipótese diagnóstica: ${encaminhamento.hipoteseDiagnostica.trim()}`,
  ]

  if (encaminhamento.cid?.trim()) {
    clinicoLines.push(`CID-10: ${formatCidLine(encaminhamento.cid, encaminhamento.cidDescricao)}`)
  }

  const condutaLines = [
    'Tratamentos e medicações em uso:',
    ...splitParagraph(encaminhamento.tratamentosEMedicacoes),
  ]

  if (encaminhamento.examesRealizados?.trim()) {
    condutaLines.push('', 'Exames já realizados:', ...splitParagraph(encaminhamento.examesRealizados))
  }

  const sections = [
    { title: 'Destino', lines: destinoLines },
    { title: 'Motivo do encaminhamento', lines: splitParagraph(encaminhamento.motivoEncaminhamento) },
    { title: 'Dados clínicos', lines: clinicoLines.filter((line) => line !== '' || clinicoLines.length > 1) },
    { title: 'Conduta e exames', lines: condutaLines },
  ]

  if (encaminhamento.observacoes?.trim()) {
    sections.push({
      title: 'Observações',
      lines: splitParagraph(encaminhamento.observacoes),
    })
  }

  return sections
}

export function mapEncaminhamentoModalToPdfData(
  payload: import('../../components/attendance/doctor/DoctorEncaminhamentoModal').DoctorEncaminhamentoSignedPayload,
): EncaminhamentoPdfData {
  return {
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
  }
}
