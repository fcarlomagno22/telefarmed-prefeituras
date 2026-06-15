import { useMemo } from 'react'
import { PREF_CHART_EASE, usePrefeituraChartAnimation } from '../../prefeitura/prefeituraChartAnimation'
import { formatPrefeituraNumber } from '../../prefeitura/prefeituraDashboardUi'
import type { AdminDashboardTriageBarItem } from '../../../types/adminDashboardTriage'

export type AdminDashboardBarChartItem = AdminDashboardTriageBarItem & {
  gradientFrom: string
  gradientTo: string
}

const DEFAULT_BAR_GRADIENTS = [
  ['#0ea5e9', '#2563eb'],
  ['#10b981', '#059669'],
  ['#8b5cf6', '#6d28d9'],
  ['#f59e0b', '#d97706'],
  ['#ef4444', '#dc2626'],
  ['#14b8a6', '#0d9488'],
  ['#6366f1', '#4f46e5'],
  ['#ec4899', '#db2777'],
  ['#22c55e', '#16a34a'],
  ['#f97316', '#ea580c'],
  ['#06b6d4', '#0891b2'],
  ['#a855f7', '#9333ea'],
] as const

export function withBarGradients(items: AdminDashboardTriageBarItem[]): AdminDashboardBarChartItem[] {
  return items.map((item, index) => {
    const [gradientFrom, gradientTo] = DEFAULT_BAR_GRADIENTS[index % DEFAULT_BAR_GRADIENTS.length]!
    return { ...item, gradientFrom, gradientTo }
  })
}

type AdminDashboardHorizontalBarChartProps = {
  items: AdminDashboardBarChartItem[]
  animationKey: string
  emptyMessage?: string
  maxItems?: number
}

export function AdminDashboardHorizontalBarChart({
  items,
  animationKey,
  emptyMessage = 'Sem dados no recorte selecionado',
  maxItems = 8,
}: AdminDashboardHorizontalBarChartProps) {
  const animate = usePrefeituraChartAnimation(180, animationKey)

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.count - a.count).slice(0, maxItems),
    [items, maxItems],
  )

  const total = sorted.reduce((sum, item) => sum + item.count, 0)
  const max = Math.max(...sorted.map((item) => item.count), 1)

  if (sorted.length === 0 || total === 0) {
    return (
      <p className="flex flex-1 items-center justify-center px-4 text-center text-sm text-gray-500">
        {emptyMessage}
      </p>
    )
  }

  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
      {sorted.map((item, index) => {
        const widthPercent = (item.count / max) * 100
        const sharePercent = total > 0 ? Math.round((item.count / total) * 100) : 0

        return (
          <li key={`${animationKey}-${item.key}`} className="flex min-h-0 flex-col justify-center gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[11px] font-semibold text-gray-800">{item.label}</span>
              <span className="shrink-0 text-[10px] font-bold tabular-nums text-gray-600">
                {sharePercent}%
              </span>
            </div>
            <div className="relative min-h-[1.35rem] overflow-hidden rounded-lg bg-gray-100">
              <div
                className="absolute inset-y-0 left-0 rounded-lg"
                style={{
                  width: animate ? `${widthPercent}%` : '0%',
                  background: `linear-gradient(90deg, ${item.gradientFrom}, ${item.gradientTo})`,
                  transition: `width 0.85s ${PREF_CHART_EASE} ${index * 0.06}s`,
                }}
              />
              <span
                className="relative z-10 flex h-full min-h-[1.35rem] items-center px-2 text-[10px] font-bold tabular-nums text-white drop-shadow-sm"
                style={{
                  opacity: animate ? 1 : 0,
                  transition: `opacity 0.4s ${PREF_CHART_EASE} ${0.2 + index * 0.06}s`,
                }}
              >
                {formatPrefeituraNumber(item.count)}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

type AdminDashboardVerticalBarChartProps = {
  items: AdminDashboardBarChartItem[]
  animationKey: string
  emptyMessage?: string
}

export function AdminDashboardVerticalBarChart({
  items,
  animationKey,
  emptyMessage = 'Sem dados no recorte selecionado',
}: AdminDashboardVerticalBarChartProps) {
  const animate = usePrefeituraChartAnimation(180, animationKey)
  const sorted = useMemo(() => [...items], [items])
  const max = Math.max(...sorted.map((item) => item.count), 1)
  const total = sorted.reduce((sum, item) => sum + item.count, 0)

  if (sorted.length === 0 || total === 0) {
    return (
      <p className="flex flex-1 items-center justify-center px-4 text-center text-sm text-gray-500">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-4 items-end gap-2 px-1 pb-1">
        {sorted.map((item, index) => {
          const heightPercent = (item.count / max) * 100
          return (
            <div key={`${animationKey}-${item.key}`} className="flex min-h-0 flex-col items-center gap-2">
              <span className="text-[10px] font-bold tabular-nums text-gray-700">
                {formatPrefeituraNumber(item.count)}
              </span>
              <div className="flex h-32 w-full items-end rounded-t-xl bg-gray-100">
                <div
                  className="w-full rounded-t-xl"
                  style={{
                    height: animate ? `${heightPercent}%` : '0%',
                    minHeight: item.count > 0 && animate ? '0.75rem' : undefined,
                    background: `linear-gradient(180deg, ${item.gradientFrom}, ${item.gradientTo})`,
                    transition: `height 0.85s ${PREF_CHART_EASE} ${index * 0.08}s`,
                  }}
                />
              </div>
              <span className="text-center text-[10px] font-semibold leading-tight text-gray-600">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
