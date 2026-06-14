import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
} from 'lucide-react'
import type { KpiStatCardItem } from '../../components/ui/KpiStatCards'
import type { ConsultasSummary } from '../../data/consultasMock'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

export function buildUbtConsultasKpiCards(
  summary: ConsultasSummary,
  avgDurationMinutes: number | null,
): KpiStatCardItem[] {
  const completionRate =
    summary.total > 0 ? (summary.completed / summary.total) * 100 : 0
  const cancelledRate =
    summary.total > 0 ? (summary.cancelled / summary.total) * 100 : 0

  return [
    {
      label: 'Total de consultas',
      value: formatNumber(summary.total),
      suffix: 'no período selecionado',
      icon: CalendarDays,
      iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
      iconRing: 'ring-blue-100/80',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Concluídas',
      value: formatNumber(summary.completed),
      suffix: `${formatPercent(completionRate)}% do total`,
      icon: CheckCircle2,
      iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
      iconRing: 'ring-emerald-100/80',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Canceladas',
      value: formatNumber(summary.cancelled),
      suffix: `${formatPercent(cancelledRate)}% do total`,
      icon: XCircle,
      iconGradient: 'from-rose-500 via-red-500 to-rose-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(239,68,68,0.35)]',
      iconRing: 'ring-red-100/80',
      topBar: 'from-rose-400 to-red-500',
    },
    {
      label: 'Em andamento',
      value: formatNumber(summary.inProgress),
      suffix: 'aguardando encerramento',
      icon: Activity,
      iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
      iconRing: 'ring-violet-100/80',
      topBar: 'from-violet-400 to-purple-500',
    },
    {
      label: 'Tempo médio',
      value: avgDurationMinutes !== null ? `${avgDurationMinutes} min` : '—',
      suffix: 'consultas concluídas',
      icon: Clock3,
      iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
      iconRing: 'ring-orange-100/80',
      topBar: 'from-orange-400 to-amber-500',
    },
  ]
}
