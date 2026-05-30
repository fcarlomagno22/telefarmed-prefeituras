import { CalendarCheck, CalendarRange, CircleDollarSign, HandMetal } from 'lucide-react'
import {
  kpiStatStylePresets,
  type KpiStatCardItem,
} from '../../components/ui/KpiStatCards'

export type ProfissionalEscalaKpiInput = {
  todayCount: number
  weekCount: number
  avgAmountFormatted: string
  claimedMonth: number
  specialty: string
}

export function buildProfissionalEscalaKpiCards({
  todayCount,
  weekCount,
  avgAmountFormatted,
  claimedMonth,
  specialty,
}: ProfissionalEscalaKpiInput): KpiStatCardItem[] {
  const [sky, orange, violet, emerald] = kpiStatStylePresets

  return [
    {
      label: 'Disponíveis hoje',
      value: String(todayCount),
      suffix: `para ${specialty}`,
      icon: CalendarCheck,
      ...sky,
    },
    {
      label: 'Esta semana',
      value: String(weekCount),
      suffix: 'na sua especialidade',
      icon: CalendarRange,
      ...orange,
    },
    {
      label: 'Valor médio',
      value: avgAmountFormatted,
      suffix: 'dos plantões listados',
      icon: CircleDollarSign,
      ...violet,
    },
    {
      label: 'Plantões já captados',
      value: String(claimedMonth),
      suffix: 'no mês atual',
      icon: HandMetal,
      ...emerald,
    },
  ]
}
