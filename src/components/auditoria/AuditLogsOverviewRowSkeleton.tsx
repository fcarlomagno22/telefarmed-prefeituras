import type { ReactNode } from 'react'
import { Skeleton } from '../ui/Skeleton'
import {
  auditOverviewCardBodyClass,
  auditOverviewCardClass,
} from './auditOverviewCardStyles'

function OverviewCardSkeleton({
  children,
  showAction = false,
}: {
  children: ReactNode
  showAction?: boolean
}) {
  return (
    <section className={auditOverviewCardClass} aria-hidden>
      <div className="flex shrink-0 items-start justify-between gap-2">
        <div className="min-w-0 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        {showAction ? <Skeleton className="h-4 w-16 shrink-0" /> : null}
      </div>
      <div className={auditOverviewCardBodyClass}>{children}</div>
    </section>
  )
}

export function AuditLogsOverviewRowSkeleton() {
  return (
    <div
      className="grid w-full min-w-0 shrink-0 grid-cols-1 gap-3 lg:min-h-[17.5rem] lg:grid-cols-3 lg:items-stretch lg:gap-4"
      aria-busy="true"
      aria-label="Carregando resumo de auditoria"
    >
      <OverviewCardSkeleton>
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        <div className="mt-4 flex flex-1 items-end gap-1">
          {(['h-10', 'h-14', 'h-12', 'h-16', 'h-11', 'h-14', 'h-9', 'h-12', 'h-16', 'h-11', 'h-14', 'h-12'] as const).map(
            (heightClass, index) => (
              <Skeleton
                key={index}
                className={['w-full max-w-4 flex-1 rounded-t-md', heightClass].join(' ')}
              />
            ),
          )}
        </div>
      </OverviewCardSkeleton>

      <OverviewCardSkeleton>
        <Skeleton className="min-h-[5.5rem] w-full flex-1 rounded-xl" />
        <ul className="mt-auto grid shrink-0 grid-cols-5 gap-1.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <li
              key={index}
              className="flex min-h-[3rem] flex-col items-center justify-center gap-1 rounded-lg border border-gray-100 px-1 py-1.5"
            >
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-2.5 w-10" />
              <Skeleton className="h-3 w-8" />
            </li>
          ))}
        </ul>
      </OverviewCardSkeleton>

      <OverviewCardSkeleton showAction>
        <ul className="grid min-h-0 flex-1 auto-rows-fr grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <li
              key={index}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-100 px-2 py-3"
            >
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-10" />
            </li>
          ))}
        </ul>
      </OverviewCardSkeleton>
    </div>
  )
}
