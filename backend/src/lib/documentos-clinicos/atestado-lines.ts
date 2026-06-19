import type { AtestadoPdfData } from './types.js'

export function buildAtestadoDeclarationLines(
  patientName: string,
  atestado: AtestadoPdfData,
  formatDate: (isoDate: string) => string,
  addDays: (isoDate: string, days: number) => string,
): string[] {
  const dataLabel = formatDate(atestado.dataInicio)

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
  const dataFim = addDays(atestado.dataInicio, dias)
  const lines = [
    `Atesto, para os devidos fins, que o(a) paciente ${patientName} necessita de afastamento de suas atividades por ${dias} dia(s).`,
    `Período: ${dataLabel} a ${formatDate(dataFim)}.`,
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
