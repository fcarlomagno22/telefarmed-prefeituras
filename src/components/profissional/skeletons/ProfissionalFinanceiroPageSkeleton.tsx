import { Skeleton } from '../../ui/Skeleton'
import {
  profissionalFinanceiroAlignedPanelClass,
  profissionalFinanceiroPanelClass,
} from '../financeiro/profissionalFinanceiroUi'
import {
  profissionalFinanceiroGridClass,
  profissionalFinanceiroHistoryCellClass,
  profissionalFinanceiroMainColumnClass,
  profissionalFinanceiroShiftsCellClass,
  profissionalFinanceiroSidebarColumnClass,
} from '../financeiro/profissionalFinanceiroPageLayout'
import { ProfissionalFinanceiroShiftsTableSkeleton } from './ProfissionalFinanceiroShiftsTableSkeleton'

const HISTORY_ROW_COUNT = 5

function FinanceiroMonthNavSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3">
      <Skeleton className="h-9 w-9 rounded-lg" />
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-9 w-9 rounded-lg" />
    </div>
  )
}

function FinanceiroHeroCardSkeleton() {
  return (
    <section className={[profissionalFinanceiroPanelClass, 'relative shrink-0 overflow-hidden p-5'].join(' ')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
        <div className="min-w-0 flex-1 space-y-2 sm:max-w-[38%]">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center rounded-xl border border-gray-100 bg-white/70 px-2 py-3"
            >
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="mt-2 h-3 w-16" />
              <Skeleton className="mt-1.5 h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ProfissionalFinanceiroShiftsPanelSkeleton() {
  return (
    <section className={profissionalFinanceiroAlignedPanelClass} aria-busy="true" aria-label="Carregando extrato">
      <div className="shrink-0 border-b border-gray-100 px-5 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
      </div>
      <ProfissionalFinanceiroShiftsTableSkeleton />
    </section>
  )
}

function FinanceiroForecastSectionSkeleton() {
  return (
    <section className={[profissionalFinanceiroPanelClass, 'shrink-0 p-4 sm:p-5'].join(' ')}>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="mt-4 h-[120px] w-full rounded-xl" />
      <div className="mt-3 flex justify-center gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-16" />
        ))}
      </div>
    </section>
  )
}

function FinanceiroHistorySectionSkeleton() {
  return (
    <section className={profissionalFinanceiroAlignedPanelClass}>
      <div className="shrink-0 border-b border-gray-100 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-44" />
        </div>
      </div>
      <ul className="divide-y divide-gray-100">
        {Array.from({ length: HISTORY_ROW_COUNT }).map((_, index) => (
          <li key={index} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="min-w-0 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-6 w-[7.5rem] rounded-lg" />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ProfissionalFinanceiroPageSkeleton() {
  return (
    <div className={profissionalFinanceiroGridClass} aria-busy="true" aria-label="Carregando financeiro">
      <div className={profissionalFinanceiroMainColumnClass}>
        <FinanceiroMonthNavSkeleton />
        <FinanceiroHeroCardSkeleton />
        <div className={profissionalFinanceiroShiftsCellClass}>
          <ProfissionalFinanceiroShiftsPanelSkeleton />
        </div>
      </div>

      <div className={profissionalFinanceiroSidebarColumnClass}>
        <FinanceiroForecastSectionSkeleton />
        <div className={profissionalFinanceiroHistoryCellClass}>
          <FinanceiroHistorySectionSkeleton />
        </div>
      </div>
    </div>
  )
}
