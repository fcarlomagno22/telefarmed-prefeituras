import type {
  PrefeituraContratoInfo,
  PrefeituraContratoMonthlyRow,
  PrefeituraContratoRecord,
} from '../data/prefeituraContratoMock'
import { prefeituraContratoDefaultId } from '../data/prefeituraContratoMock'
import {
  computePrefeituraPackageUsage,
  type PrefeituraPackageUsageStatus,
  type PrefeituraPackageUsageView,
} from './prefeituraConsultationPackage'

export type PrefeituraContratoExpiryStatus =
  | 'active'
  | 'renewal_window'
  | 'countdown'
  | 'critical'
  | 'expired'

export type PrefeituraContratoExpiryView = {
  status: PrefeituraContratoExpiryStatus
  daysRemaining: number
  totalDays: number
  progressPercent: number
  startsAtLabel: string
  endsAtLabel: string
  showCountdown: boolean
  headline: string
  detail: string
  alertLevel: 'none' | 'info' | 'warning' | 'danger'
}

const MS_PER_DAY = 86_400_000
const COUNTDOWN_THRESHOLD_DAYS = 60
const CRITICAL_THRESHOLD_DAYS = 14

function formatDateLabel(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(y, m - 1, d))
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function diffDays(from: Date, to: Date) {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY)
}

function parseIsoDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return startOfDay(new Date(y, m - 1, d))
}

function monthCycleLabels(year: number, month: number) {
  const cycleStart = new Date(year, month - 1, 1)
  const cycleClose = new Date(year, month, 0)
  return {
    cycleStartLabel: formatDateLabel(
      `${cycleStart.getFullYear()}-${String(cycleStart.getMonth() + 1).padStart(2, '0')}-01`,
    ),
    cycleCloseLabel: formatDateLabel(
      `${cycleClose.getFullYear()}-${String(cycleClose.getMonth() + 1).padStart(2, '0')}-${String(cycleClose.getDate()).padStart(2, '0')}`,
    ),
  }
}

function resolvePackageStatus(
  usedInCycle: number,
  contractedTotal: number,
  avulsoCount: number,
): { status: PrefeituraPackageUsageStatus; statusLabel: string; statusHint: string } {
  const usagePercent = Math.min(100, Math.round((usedInCycle / contractedTotal) * 100))

  if (usedInCycle >= contractedTotal) {
    return {
      status: 'exceeded',
      statusLabel: 'Pacote esgotado',
      statusHint: 'Ciclo encerrado com utilização no limite ou acima do pacote.',
    }
  }
  if (usagePercent >= 78) {
    return {
      status: 'attention',
      statusLabel: 'Consumo elevado',
      statusHint: 'Ciclo encerrado com consumo próximo ao limite contratado.',
    }
  }
  return {
    status: 'comfortable',
    statusLabel: 'Dentro do pacote',
    statusHint: 'Ciclo encerrado dentro do volume contratado.',
  }
}

function buildUsageFromMonthRow(
  row: PrefeituraContratoMonthlyRow,
): PrefeituraPackageUsageView {
  const { cycleStartLabel, cycleCloseLabel } = monthCycleLabels(row.year, row.month)
  const contractedTotal = row.contracted
  const usedInCycle = row.performed
  const remainingInPackage = Math.max(0, contractedTotal - usedInCycle)
  const usagePercent = Math.min(100, Math.round((usedInCycle / contractedTotal) * 100))
  const { status, statusLabel, statusHint } = resolvePackageStatus(
    usedInCycle,
    contractedTotal,
    row.avulsoCount,
  )

  return {
    contractedTotal,
    usedInCycle,
    remainingInPackage,
    avulsoCount: row.avulsoCount,
    usagePercent,
    projectedTotalAtRenewal: usedInCycle,
    projectedOverflow: row.avulsoCount,
    daysRemaining: 0,
    daysElapsed: 30,
    daysInMonth: 30,
    cycleStartLabel,
    cycleCloseLabel,
    nextCycleStartLabel: cycleCloseLabel,
    status,
    statusLabel,
    statusHint,
  }
}

