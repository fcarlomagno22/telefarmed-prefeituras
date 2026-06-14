import type { ReactNode } from 'react'
import { Skeleton } from '../../ui/Skeleton'
import { profissionalAvaliacoesPanelClass } from '../avaliacao/profissionalAvaliacoesUi'
import {
  BarChartSkeleton,
  DonutLegendSkeleton,
  HorizontalBarsSkeleton,
} from '../../prefeitura/skeletons/prefeituraSkeletonUi'

function SidebarCardSkeleton({
  titleWidth,
  children,
}: {
  titleWidth: string
  children: ReactNode
}) {
  return (
    <section className={[profissionalAvaliacoesPanelClass, 'p-4 sm:p-5'].join(' ')}>
      <Skeleton className={`h-4 ${titleWidth}`} />
      <div className="mt-4">{children}</div>
    </section>
  )
}

export function ProfissionalAvaliacaoChartsSidebarSkeleton() {
  return (
    <aside
      className="flex h-full min-h-0 w-full flex-col gap-4"
      aria-busy="true"
      aria-label="Carregando métricas de avaliação"
    >
      <SidebarCardSkeleton titleWidth="w-32">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-28" />
            <div className="grid grid-cols-3 gap-2 pt-1">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-12 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </SidebarCardSkeleton>

      <SidebarCardSkeleton titleWidth="w-40">
        <HorizontalBarsSkeleton rows={5} />
      </SidebarCardSkeleton>

      <SidebarCardSkeleton titleWidth="w-36">
        <DonutLegendSkeleton rows={3} />
      </SidebarCardSkeleton>

      <SidebarCardSkeleton titleWidth="w-44">
        <BarChartSkeleton bars={7} className="h-[88px]" />
      </SidebarCardSkeleton>

      <SidebarCardSkeleton titleWidth="w-40">
        <BarChartSkeleton bars={7} className="h-[88px]" />
      </SidebarCardSkeleton>

      <SidebarCardSkeleton titleWidth="w-36">
        <BarChartSkeleton bars={6} className="h-24" />
      </SidebarCardSkeleton>

      <SidebarCardSkeleton titleWidth="w-44">
        <DonutLegendSkeleton rows={5} />
      </SidebarCardSkeleton>

      <section className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary-light)]/40 via-white to-amber-50/50"
          aria-hidden
        />
        <Skeleton className="relative m-auto h-[65%] w-[65%] max-w-[180px] rounded-2xl" />
      </section>
    </aside>
  )
}
