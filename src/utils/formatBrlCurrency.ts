/** Máscara de digitação em Real (centavos → R$ 0,00). */
export function formatBrlCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const value = Number(digits) / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Converte valor mascarado ou texto livre para reais (número). */
export function parseBrlCurrencyInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  return Number(digits) / 100
}
