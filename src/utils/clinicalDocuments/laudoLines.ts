import type { LaudoPdfData } from '../../types/clinicalDocument'

const TIPO_LABELS: Record<LaudoPdfData['tipoLaudo'], string> = {
  exame_complementar: 'Laudo sobre exame complementar',
  condicao_clinica: 'Parecer sobre condição clínica',
  procedimento: 'Avaliação de procedimento',
  aptidao_inaptidao: 'Laudo de aptidão ou inaptidão',
  pericia_administrativa: 'Perícia / fins administrativos',
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

export function buildLaudoSections(laudo: LaudoPdfData) {
  const identificacaoLines = [
    `Tipo de laudo: ${TIPO_LABELS[laudo.tipoLaudo]}`,
    ...(laudo.destinatario?.trim() ? [`Destinatário: ${laudo.destinatario.trim()}`] : []),
    `Objeto do laudo: ${laudo.objetoLaudo.trim()}`,
    ...(laudo.solicitacaoOrigem?.trim()
      ? [`Solicitação / origem: ${laudo.solicitacaoOrigem.trim()}`]
      : []),
  ]

  const achadosLines = splitParagraph(laudo.descricaoAchados)

  const contextoLines = [
    'Correlação clínica:',
    ...splitParagraph(laudo.correlacaoClinica),
  ]

  if (laudo.discussaoInterpretacao?.trim()) {
    contextoLines.push('', 'Discussão e interpretação:', ...splitParagraph(laudo.discussaoInterpretacao))
  }

  const conclusaoLines = [...splitParagraph(laudo.conclusaoLaudo)]
  if (laudo.cid?.trim()) {
    conclusaoLines.push(`CID-10: ${formatCidLine(laudo.cid, laudo.cidDescricao)}`)
  }

  const sections = [
    { title: 'Identificação e objeto', lines: identificacaoLines },
    { title: 'Achados / descrição técnica', lines: achadosLines },
    { title: 'Correlação clínica', lines: contextoLines },
    { title: 'Conclusão do laudo', lines: conclusaoLines },
  ]

  if (laudo.recomendacoes?.trim()) {
    sections.push({
      title: 'Recomendações',
      lines: splitParagraph(laudo.recomendacoes),
    })
  }

  if (laudo.limitacoesExame?.trim()) {
    sections.push({
      title: 'Limitações do exame',
      lines: splitParagraph(laudo.limitacoesExame),
    })
  }

  if (laudo.observacoes?.trim()) {
    sections.push({
      title: 'Observações',
      lines: splitParagraph(laudo.observacoes),
    })
  }

  return sections
}

export function mapLaudoModalToPdfData(
  payload: import('../../components/attendance/doctor/DoctorLaudoModal').DoctorLaudoSignedPayload,
): LaudoPdfData {
  return {
    tipoLaudo: payload.tipoLaudo,
    destinatario: payload.destinatario,
    objetoLaudo: payload.objetoLaudo,
    solicitacaoOrigem: payload.solicitacaoOrigem,
    descricaoAchados: payload.descricaoAchados,
    correlacaoClinica: payload.correlacaoClinica,
    discussaoInterpretacao: payload.discussaoInterpretacao,
    conclusaoLaudo: payload.conclusaoLaudo,
    cid: payload.cid,
    cidDescricao: payload.cidDescricao,
    recomendacoes: payload.recomendacoes,
    limitacoesExame: payload.limitacoesExame,
    observacoes: payload.observacoes,
  }
}
