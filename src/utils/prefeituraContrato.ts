import type {
  PrefeituraContratoInfo,
  PrefeituraContratoMonthlyRow,
  PrefeituraContratoRecord,
  PrefeituraContratoUtilizacao,
} from '../types/prefeituraContrato'
import type { PrefeituraPackageUsageStatus, PrefeituraPackageUsageView } from './prefeituraConsultationPackage'

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
): { status: PrefeituraPackageUsageStatus; statusLabel: string; statusHint: string } {
  if (contractedTotal <= 0) {
    return {
      status: 'comfortable',
      statusLabel: 'Sob demanda',
      statusHint: 'Contrato sem pacote pré-contratado.',
    }
  }

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

function buildUsageFromMonthRow(row: PrefeituraContratoMonthlyRow): PrefeituraPackageUsageView {
  const { cycleStartLabel, cycleCloseLabel } = monthCycleLabels(row.year, row.month)
  const contractedTotal = row.contracted
  const usedInCycle = row.performed
  const remainingInPackage = Math.max(0, contractedTotal - usedInCycle)
  const usagePercent =
    contractedTotal > 0 ? Math.min(100, Math.round((usedInCycle / contractedTotal) * 100)) : 0
  const { status, statusLabel, statusHint } = resolvePackageStatus(usedInCycle, contractedTotal)

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

function buildActiveCycleUsage(
  utilizacao: PrefeituraContratoUtilizacao,
  reference = new Date(),
): PrefeituraPackageUsageView {
  const { currentMonth } = utilizacao
  const { cycleStartLabel } = monthCycleLabels(currentMonth.year, currentMonth.month)

  const today = startOfDay(reference)
  const cycleStart = new Date(currentMonth.year, currentMonth.month - 1, 1)
  const cycleClose = new Date(currentMonth.year, currentMonth.month, 0)
  const nextCycleStart = new Date(currentMonth.year, currentMonth.month, 1)
  const daysInMonth = cycleClose.getDate()
  const daysElapsed = Math.max(1, diffDays(cycleStart, today) + 1)
  const daysRemaining = Math.max(0, diffDays(today, cycleClose))

  const contractedTotal = currentMonth.contracted
  const usedInCycle = currentMonth.performed
  const remainingInPackage = Math.max(0, contractedTotal - usedInCycle)
  const usagePercent =
    contractedTotal > 0 ? Math.min(100, Math.round((usedInCycle / contractedTotal) * 100)) : 0
  const avulsoCount = currentMonth.avulsoCount

  const dailyRate = usedInCycle / daysElapsed
  const projectedTotalAtRenewal = Math.round(usedInCycle + dailyRate * daysRemaining)
  const projectedOverflow = Math.max(0, projectedTotalAtRenewal - contractedTotal)

  const closeLabel = formatDateLabel(
    `${cycleClose.getFullYear()}-${String(cycleClose.getMonth() + 1).padStart(2, '0')}-${String(cycleClose.getDate()).padStart(2, '0')}`,
  )
  const nextCycleLabel = formatDateLabel(
    `${nextCycleStart.getFullYear()}-${String(nextCycleStart.getMonth() + 1).padStart(2, '0')}-${String(nextCycleStart.getDate()).padStart(2, '0')}`,
  )

  let status: PrefeituraPackageUsageStatus = 'comfortable'
  let statusLabel = 'Ritmo compatível'
  let statusHint =
    'A projeção indica que o pacote mensal deve cobrir a demanda até o fechamento do ciclo.'

  if (contractedTotal <= 0) {
    status = 'comfortable'
    statusLabel = 'Sob demanda'
    statusHint = 'Contrato sem pacote pré-contratado no ciclo atual.'
  } else if (usedInCycle >= contractedTotal) {
    status = 'exceeded'
    statusLabel = 'Pacote esgotado'
    statusHint = `Ciclo encerra em ${closeLabel}. Consultas acima do pacote seguem como avulso (cobrança à parte).`
  } else if (projectedOverflow > 0) {
    status = projectedOverflow > contractedTotal * 0.08 ? 'critical' : 'attention'
    statusLabel = status === 'critical' ? 'Risco alto de estouro' : 'Atenção ao ritmo'
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
    cycleStartLabel,
    cycleCloseLabel: closeLabel,
    nextCycleStartLabel: nextCycleLabel,
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
  utilizacao?: PrefeituraContratoUtilizacao | null,
): PrefeituraPackageUsageView {
  if (contract.status === 'active' && utilizacao) {
    return buildActiveCycleUsage(utilizacao)
  }

  const lastMonth = getPrefeituraContratoCurrentMonth(contract.monthlyHistory)
  if (lastMonth) {
    return buildUsageFromMonthRow(lastMonth)
  }

  return {
    contractedTotal: contract.info.monthlyPackageConsultations,
    usedInCycle: 0,
    remainingInPackage: contract.info.monthlyPackageConsultations,
    avulsoCount: 0,
    usagePercent: 0,
    projectedTotalAtRenewal: 0,
    projectedOverflow: 0,
    daysRemaining: 0,
    daysElapsed: 0,
    daysInMonth: 30,
    cycleStartLabel: '—',
    cycleCloseLabel: '—',
    nextCycleStartLabel: '—',
    status: 'comfortable',
    statusLabel: 'Sem dados',
    statusHint: 'Nenhuma consulta contabilizada neste contrato.',
  }
}

export function getPrefeituraContratoCycleSectionTitle(contract: PrefeituraContratoRecord) {
  if (contract.status !== 'active') return 'Último mês do contrato'
  if (contract.info.modalidade === 'pacote_fechado') return 'Utilização do contrato'
  return 'Ciclo atual'
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
