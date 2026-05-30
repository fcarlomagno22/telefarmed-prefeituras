import { Skeleton } from '../../../ui/Skeleton'
import {
  HorizontalBarsSkeleton,
  KpiCardsRowSkeleton,
  TableRowsSkeleton,
} from '../../../prefeitura/skeletons/prefeituraSkeletonUi'

export { HorizontalBarsSkeleton, KpiCardsRowSkeleton, TableRowsSkeleton }

export function AdminCredenciaisPageHeaderSkeleton() {
  return (
    <header className="shrink-0" aria-hidden>
      <Skeleton className="h-3 w-52 max-w-full" />
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-7 w-56 max-w-full sm:h-8 sm:w-72" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-[92%] max-w-xl" />
        </div>
        <Skeleton className="h-11 w-44 shrink-0 rounded-xl sm:self-start" />
      </div>
    </header>
  )
}

export function AdminCredenciaisTabsSkeleton() {
  const tabWidths = [
    { label: 'w-[7.5rem]', hint: 'w-[9.5rem]' },
    { label: 'w-20', hint: 'w-[8.5rem]' },
    { label: 'w-10', hint: 'w-[8.25rem]' },
  ]

  return (
    <nav
      aria-hidden
      className="flex shrink-0 gap-0 overflow-x-auto border-b border-gray-200 bg-white px-4 sm:px-5"
    >
      {tabWidths.map((widths, index) => (
        <div
          key={index}
          className="relative shrink-0 px-4 py-3 sm:px-5"
        >
          <Skeleton className={`h-3.5 ${widths.label}`} />
          <Skeleton className={`mt-1.5 h-2.5 ${widths.hint}`} />
          {index === 0 ? (
            <span
              className="pointer-events-none absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 sm:inset-x-4"
              aria-hidden
            />
          ) : null}
        </div>
      ))}
    </nav>
  )
}

export function AdminCredenciaisPageKpiRowSkeleton() {
  return (
    <KpiCardsRowSkeleton
      count={4}
      className="shrink-0 sm:grid-cols-2 xl:grid-cols-4"
    />
  )
}

export function CredentialTableUserCellSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-[72%] max-w-[11rem]" />
        <Skeleton className="h-3 w-[85%] max-w-[13rem]" />
      </div>
    </div>
  )
}

export function CredentialTableActionCellSkeleton() {
  return (
    <div className="flex justify-center">
      <Skeleton className="h-9 w-9 rounded-lg" />
    </div>
  )
}

export function FilterSelectSkeleton({ className = 'min-w-[160px]' }: { className?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Skeleton className="h-3 w-10 shrink-0" />
      <Skeleton className={`h-10 flex-1 rounded-xl ${className}`} />
    </span>
  )
}

export function SearchFieldSkeleton({ className = 'lg:min-w-[20rem]' }: { className?: string }) {
  return (
    <div className={`relative min-w-0 flex-1 ${className}`}>
      <Skeleton className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 rounded" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  )
}

export function PanelTitleBlockSkeleton({
  titleWidth = 'w-44',
  descriptionWidth = 'w-full max-w-md',
}: {
  titleWidth?: string
  descriptionWidth?: string
}) {
  return (
    <div className="min-w-0 space-y-2">
      <Skeleton className={`h-5 ${titleWidth}`} />
      <Skeleton className={`h-4 ${descriptionWidth}`} />
    </div>
  )
}

export function AboutPanelMiniKpiGridSkeleton({ blockedSpan2 = true }: { blockedSpan2?: boolean }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
      <div className="rounded-lg border border-gray-200/80 bg-white px-2.5 py-2 text-center">
        <Skeleton className="mx-auto h-2.5 w-10" />
        <Skeleton className="mx-auto mt-2 h-6 w-8" />
      </div>
      <div className="rounded-lg border border-gray-200/80 bg-white px-2.5 py-2 text-center">
        <Skeleton className="mx-auto h-2.5 w-10" />
        <Skeleton className="mx-auto mt-2 h-6 w-8" />
        <Skeleton className="mx-auto mt-1 h-2 w-8" />
      </div>
      {blockedSpan2 ? (
        <div className="col-span-2 rounded-lg border border-gray-200/80 bg-white px-2.5 py-2 text-center">
          <Skeleton className="mx-auto h-2.5 w-16" />
          <Skeleton className="mx-auto mt-2 h-6 w-8" />
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-gray-200/80 bg-white px-2.5 py-2 text-center">
            <Skeleton className="mx-auto h-2.5 w-16" />
            <Skeleton className="mx-auto mt-2 h-6 w-8" />
            <Skeleton className="mx-auto mt-1 h-2 w-8" />
          </div>
          <div className="rounded-lg border border-gray-200/80 bg-white px-2.5 py-2 text-center">
            <Skeleton className="mx-auto h-2.5 w-16" />
            <Skeleton className="mx-auto mt-2 h-6 w-8" />
            <Skeleton className="mx-auto mt-1 h-2 w-12" />
          </div>
        </>
      )}
    </div>
  )
}

export function AboutPanelBarSectionSkeleton({
  titleWidth = 'w-16',
  subtitle,
  rows = 4,
}: {
  titleWidth?: string
  subtitle?: boolean
  rows?: number
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
      <Skeleton className={`h-3 ${titleWidth}`} />
      {subtitle ? <Skeleton className="mt-1.5 h-3 w-40" /> : null}
      <div className="mt-3">
        <HorizontalBarsSkeleton rows={rows} />
      </div>
    </section>
  )
}

export function AboutPanelIllustrationSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className={`mt-2 flex shrink-0 items-end pb-1 pt-1 ${tall ? '' : ''}`}>
      <Skeleton className={`w-full rounded-xl ${tall ? 'h-32' : 'h-28'}`} />
    </div>
  )
}
