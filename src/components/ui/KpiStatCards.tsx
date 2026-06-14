import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const KPI_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

function useKpiFillAnimation(enabled: boolean, updateKey?: string) {
  const hasMounted = useRef(false)
  const [fill, setFill] = useState(!enabled)

  useEffect(() => {
    if (!enabled) {
      setFill(true)
      return
    }

    if (!hasMounted.current) {
      hasMounted.current = true
      setFill(false)
      let timer: ReturnType<typeof setTimeout> | undefined
      const raf = requestAnimationFrame(() => {
        timer = window.setTimeout(() => setFill(true), 60)
      })
      return () => {
        cancelAnimationFrame(raf)
        if (timer !== undefined) window.clearTimeout(timer)
      }
    }

    if (updateKey === undefined) {
      setFill(true)
      return
    }

    setFill(false)
    let timer: ReturnType<typeof setTimeout> | undefined
    const raf = requestAnimationFrame(() => {
      timer = window.setTimeout(() => setFill(true), 50)
    })
    return () => {
      cancelAnimationFrame(raf)
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [enabled, updateKey])

  return fill
}

export type KpiStatCardItem = {
  label: string
  value: string
  suffix: string
  icon: LucideIcon
  iconGradient: string
  iconShadow: string
  iconRing: string
  topBar: string
}

const KPI_GRID_LAYOUT = {
  responsive: 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4',
  'grid-2x2': 'grid grid-cols-2 gap-2 sm:gap-3',
  'grid-3x2': 'grid h-full min-h-0 grid-cols-3 grid-rows-2 gap-3',
  'grid-1x6': 'grid w-full min-w-0 grid-cols-6 gap-2 sm:gap-3',
} as const

export type KpiStatCardsLayout = keyof typeof KPI_GRID_LAYOUT

type KpiStatCardsProps = {
  items: KpiStatCardItem[]
  className?: string
  /** Grade fixa 3×2 evita conflito com xl:grid-cols-4 do layout responsivo. */
  layout?: KpiStatCardsLayout
  /** Animação de preenchimento da barra superior (sem esconder os cards). */
  animated?: boolean
  /** Troca de filtro — só reanima preenchimento e destaque do valor. */
  updateKey?: string
  /** Clique no card (ex.: drill-down no dashboard admin). */
  onItemClick?: (index: number, item: KpiStatCardItem) => void
  /** No layout 3x2: ícone na esquerda e título centralizado na 1a linha. */
  stackedHeaderIconLeft?: boolean
  /** Ícone acima; rótulo, valor e legenda centralizados (grade responsiva). */
  variant?: 'default' | 'centered'
}

export function KpiStatCards({
  items,
  className = '',
  layout = 'responsive',
  animated = false,
  updateKey,
  onItemClick,
  stackedHeaderIconLeft = false,
  variant = 'default',
}: KpiStatCardsProps) {
  const fill = useKpiFillAnimation(animated, updateKey)
  const stacked = layout === 'grid-3x2'
  const singleRow = layout === 'grid-1x6'
  const columnLayout = stacked || variant === 'centered'

  return (
    <div
      className={[KPI_GRID_LAYOUT[layout], className].filter(Boolean).join(' ')}
    >
      {items.map((card, index) => {
        const Icon = card.icon
        const stagger = `${index * 0.07}s`

        const interactive = Boolean(onItemClick)
        const CardTag = interactive ? 'button' : 'article'

        const topBarStyle = animated
          ? {
              opacity: fill ? 0.8 : 0.35,
              transform: fill ? 'scaleX(1)' : 'scaleX(0)',
              transition: `transform 0.75s ${KPI_EASE} ${stagger}, opacity 0.4s ${KPI_EASE} ${stagger}`,
            }
          : { opacity: 0.8 }

        const valueStyle = animated
          ? {
              opacity: fill ? 1 : 0.55,
              transform: fill ? 'translateY(0)' : 'translateY(2px)',
              transition: `opacity 0.45s ${KPI_EASE} ${stagger}, transform 0.45s ${KPI_EASE} ${stagger}`,
            }
          : undefined

        return (
          <CardTag
            key={card.label}
            type={interactive ? 'button' : undefined}
            title={
              columnLayout ? `${card.label}: ${card.value}. ${card.suffix}` : undefined
            }
            onClick={interactive ? () => onItemClick?.(index, card) : undefined}
            className={[
              'group relative w-full rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50/50 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)] transition',
              columnLayout
                ? stacked && stackedHeaderIconLeft
                  ? 'flex min-h-0 flex-col px-3 py-3 text-center'
                  : singleRow
                    ? 'flex min-h-0 flex-col items-center justify-center px-2.5 py-3 text-center sm:px-3'
                    : 'flex flex-col items-center justify-center px-4 py-4 text-center'
                : 'flex items-center gap-3 px-4 py-3.5 text-left',
              interactive
                ? 'cursor-pointer hover:border-[var(--brand-primary)]/35 hover:shadow-[0_4px_24px_rgba(255,107,0,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]'
                : 'hover:border-gray-300 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)]',
            ].join(' ')}
          >
            <span
              className={`absolute top-0 h-0.5 origin-left rounded-full bg-gradient-to-r ${card.topBar} ${columnLayout && stacked ? 'inset-x-2.5' : 'inset-x-4'}`}
              aria-hidden
              style={topBarStyle}
            />
            {columnLayout && stacked && stackedHeaderIconLeft ? (
              <span className="grid w-full grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2">
                <span
                  className={[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ring-[3px]',
                    card.iconGradient,
                    card.iconRing,
                    card.iconShadow,
                  ].join(' ')}
                >
                  <Icon className="h-[17px] w-[17px]" strokeWidth={2.25} />
                </span>
                <span className="truncate text-center text-xs font-medium leading-snug text-gray-500">
                  {card.label}
                </span>
                <span aria-hidden />
              </span>
            ) : columnLayout ? (
              <span
                className={[
                  'flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ring-[3px]',
                  card.iconGradient,
                  card.iconRing,
                  card.iconShadow,
                  'h-10 w-10',
                ].join(' ')}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </span>
            ) : (
              <span
                className={[
                  'flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ring-[3px]',
                  card.iconGradient,
                  card.iconRing,
                  card.iconShadow,
                  'h-10 w-10',
                ].join(' ')}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </span>
            )}
            <span
              className={
                columnLayout ? 'mt-2 min-w-0 w-full text-center' : 'min-w-0 flex-1 text-center'
              }
            >
              {!(stacked && stackedHeaderIconLeft) ? (
                <span
                  className={[
                    'block font-medium text-gray-500',
                    columnLayout ? 'text-xs leading-snug' : 'text-xs',
                  ].join(' ')}
                >
                  {card.label}
                </span>
              ) : null}
              <span
                key={animated ? `${updateKey ?? 'init'}-${card.value}` : card.value}
                className={[
                  'mt-0.5 block font-bold leading-tight tracking-tight text-gray-900',
                  singleRow && columnLayout ? 'text-lg' : 'text-xl',
                ].join(' ')}
                style={valueStyle}
              >
                {card.value}
              </span>
              <span
                className={[
                  'mt-0.5 block text-gray-500',
                  columnLayout ? 'text-xs leading-snug' : 'text-xs',
                ].join(' ')}
              >
                {card.suffix}
              </span>
            </span>
          </CardTag>
        )
      })}
    </div>
  )
}

export const kpiStatStylePresets = [
  {
    iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
    iconRing: 'ring-blue-100/80',
    topBar: 'from-sky-400 to-blue-500',
  },
  {
    iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
    iconRing: 'ring-orange-100/80',
    topBar: 'from-orange-400 to-amber-500',
  },
  {
    iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
    iconRing: 'ring-violet-100/80',
    topBar: 'from-violet-400 to-purple-500',
  },
  {
    iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
    iconRing: 'ring-emerald-100/80',
    topBar: 'from-emerald-400 to-green-500',
  },
] as const
