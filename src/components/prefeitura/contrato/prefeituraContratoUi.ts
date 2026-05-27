import type { PrefeituraContratoMonthKpis } from '../../../data/prefeituraContratoMonthConsultations'
import type { PrefeituraContratoMonthlyRow } from '../../../data/prefeituraContratoMock'
import type { PrefeituraConsultasKpi } from '../../../data/prefeituraConsultasMock'
import type { SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'
import { formatPrefeituraNumber } from '../prefeituraDashboardUi'

export const prefeituraContratoOutcomeBadge: Record<
  PrefeituraContratoMonthlyRow['outcome'],
  SituationStatusBadgeStyle
> = {
  within: {
    label: 'Dentro',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.45)]',
  },
  reached: {
    label: 'Atingido',
    text: 'text-amber-700',
    accent: 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(245,158,11,0.45)]',
  },
  exceeded: {
    label: 'Avulsas',
    text: 'text-red-600',
    accent: 'bg-gradient-to-r from-rose-400 via-red-500 to-red-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(239,68,68,0.45)]',
  },
}

export type PrefeituraContratoPeriodTotals = {
  performed: number
  avulso: number
  exceededMonths: number
}

export function buildPrefeituraContratoPeriodKpiCards(
  totals: PrefeituraContratoPeriodTotals,
  monthCountLabel: string,
): PrefeituraConsultasKpi[] {
  return [
    {
      label: `Realizadas (${monthCountLabel})`,
      value: formatPrefeituraNumber(totals.performed),
      footer: 'Soma de consultas no período do contrato',
      footerTone: 'muted',
      footerIcon: 'dot',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: `Avulsas (${monthCountLabel})`,
      value: formatPrefeituraNumber(totals.avulso),
      footer:
        totals.avulso > 0
          ? 'Consultas faturadas acima do pacote'
          : 'Sem consultas avulsas no período',
      footerTone: totals.avulso > 0 ? 'neutral' : 'muted',
      footerIcon: 'dot',
      topBar:
        totals.avulso > 0 ? 'from-red-400 to-rose-500' : 'from-cyan-400 to-sky-500',
    },
    {
      label: 'Meses c/ avulso',
      value: formatPrefeituraNumber(totals.exceededMonths),
      footer:
        totals.exceededMonths > 0
          ? 'Meses com cobrança avulsa registrada'
          : 'Nenhum mês com avulso no período',
      footerTone: totals.exceededMonths > 0 ? 'neutral' : 'muted',
      footerIcon: 'dot',
      topBar:
        totals.exceededMonths > 0
          ? 'from-rose-400 to-red-500'
          : 'from-emerald-400 to-green-500',
    },
  ]
}

export function buildPrefeituraContratoMonthKpiCards(kpis: PrefeituraContratoMonthKpis): PrefeituraConsultasKpi[] {
  const exceededPackage = kpis.performed >= kpis.contracted

  return [
    {
      label: 'Contratadas',
      value: formatPrefeituraNumber(kpis.contracted),
      footer: 'Pacote mensal contratado',
      footerTone: 'muted',
      footerIcon: 'dot',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Realizadas',
      value: formatPrefeituraNumber(kpis.performed),
      footer: exceededPackage ? 'Acima do pacote contratado' : 'Dentro do pacote contratado',
      footerTone: exceededPackage ? 'neutral' : 'positive',
      footerIcon: 'dot',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Uso',
      value: `${kpis.usagePercent}%`,
      footer: 'Do volume contratado no mês',
      footerTone: kpis.usagePercent >= 100 ? 'neutral' : 'muted',
      footerIcon: 'dot',
      topBar:
        kpis.usagePercent >= 100
          ? 'from-red-400 to-rose-500'
          : kpis.usagePercent >= 85
            ? 'from-amber-400 to-orange-500'
            : 'from-emerald-400 to-green-500',
    },
    {
      label: 'Avulsas',
      value: formatPrefeituraNumber(kpis.avulsoCount),
      footer: kpis.avulsoCount > 0 ? 'Consultas faturadas à parte' : 'Sem consultas avulsas',
      footerTone: kpis.avulsoCount > 0 ? 'neutral' : 'muted',
      footerIcon: 'dot',
      topBar:
        kpis.avulsoCount > 0 ? 'from-red-400 to-rose-500' : 'from-cyan-400 to-sky-500',
    },
  ]
}

export const prefeituraContratoExpiryBannerClass: Record<
  'none' | 'info' | 'warning' | 'danger',
  string
> = {
  none: '',
  info: 'border-sky-200/90 bg-gradient-to-br from-sky-50 via-white to-indigo-50/80',
  warning:
    'border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-orange-50/90 shadow-[0_8px_32px_rgba(245,158,11,0.12)]',
  danger:
    'border-red-200/90 bg-gradient-to-br from-red-50 via-white to-rose-50/90 shadow-[0_8px_32px_rgba(239,68,68,0.14)]',
}
