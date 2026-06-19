import type { RelatorioPdfData } from './types.js'

const FINALIDADE_LABELS: Record<RelatorioPdfData['finalidade'], string> = {
  referencia: 'Referência / acompanhamento de encaminhamento',
  resumo_atendimento: 'Resumo do atendimento realizado',
  contrarreferencia: 'Contrarreferência à APS',
  parecer: 'Parecer / opinião técnica',
  administrativo: 'Fins administrativos ou periciais',
}

function formatCidLine(code: string, description?: string): string {
  const trimmedCode = code.trim()
  const trimmedDescription = description?.trim()
  return trimmedDescription
    ? `${trimmedCode} — ${trimmedDescription}`
    : trimmedCode
}

function splitParagraph(text: string): string[] {
  return text
    .trim()
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export function buildRelatorioSections(relatorio: RelatorioPdfData) {
  const identificacaoLines = [
    `Finalidade: ${FINALIDADE_LABELS[relatorio.finalidade]}`,
    ...(relatorio.destinatario?.trim()
      ? [`Destinatário: ${relatorio.destinatario.trim()}`]
      : []),
    `Motivo do relatório: ${relatorio.motivoRelatorio.trim()}`,
  ]

  const anamneseLines = [
    `Queixa principal: ${relatorio.queixaPrincipal.trim()}`,
    '',
    'História da doença atual:',
    ...splitParagraph(relatorio.historiaDoencaAtual),
  ]

  if (relatorio.antecedentesRelevantes?.trim()) {
    anamneseLines.push('', 'Antecedentes relevantes:', ...splitParagraph(relatorio.antecedentesRelevantes))
  }

  if (relatorio.medicacoesEmUso?.trim()) {
    anamneseLines.push('', 'Medicações em uso:', ...splitParagraph(relatorio.medicacoesEmUso))
  }

  const avaliacaoLines = [
    'Exame físico / avaliação clínica:',
    ...splitParagraph(relatorio.exameFisico),
  ]

  if (relatorio.examesComplementares?.trim()) {
    avaliacaoLines.push(
      '',
      'Exames complementares e resultados:',
      ...splitParagraph(relatorio.examesComplementares),
    )
  }

  const diagnosticoLines = [`Hipótese diagnóstica: ${relatorio.hipoteseDiagnostica.trim()}`]
  if (relatorio.cid?.trim()) {
    diagnosticoLines.push(`CID-10: ${formatCidLine(relatorio.cid, relatorio.cidDescricao)}`)
  }

  const condutaLines = [
    'Conduta adotada neste atendimento:',
    ...splitParagraph(relatorio.condutaAdotada),
  ]

  if (relatorio.tratamentoEOrientacoes?.trim()) {
    condutaLines.push(
      '',
      'Tratamento prescrito e orientações:',
      ...splitParagraph(relatorio.tratamentoEOrientacoes),
    )
  }

  if (relatorio.evolucaoPrognostico?.trim()) {
    condutaLines.push('', 'Evolução e prognóstico:', ...splitParagraph(relatorio.evolucaoPrognostico))
  }

  const parecerLines = [
    'Parecer / conclusão:',
    ...splitParagraph(relatorio.conclusaoParecer),
  ]

  if (relatorio.recomendacoes?.trim()) {
    parecerLines.push('', 'Recomendações:', ...splitParagraph(relatorio.recomendacoes))
  }

  const sections = [
    { title: 'Identificação e finalidade', lines: identificacaoLines },
    { title: 'Anamnese', lines: anamneseLines.filter((line) => line !== '') },
    { title: 'Avaliação clínica', lines: avaliacaoLines },
    { title: 'Diagnóstico', lines: diagnosticoLines },
    { title: 'Conduta', lines: condutaLines },
    { title: 'Parecer e recomendações', lines: parecerLines },
  ]

  if (relatorio.observacoes?.trim()) {
    sections.push({
      title: 'Observações',
      lines: splitParagraph(relatorio.observacoes),
    })
  }

  return sections
}
