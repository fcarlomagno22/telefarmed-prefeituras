import { CalendarCheck, CalendarDays, HandMetal, Users } from 'lucide-react'
import { kpiStatStylePresets, type KpiStatCardItem } from '../../components/ui/KpiStatCards'
import type { EscalaSummaryApi } from '../../lib/mockServices/admin/escala'
import type { AdminEscalaShift } from '../../types/adminEscala'
import { countClaimedCapturesInPeriod, countOpenVacancies } from './filterAdminEscalaOpenShifts'
import { formatProfissionalCurrency } from '../profissional/formatProfissionalCurrency'

function averageOpenAmountCents(shifts: AdminEscalaShift[]) {
  const open = shifts.filter(
    (s) => s.assignmentMode === 'open' && s.status === 'publicada' && s.vacancies > 0,
  )
  if (open.length === 0) return 0
  return Math.round(open.reduce((sum, s) => sum + s.amountCents, 0) / open.length)
}

export function buildAdminEscalaKpiCardsFromSummary(
  summary: EscalaSummaryApi,
): KpiStatCardItem[] {
  const [sky, orange, violet, emerald] = kpiStatStylePresets

  return [
    {
      label: 'Plantões publicados',
      value: String(summary.publishedCount),
      suffix: 'no sistema',
      icon: CalendarDays,
      ...emerald,
    },
    {
      label: 'Vagas abertas',
      value: String(summary.openVacancies),
      suffix: 'para captura no portal',
      icon: CalendarCheck,
      ...sky,
    },
    {
      label: 'Captados no mês',
      value: String(summary.claimedThisMonth),
      suffix: 'reservas confirmadas',
      icon: HandMetal,
      ...orange,
    },
    {
      label: 'Taxa de preenchimento',
      value: `${summary.fillRatePercent}%`,
      suffix: `valor médio ${formatProfissionalCurrency(summary.averageOpenAmountCents)}`,
      icon: Users,
      ...violet,
    },
  ]
}

export function buildAdminEscalaKpiCards(shifts: AdminEscalaShift[]): KpiStatCardItem[] {
  const [sky, orange, violet, emerald] = kpiStatStylePresets
  const published = shifts.filter((s) => s.status === 'publicada').length
  const openVacancies = countOpenVacancies(shifts)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const claimedMonth = countClaimedCapturesInPeriod(shifts, monthStart, monthEnd)
  const openPublished = shifts.filter(
    (s) => s.assignmentMode === 'open' && s.status === 'publicada',
  ).length
  const fillRate =
    openPublished === 0
      ? 0
      : Math.round(
          (shifts
            .filter((s) => s.assignmentMode === 'open' && s.status === 'publicada')
            .reduce((sum, s) => sum + (s.totalVacancies - s.vacancies), 0) /
            shifts
              .filter((s) => s.assignmentMode === 'open' && s.status === 'publicada')
              .reduce((sum, s) => sum + s.totalVacancies, 0)) *
            100,
        )

  return [
    {
      label: 'Plantões publicados',
      value: String(published),
      suffix: 'no período carregado',
      icon: CalendarDays,
      ...emerald,
    },
    {
      label: 'Vagas abertas',
      value: String(openVacancies),
      suffix: 'para captura no portal',
      icon: CalendarCheck,
      ...sky,
    },
    {
      label: 'Captados no mês',
      value: String(claimedMonth),
      suffix: 'reservas confirmadas',
      icon: HandMetal,
      ...orange,
    },
    {
      label: 'Taxa de preenchimento',
      value: `${fillRate}%`,
      suffix: `valor médio ${formatProfissionalCurrency(averageOpenAmountCents(shifts))}`,
      icon: Users,
      ...violet,
    },
  ]
}
