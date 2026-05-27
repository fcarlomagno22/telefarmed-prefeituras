import { prefeituraConsultationPackageBase } from '../data/prefeituraConsultationPackageMock'
import type { PrefeituraDashboardFilters } from './prefeituraDashboardFilters'

export type PrefeituraPackageUsageStatus = 'comfortable' | 'attention' | 'critical' | 'exceeded'

export type PrefeituraPackageUsageView = {
  contractedTotal: number
  usedInCycle: number
  remainingInPackage: number
  avulsoCount: number
  usagePercent: number
  projectedTotalAtRenewal: number
  projectedOverflow: number
  daysRemaining: number
  daysElapsed: number
  daysInMonth: number
  cycleStartLabel: string
  cycleCloseLabel: string
  nextCycleStartLabel: string
  status: PrefeituraPackageUsageStatus
  statusLabel: string
  statusHint: string
}

const MS_PER_DAY = 86_400_000

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function diffDays(from: Date, to: Date) {
  return Math.max(
    0,
    Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY),
  )
}

/** Ciclo mensal: inicia no dia 1 e fecha no último dia do mês corrente. */
function getMonthlyCycle(reference: Date) {
  const today = startOfDay(reference)
  const year = today.getFullYear()
  const month = today.getMonth()

  const cycleStart = new Date(year, month, 1)
  const cycleClose = new Date(year, month + 1, 0)
  const nextCycleStart = new Date(year, month + 1, 1)
  const daysInMonth = cycleClose.getDate()

  return { today, cycleStart, cycleClose, nextCycleStart, daysInMonth }
}

const PERIOD_DEMAND_FACTOR: Record<string, number> = {
  hoje: 1,
  '7d': 1.04,
  '30d': 1.08,
}

export function computePrefeituraPackageUsage(
  filters: PrefeituraDashboardFilters,
  shareRatio: number,
): PrefeituraPackageUsageView {
  const base = prefeituraConsultationPackageBase
  const { today, cycleStart, cycleClose, nextCycleStart, daysInMonth } =
    getMonthlyCycle(new Date())

  const daysElapsed = Math.max(1, diffDays(cycleStart, today) + 1)
  const daysRemaining = Math.max(0, diffDays(today, cycleClose))

  const monthProgress = daysElapsed / daysInMonth
  const demandFactor = (PERIOD_DEMAND_FACTOR[filters.period] ?? 1) * (0.94 + shareRatio * 0.1)
  const usedInCycle = Math.min(
    Math.round(base.monthEndUsageBaseline * monthProgress * demandFactor),
    Math.round(base.contractedTotal * 1.15),
  )
  const contractedTotal = base.contractedTotal

  const avulsoCount =
    usedInCycle > contractedTotal
      ? usedInCycle - contractedTotal + base.baseAvulsoCount
      : base.baseAvulsoCount

  const remainingInPackage = Math.max(0, contractedTotal - usedInCycle)
  const usagePercent = Math.min(100, Math.round((usedInCycle / contractedTotal) * 100))

  const dailyRate = usedInCycle / daysElapsed
  const projectedTotalAtRenewal = Math.round(usedInCycle + dailyRate * daysRemaining)
  const projectedOverflow = Math.max(0, projectedTotalAtRenewal - contractedTotal)

  const closeLabel = formatDateLabel(cycleClose)
  const nextCycleLabel = formatDateLabel(nextCycleStart)

  let status: PrefeituraPackageUsageStatus = 'comfortable'
  let statusLabel = 'Ritmo compatível'
  let statusHint =
    'A projeção indica que o pacote mensal deve cobrir a demanda até o fechamento do ciclo.'

  if (usedInCycle >= contractedTotal) {
    status = 'exceeded'
    statusLabel = 'Pacote esgotado'
    statusHint = `Ciclo encerra em ${closeLabel}. Consultas acima do pacote seguem como avulso (cobrança à parte).`
  } else if (projectedOverflow > 0) {
    status = projectedOverflow > contractedTotal * 0.08 ? 'critical' : 'attention'
    statusLabel =
      status === 'critical' ? 'Risco alto de estouro' : 'Atenção ao ritmo'
    statusHint = `Projeção até ${closeLabel}: ~${projectedTotalAtRenewal.toLocaleString('pt-BR')} consultas. Excedente estimado: ${projectedOverflow.toLocaleString('pt-BR')} (avulso). Novo ciclo em ${nextCycleLabel}.`
  } else if (usagePercent >= 78) {
    status = 'attention'
    statusLabel = 'Consumo elevado'
    statusHint = `Restam ${remainingInPackage.toLocaleString('pt-BR')} consultas no pacote e ${daysRemaining} dia(s) até o fechamento (${closeLabel}).`
  }

  return {
    contractedTotal,
    usedInCycle,
    remainingInPackage,
    avulsoCount,
    usagePercent,
    projectedTotalAtRenewal,
    projectedOverflow,
    daysRemaining,
    daysElapsed,
    daysInMonth,
    cycleStartLabel: formatDateLabel(cycleStart),
    cycleCloseLabel: closeLabel,
    nextCycleStartLabel: nextCycleLabel,
    status,
    statusLabel,
    statusHint,
  }
}

export const prefeituraPackageStatusStyles: Record<
  PrefeituraPackageUsageStatus,
  { bar: string; pill: string; text: string; icon: string }
> = {
  comfortable: {
    bar: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
    text: 'text-emerald-700',
    icon: 'text-emerald-600',
  },
  attention: {
    bar: 'bg-amber-500',
    pill: 'bg-amber-50 text-amber-800 ring-amber-200/80',
    text: 'text-amber-700',
    icon: 'text-amber-600',
  },
  critical: {
    bar: 'bg-orange-500',
    pill: 'bg-orange-50 text-orange-800 ring-orange-200/80',
    text: 'text-orange-700',
    icon: 'text-orange-600',
  },
  exceeded: {
    bar: 'bg-red-500',
    pill: 'bg-red-50 text-red-800 ring-red-200/80',
    text: 'text-red-700',
    icon: 'text-red-600',
  },
}