export function computePrefeituraContratoExpiry(
  contract: PrefeituraContratoInfo,
  reference = new Date(),
): PrefeituraContratoExpiryView {
  const today = startOfDay(reference)
  const start = parseIsoDate(contract.startsAt)
  const end = parseIsoDate(contract.endsAt)
  const totalDays = Math.max(1, diffDays(start, end))
  const daysRemaining = diffDays(today, end)
  const elapsed = Math.max(0, diffDays(start, today))
  const progressPercent = Math.min(100, Math.round((elapsed / totalDays) * 100))

  const startsAtLabel = formatDateLabel(contract.startsAt)
  const endsAtLabel = formatDateLabel(contract.endsAt)

  if (daysRemaining < 0) {
    return {
      status: 'expired',
      daysRemaining: 0,
      totalDays,
      progressPercent: 100,
      startsAtLabel,
      endsAtLabel,
      showCountdown: true,
      headline: 'Contrato encerrado',
      detail: `Vigência encerrada em ${endsAtLabel}. Consulte contratos anteriores no seletor acima.`,
      alertLevel: 'danger',
    }
  }

  if (daysRemaining <= CRITICAL_THRESHOLD_DAYS) {
    return {
      status: 'critical',
      daysRemaining,
      totalDays,
      progressPercent,
      startsAtLabel,
      endsAtLabel,
      showCountdown: true,
      headline: `${daysRemaining} dia${daysRemaining === 1 ? '' : 's'} para o fim`,
      detail: `Renovação urgente: o contrato encerra em ${endsAtLabel}.`,
      alertLevel: 'danger',
    }
  }

  if (daysRemaining <= COUNTDOWN_THRESHOLD_DAYS) {
    return {
      status: 'countdown',
      daysRemaining,
      totalDays,
      progressPercent,
      startsAtLabel,
      endsAtLabel,
      showCountdown: true,
      headline: `${daysRemaining} dias restantes`,
      detail: `Contagem regressiva ativa — vigência até ${endsAtLabel}.`,
      alertLevel: 'warning',
    }
  }

  if (daysRemaining <= 90) {
    return {
      status: 'renewal_window',
      daysRemaining,
      totalDays,
      progressPercent,
      startsAtLabel,
      endsAtLabel,
      showCountdown: false,
      headline: 'Janela de renovação',
      detail: `Contrato válido até ${endsAtLabel}. A contagem regressiva inicia aos 60 dias.`,
      alertLevel: 'info',
    }
  }

  return {
    status: 'active',
    daysRemaining,
    totalDays,
    progressPercent,
    startsAtLabel,
    endsAtLabel,
    showCountdown: false,
    headline: 'Contrato em vigor',
    detail: `Vigência de ${startsAtLabel} a ${endsAtLabel}.`,
    alertLevel: 'none',
  }
}

export function getPrefeituraContratoCurrentMonth(
  history: PrefeituraContratoMonthlyRow[],
): PrefeituraContratoMonthlyRow | undefined {
  return history[history.length - 1]
}

export function getPrefeituraContratoCycleUsage(
  contract: PrefeituraContratoRecord,
): PrefeituraPackageUsageView {
  if (contract.status === 'active' && contract.id === prefeituraContratoDefaultId) {
    return computePrefeituraPackageUsage(
      { period: '30d', region: 'todas', ubt: 'todas' },
      1,
    )
  }

  const lastMonth = getPrefeituraContratoCurrentMonth(contract.monthlyHistory)
  if (lastMonth) {
    return buildUsageFromMonthRow(lastMonth)
  }

  return computePrefeituraPackageUsage(
    { period: '30d', region: 'todas', ubt: 'todas' },
    1,
  )
}

export function getPrefeituraContratoCycleSectionTitle(contract: PrefeituraContratoRecord) {
  return contract.status === 'active' ? 'Ciclo atual' : 'Último mês do contrato'
}

export const prefeituraContratoOutcomeLabels: Record<
  PrefeituraContratoMonthlyRow['outcome'],
  { label: string; hint: string }
> = {
  within: {
    label: 'Dentro do pacote',
    hint: 'Utilização abaixo do volume contratado no mês.',
  },
  reached: {
    label: 'Pacote atingido',
    hint: 'Volume contratado consumido sem consultas avulsas.',
  },
  exceeded: {
    label: 'Com avulsas',
    hint: 'Consultas acima do pacote faturadas à parte.',
  },
}
