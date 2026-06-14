import { Skeleton } from '../../ui/Skeleton'
import { KpiCardsRowSkeleton } from '../../prefeitura/skeletons/prefeituraSkeletonUi'
import { TableRowsSkeleton } from '../../prefeitura/skeletons/prefeituraSkeletonUi'
import {
  profissionalEscalaPanelClass,
  profissionalEscalaShiftsPanelClass,
} from '../escala/profissionalEscalaUi'

const TABLE_ROW_COUNT = 6

function EscalaFiltersBarSkeleton() {
  return (
    <section className={[profissionalEscalaPanelClass, 'shrink-0 p-4 sm:p-5'].join(' ')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>
    </section>
  )
}

function EscalaShiftsListSkeleton() {
  const headerWidths = ['w-10', 'w-14', 'w-16', 'w-14', 'w-12', 'w-10', 'w-12', 'w-14']

  return (
    <section className={profissionalEscalaShiftsPanelClass} aria-busy="true" aria-label="Carregando plantões">
      <header className="shrink-0 border-b border-gray-100 px-5 py-3.5 sm:px-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-1.5 h-3 w-24" />
      </header>

      <div className="min-h-0 flex-1 overflow-hidden px-3 py-2 sm:px-4">
        <div className="mb-2 flex gap-2 border-b border-gray-100 pb-2">
          {headerWidths.map((width, index) => (
            <Skeleton key={`header-col-${index}`} className={`h-3 shrink-0 ${width}`} />
          ))}
        </div>
        <table className="w-full min-w-[52rem]">
          <tbody>
            <TableRowsSkeleton
              columns={8}
              rows={TABLE_ROW_COUNT}
              columnWidths={[
                'mx-auto h-[4.25rem] w-[4.25rem] rounded-xl',
                'mx-auto w-20',
                'mx-auto w-28',
                'mx-auto w-16',
                'mx-auto w-16',
                'mx-auto w-14',
                'mx-auto w-16',
                'mx-auto w-24',
              ]}
            />
          </tbody>
        </table>
      </div>
    </section>
  )
}

function EscalaSidebarPanelSkeleton() {
  return (
    <section
      className={profissionalEscalaShiftsPanelClass}
      aria-busy="true"
      aria-label="Carregando painel lateral"
    >
      <header className="shrink-0 border-b border-gray-100 px-4 py-3.5 sm:px-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-1 h-3 w-28" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-gray-100 bg-gray-50/60 px-2 py-3">
              <Skeleton className="mx-auto h-6 w-10" />
              <Skeleton className="mx-auto mt-1 h-3 w-14" />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-lg" />
          ))}
        </div>

        <div className="mt-auto space-y-2 border-t border-gray-100 pt-4">
          <Skeleton className="h-3 w-32" />
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-gray-100 px-3 py-2.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-1 h-4 w-full max-w-[12rem]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

type ProfissionalEscalaPageSkeletonProps = {
  filtersSlotClass: string
  shiftsSlotClass: string
  kpiSlotClass: string
  sidebarPanelSlotClass: string
  mainColumnClass: string
  sidebarColumnClass: string
  pageGridClass: string
}

export function ProfissionalEscalaPageSkeleton({
  filtersSlotClass,
  shiftsSlotClass,
  kpiSlotClass,
  sidebarPanelSlotClass,
  mainColumnClass,
  sidebarColumnClass,
  pageGridClass,
}: ProfissionalEscalaPageSkeletonProps) {
  return (
    <div className={pageGridClass}>
      <div className={mainColumnClass}>
        <div className={filtersSlotClass}>
          <EscalaFiltersBarSkeleton />
        </div>
        <div className={shiftsSlotClass}>
          <EscalaShiftsListSkeleton />
        </div>
      </div>

      <div className={sidebarColumnClass}>
        <div className={kpiSlotClass}>
          <KpiCardsRowSkeleton count={4} layout="grid-3x2" variant="centered" />
        </div>
        <div className={sidebarPanelSlotClass}>
          <EscalaSidebarPanelSkeleton />
        </div>
      </div>
    </div>
  )
}
