import {
  AlertTriangle,
  Clock,
  Stethoscope,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Sparkline } from './Sparkline'

const iconMap: Record<string, LucideIcon> = {
  waiting: Users,
  'in-progress': Stethoscope,
  doctors: UserRound,
  'wait-time': Clock,
  alerts: AlertTriangle,
}

const toneStyles = {
  orange: 'bg-[var(--brand-primary-light)] text-[var(--brand-primary)]',
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-red-50 text-red-500',
}

type MetricCardProps = {
  id: string
  title: string
  value: string
  subtext: string
  subtextClass?: string
  iconTone: 'orange' | 'green' | 'red'
  sparkline?: number[]
  isAlert?: boolean
}

export function MetricCard({
  id,
  title,
  value,
  subtext,
  subtextClass = 'text-gray-500',
  iconTone,
  sparkline,
  isAlert,
}: MetricCardProps) {
  const Icon = iconMap[id] ?? Users

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${toneStyles[iconTone]}`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      <p className={`mt-0.5 text-xs ${subtextClass}`}>{subtext}</p>

      <div className="mt-3">
        {isAlert ? (
          <AlertTriangle
            className="absolute -bottom-2 -right-2 h-20 w-20 text-red-100"
            strokeWidth={1}
          />
        ) : sparkline ? (
          <Sparkline
            data={sparkline}
            color={
              iconTone === 'green'
                ? '#10b981'
                : iconTone === 'red'
                  ? '#ef4444'
                  : 'var(--brand-primary)'
            }
          />
        ) : null}
      </div>
    </article>
  )
}
