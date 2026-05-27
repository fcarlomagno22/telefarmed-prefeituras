import type { ReactNode } from 'react'
import { Skeleton } from '../../ui/Skeleton'

const KPI_SKELETON_GRID = {
  responsive: 'grid grid-cols-1 gap-4',
  'grid-3x2': 'grid h-full min-h-0 grid-cols-3 grid-rows-2 gap-3',
} as const

export function KpiCardsRowSkeleton({
  count,
  className = 'gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6',
  layout = 'responsive',
}: {
  count: number
  className?: string
  layout?: keyof typeof KPI_SKELETON_GRID
}) {
  const gridClass =
    layout === 'grid-3x2'
      ? KPI_SKELETON_GRID['grid-3x2']
      : [KPI_SKELETON_GRID.responsive, className].filter(Boolean).join(' ')

  const stacked = layout === 'grid-3x2'

  return (
    <div className={gridClass}>
      {Array.from({ length: count }, (_, index) => (
        <article
          key={index}
          className={[
            'relative rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50/50 shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
            stacked
              ? 'flex min-h-0 flex-col items-center justify-center px-3 py-4'
              : 'flex items-center gap-3 px-4 py-3.5',
          ].join(' ')}
        >
          <Skeleton className="absolute inset-x-3 top-0 h-0.5 rounded-full" />
          <Skeleton className={stacked ? 'h-10 w-10 rounded-xl' : 'h-10 w-10 shrink-0 rounded-xl'} />
          <span
            className={[
              'min-w-0 text-center',
              stacked ? 'mt-2 w-full space-y-2' : 'flex-1 space-y-2',
            ].join(' ')}
          >
            <Skeleton className="mx-auto h-3 w-20" />
            <Skeleton className="mx-auto h-6 w-14" />
            <Skeleton className="mx-auto h-3 w-24" />
          </span>
        </article>
      ))}
    </div>
  )
}

export function DashCardSkeleton({
  titleWidth = 'w-36',
  subtitleWidth = 'w-48',
  className = '',
  bodyClassName = 'p-4',
  showAction = false,
  children,
}: {
  titleWidth?: string
  subtitleWidth?: string
  className?: string
  bodyClassName?: string
  showAction?: boolean
  children: ReactNode
}) {
  return (
    <article
      className={[
        'flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-4 py-3.5">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className={`h-4 ${titleWidth}`} />
          <Skeleton className={`h-3 ${subtitleWidth}`} />
        </div>
        {showAction ? <Skeleton className="h-8 w-28 shrink-0 rounded-lg" /> : null}
      </header>
      <div className={['min-h-0 flex-1', bodyClassName].join(' ')}>{children}</div>
    </article>
  )
}

const barHeightClasses = [
  'h-[42%]',
  'h-[68%]',
  'h-[55%]',
  'h-[82%]',
  'h-[38%]',
  'h-[62%]',
  'h-[48%]',
  'h-[74%]',
  'h-[52%]',
  'h-[88%]',
  'h-[45%]',
  'h-[70%]',
]

export function BarChartSkeleton({ bars = 8, className = 'h-44' }: { bars?: number; className?: string }) {
  return (
    <div className={`flex items-end justify-between gap-1.5 px-1 ${className}`}>
      {Array.from({ length: bars }, (_, index) => (
        <Skeleton
          key={index}
          className={[
            'min-w-0 flex-1 rounded-t-md',
            barHeightClasses[index % barHeightClasses.length],
          ].join(' ')}
        />
      ))}
    </div>
  )
}

export function HorizontalBarsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="space-y-1.5">
          <div className="flex justify-between gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function DonutLegendSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <Skeleton className="size-[7.5rem] shrink-0 rounded-full" />
      <div className="w-full min-w-0 flex-1 space-y-2.5">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-2">
            <Skeleton className="size-2.5 shrink-0 rounded-full" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function TableRowsSkeleton({
  columns,
  rows = 5,
  columnWidths,
}: {
  columns: number
  rows?: number
  columnWidths?: string[]
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={rowIndex} className="border-t border-gray-100">
          {Array.from({ length: columns }, (_, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <Skeleton
                className={[
                  'h-4',
                  columnWidths?.[colIndex] ?? (colIndex === 0 ? 'w-40' : 'mx-auto w-16'),
                ].join(' ')}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
