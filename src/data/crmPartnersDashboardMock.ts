import {
  Building2,
  Handshake,
  Receipt,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { KpiStatCardItem } from '../components/ui/KpiStatCards'

export type CrmPartnersMonthKey = `${number}-${string}`

export type CrmPartnersMonthRange = {
  startMonth: CrmPartnersMonthKey
  endMonth: CrmPartnersMonthKey
}

export type CrmPartnersDashboardData = {
  filterKey: string
  periodLabel: string
  clientsBreakdown: {
    total: number
    prefeitura: number
    santaCasa: number
    empresa: number
  }
  kpiCards: KpiStatCardItem[]
  clientsByType: Array<{ key: string; label: string; count: number }>
  commissionsByMonth: Array<{ key: string; label: string; paid: number; pending: number }>
  referredClientsTrend: Array<{ key: string; label: string; count: number }>
}

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const

export function getCurrentCrmPartnersMonthKey(): CrmPartnersMonthKey {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

export function formatCrmPartnersMonthLabel(monthKey: CrmPartnersMonthKey): string {
  const [year, month] = monthKey.split('-')
  const monthIndex = Number(month) - 1
  if (!year || monthIndex < 0 || monthIndex > 11) return monthKey
  return `${MONTH_LABELS[monthIndex]}/${year}`
}

export function buildCrmPartnersMonthOptions(monthsBack = 24): Array<{
  value: CrmPartnersMonthKey
  label: string
}> {
  const options: Array<{ value: CrmPartnersMonthKey; label: string }> = []
  const cursor = new Date()

  for (let index = 0; index < monthsBack; index += 1) {
    const year = cursor.getFullYear()
    const month = String(cursor.getMonth() + 1).padStart(2, '0')
    const value = `${year}-${month}` as CrmPartnersMonthKey
    options.push({ value, label: formatCrmPartnersMonthLabel(value) })
    cursor.setMonth(cursor.getMonth() - 1)
  }

  return options
}

export function compareCrmPartnersMonthKeys(
  left: CrmPartnersMonthKey,
  right: CrmPartnersMonthKey,
): number {
  return left.localeCompare(right)
}

export function isCrmPartnersMonthRangeValid(range: CrmPartnersMonthRange): boolean {
  return compareCrmPartnersMonthKeys(range.startMonth, range.endMonth) <= 0
}

export function listCrmPartnersMonthsInRange(range: CrmPartnersMonthRange): CrmPartnersMonthKey[] {
  if (!isCrmPartnersMonthRangeValid(range)) return []

  const [startYear, startMonth] = range.startMonth.split('-').map(Number)
  const [endYear, endMonth] = range.endMonth.split('-').map(Number)
  const months: CrmPartnersMonthKey[] = []

  let year = startYear
  let month = startMonth

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}` as CrmPartnersMonthKey)
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }

  return months
}

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

function seededValue(seed: string, min: number, max: number): number {
  const span = max - min + 1
  return min + (hashString(seed) % span)
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function buildCrmPartnersDashboardMock(range: CrmPartnersMonthRange): CrmPartnersDashboardData {
  const months = listCrmPartnersMonthsInRange(range)
  const filterKey = `${range.startMonth}:${range.endMonth}`
  const monthSpan = Math.max(months.length, 1)

  const activePartners = seededValue(`${filterKey}:partners`, 18, 42)
  const clientsPrefeitura = seededValue(`${filterKey}:pref`, 8, 28) * monthSpan
  const clientsSantaCasa = seededValue(`${filterKey}:sc`, 4, 16) * monthSpan
  const clientsEmpresa = seededValue(`${filterKey}:emp`, 3, 14) * monthSpan
  const clientsTotal = clientsPrefeitura + clientsSantaCasa + clientsEmpresa

  const commissionsPending = seededValue(`${filterKey}:pending`, 12000, 68000) * monthSpan
  const commissionsPaid = seededValue(`${filterKey}:paid`, 18000, 92000) * monthSpan
  const averageTicket = clientsTotal > 0 ? Math.round((commissionsPaid + commissionsPending) / clientsTotal) : 0

  const periodLabel =
    range.startMonth === range.endMonth
      ? formatCrmPartnersMonthLabel(range.startMonth)
      : `${formatCrmPartnersMonthLabel(range.startMonth)} – ${formatCrmPartnersMonthLabel(range.endMonth)}`

  const clientsByType = [
    { key: 'prefeitura', label: 'Prefeitura', count: clientsPrefeitura },
    { key: 'santa_casa', label: 'Santa Casa', count: clientsSantaCasa },
    { key: 'empresa', label: 'Empresa', count: clientsEmpresa },
  ]

  const commissionsByMonth = months.map((monthKey) => {
    const paid = seededValue(`${filterKey}:${monthKey}:paid`, 14000, 78000)
    const pending = seededValue(`${filterKey}:${monthKey}:pending`, 8000, 42000)
    return {
      key: monthKey,
      label: formatCrmPartnersMonthLabel(monthKey),
      paid,
      pending,
    }
  })

  const referredClientsTrend = months.map((monthKey) => ({
    key: monthKey,
    label: formatCrmPartnersMonthLabel(monthKey),
    count: seededValue(`${filterKey}:${monthKey}:clients`, 6, 34),
  }))

  return {
    filterKey,
    periodLabel,
    clientsBreakdown: {
      total: clientsTotal,
      prefeitura: clientsPrefeitura,
      santaCasa: clientsSantaCasa,
      empresa: clientsEmpresa,
    },
    kpiCards: [
      {
        label: 'Parceiros ativos',
        value: formatNumber(activePartners),
        suffix: 'na rede',
        icon: Handshake,
        iconGradient: 'from-orange-400 via-orange-500 to-amber-500',
        iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
        iconRing: 'ring-orange-100/80',
        topBar: 'from-orange-400 to-amber-500',
      },
      {
        label: 'Clientes indicados',
        value: formatNumber(clientsTotal),
        suffix: 'no período',
        icon: Users,
        iconGradient: 'from-sky-500 via-blue-500 to-indigo-500',
        iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.28)]',
        iconRing: 'ring-sky-100/80',
        topBar: 'from-sky-400 to-indigo-500',
      },
      {
        label: 'Comissões a pagar',
        value: formatCurrency(commissionsPending),
        suffix: 'no período',
        icon: Receipt,
        iconGradient: 'from-amber-400 via-orange-500 to-orange-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(245,158,11,0.28)]',
        iconRing: 'ring-amber-100/80',
        topBar: 'from-amber-400 to-orange-500',
      },
      {
        label: 'Comissões pagas',
        value: formatCurrency(commissionsPaid),
        suffix: 'no período',
        icon: TrendingUp,
        iconGradient: 'from-emerald-400 via-emerald-500 to-teal-500',
        iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.28)]',
        iconRing: 'ring-emerald-100/80',
        topBar: 'from-emerald-400 to-teal-500',
      },
      {
        label: 'Ticket médio por cliente',
        value: formatCurrency(averageTicket),
        suffix: 'média no período',
        icon: Building2,
        iconGradient: 'from-violet-400 via-purple-500 to-fuchsia-500',
        iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.28)]',
        iconRing: 'ring-violet-100/80',
        topBar: 'from-violet-400 to-fuchsia-500',
      },
    ],
    clientsByType,
    commissionsByMonth,
    referredClientsTrend,
  }
}
