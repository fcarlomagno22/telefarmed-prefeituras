import { profissionalEscalaShiftsPanelClass } from '../../../profissional/escala/profissionalEscalaUi'
import { DashCardSkeleton, KpiCardsRowSkeleton, TableRowsSkeleton } from '../../../prefeitura/skeletons/prefeituraSkeletonUi'
import { Skeleton } from '../../../ui/Skeleton'
import {
  adminEscalaContentSlotClass,
  adminEscalaKpiSlotClass,
  adminEscalaMainColumnClass,
  adminEscalaPageGridClass,
  adminEscalaSidebarColumnClass,
  adminEscalaSidebarPanelSlotClass,
  adminEscalaToolbarSlotClass,
} from '../adminEscalaPageLayout'
import { dashboardPageScrollPaddingClass } from '../../../layout/dashboardPageLayout'

function EscalaTableSkeleton({ showHeaderActions = false }: { showHeaderActions?: boolean }) {
  return (
    <section className={profissionalEscalaShiftsPanelClass} aria-hidden>
      <header className="shrink-0 border-b border-gray-100 px-5 py-3.5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-1.5 h-3 w-24" />
          </div>
          {showHeaderActions ? (
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-xl" />
              <Skeleton className="h-10 w-36 rounded-xl" />
            </div>
          ) : null}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden px-2 py-2">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {Array.from({ length: 9 }).map((_, index) => (
                <th key={index} className="px-3 py-3">
                  <Skeleton className="mx-auto h-3 w-12" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <TableRowsSkeleton columns={9} rows={8} />
          </tbody>
        </table>
      </div>
    </section>
  )
}

function EscalaSidebarSkeleton() {
  return (
    <section className={profissionalEscalaShiftsPanelClass} aria-hidden>
      <header className="shrink-0 border-b border-gray-100 px-4 py-3.5 sm:px-5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-1.5 h-3 w-28" />
      </header>
      <div className="flex-1 space-y-4 px-4 py-4 sm:px-5">
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <Skeleton className="h-3 w-24" />
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </section>
  )
}

type AdminEscalaPageSkeletonProps = {
  groupingMode?: 'lista' | 'escopo'
}

export function AdminEscalaPageSkeleton({ groupingMode = 'lista' }: AdminEscalaPageSkeletonProps) {
  return (
    <div
      className={[adminEscalaPageGridClass, dashboardPageScrollPaddingClass, 'mt-4 flex-1 min-h-0 pb-5'].join(' ')}
      aria-busy="true"
      aria-label="Carregando gestão de escala"
    >
      <div className={adminEscalaMainColumnClass}>
        <div className={adminEscalaToolbarSlotClass}>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-52 rounded-xl" />
          </div>
        </div>

        <div className={adminEscalaContentSlotClass}>
          {groupingMode === 'lista' ? (
            <EscalaTableSkeleton showHeaderActions />
          ) : (
            <DashCardSkeleton className="min-h-[28rem]" titleWidth="w-40" subtitleWidth="w-56" showAction>
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            </DashCardSkeleton>
          )}
        </div>
      </div>

      <div className={adminEscalaSidebarColumnClass}>
        <div className={adminEscalaKpiSlotClass}>
          <KpiCardsRowSkeleton count={4} className="grid-cols-2 gap-2" />
        </div>
        <div className={adminEscalaSidebarPanelSlotClass}>
          <EscalaSidebarSkeleton />
        </div>
      </div>
    </div>
  )
}
