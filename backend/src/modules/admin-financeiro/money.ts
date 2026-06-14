/** Converte centavos inteiros para reais (número) — API alinhada ao frontend mock. */
export function centavosToReais(centavos: number): number {
  return Math.round(centavos) / 100
}

export function reaisToCentavos(reais: number): number {
  return Math.round(reais * 100)
}

export function formatDateBrFromIso(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate)
  if (!match) return isoDate
  return `${match[3]}/${match[2]}/${match[1]}`
}

export function parseDateBrToIso(brDate: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(brDate.trim())
  if (!match) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(brDate.trim())) return brDate.trim()
    throw new Error('Data inválida')
  }
  return `${match[3]}-${match[2]}-${match[1]}`
}

export function formatCompetenciaLabelFromDate(isoMonth: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(isoMonth)
  if (!match) return isoMonth
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ]
  const monthIndex = Number(match[2]) - 1
  return `${months[monthIndex] ?? match[2]}/${match[1]}`
}

export function formatCnpjDisplay(digits: string): string {
  const d = digits.replace(/\D/g, '')
  if (d.length !== 14) return digits
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

export function deriveContaPagarStatus(
  status: string,
  vencimentoIso: string,
): 'pendente' | 'pago' | 'atrasado' {
  if (status === 'pago') return 'pago'
  const today = new Date().toISOString().slice(0, 10)
  if (vencimentoIso < today) return 'atrasado'
  return 'pendente'
}

export function deriveReceberStatusVencimento(
  statusVencimento: string,
  vencimentoIso: string,
): 'a_vencer' | 'paga' | 'atrasada' {
  if (statusVencimento === 'paga') return 'paga'
  const today = new Date().toISOString().slice(0, 10)
  if (vencimentoIso < today) return 'atrasada'
  return 'a_vencer'
}
