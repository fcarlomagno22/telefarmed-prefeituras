import type { AdminMunicipalityHealth } from '../../../types/adminDashboard'

/** Altura fixa da linha: consultas por hora, central de incidentes e pacote agregado. */
export const adminDashboardTopRowSectionClass = 'h-[19.5rem] max-h-[19.5rem] min-h-0'

/** Corpo dos DashCards da 1ª linha. */
export const adminDashboardTopRowBodyClass =
  'flex min-h-0 flex-1 flex-col overflow-hidden gap-3 p-4'

/** DashCard da 1ª linha — sem min-h padrão do DashCard. */
export const adminDashboardTopRowDashCardClass =
  '!min-h-0 h-full max-h-full overflow-hidden'

/** Terminais / receita — mantém altura anterior. */
export const adminDashboardHourlyBodyClass = 'flex h-[8rem] flex-col overflow-hidden'

export const adminHealthDotClass: Record<AdminMunicipalityHealth, string> = {
  green: 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]',
  yellow: 'bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.25)]',
  red: 'bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.25)]',
}

export const adminHealthLabels: Record<AdminMunicipalityHealth, string> = {
  green: 'Normal',
  yellow: 'Atenção',
  red: 'Crítico',
}

export function formatAdminNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatAdminCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatAdminCurrencyCompact(value: number, options?: { withSymbol?: boolean }) {
  const withSymbol = options?.withSymbol ?? true
  const prefix = withSymbol ? 'R$ ' : ''

  if (Math.abs(value) >= 1_000_000) {
    const amount = value / 1_000_000
    const formatted = Number.isInteger(amount) ? String(amount) : amount.toFixed(1).replace('.', ',')
    return `${prefix}${formatted}M`
  }

  if (Math.abs(value) >= 1_000) {
    const amount = value / 1_000
    const formatted = Number.isInteger(amount) ? String(amount) : amount.toFixed(1).replace('.', ',')
    return `${prefix}${formatted}k`
  }

  return formatAdminCurrency(value)
}
