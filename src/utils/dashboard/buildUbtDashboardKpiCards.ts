import {
  AlertTriangle,
  Clock,
  Stethoscope,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { KpiStatCardItem } from '../../components/ui/KpiStatCards'
import type { UbtDashboardKpi } from '../../types/ubtDashboard'

const iconById: Record<string, LucideIcon> = {
  waiting: Users,
  'in-progress': Stethoscope,
  doctors: UserRound,
  'wait-time': Clock,
  alerts: AlertTriangle,
}

const styleById: Record<
  string,
  Pick<KpiStatCardItem, 'iconGradient' | 'iconShadow' | 'iconRing' | 'topBar'>
> = {
  waiting: {
    iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
    iconRing: 'ring-orange-100/80',
    topBar: 'from-orange-400 to-amber-500',
  },
  'in-progress': {
    iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
    iconRing: 'ring-blue-100/80',
    topBar: 'from-sky-400 to-blue-500',
  },
  doctors: {
    iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
    iconRing: 'ring-emerald-100/80',
    topBar: 'from-emerald-400 to-green-500',
  },
  'wait-time': {
    iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
    iconRing: 'ring-violet-100/80',
    topBar: 'from-violet-400 to-purple-500',
  },
  alerts: {
    iconGradient: 'from-rose-500 via-red-500 to-rose-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(239,68,68,0.35)]',
    iconRing: 'ring-red-100/80',
    topBar: 'from-rose-400 to-red-500',
  },
}

const fallbackStyle = styleById.waiting

export function buildUbtDashboardKpiCards(kpis: UbtDashboardKpi[]): KpiStatCardItem[] {
  return kpis.map((kpi) => {
    const style = styleById[kpi.id] ?? fallbackStyle

    return {
      label: kpi.title,
      value: kpi.value,
      suffix: kpi.subtext,
      icon: iconById[kpi.id] ?? Users,
      ...style,
    }
  })
}
