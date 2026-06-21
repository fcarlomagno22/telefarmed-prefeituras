import { Loader2 } from 'lucide-react'
import { Skeleton } from '../ui/Skeleton'

type AttendanceStepLoadingPanelProps = {
  message: string
  compact?: boolean
}

export function AttendanceStepLoadingPanel({
  message,
  compact = false,
}: AttendanceStepLoadingPanelProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center rounded-2xl border border-gray-200/90 bg-gray-50/60 text-center',
        compact ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-12',
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <Loader2
        className={[
          'animate-spin text-[var(--brand-primary)]',
          compact ? 'h-6 w-6' : 'h-8 w-8',
        ].join(' ')}
        aria-hidden
      />
      <p className="max-w-xs text-sm font-medium text-gray-700">{message}</p>
    </div>
  )
}

export function SpecialtySelectionLoadingGrid() {
  return (
    <div className="flex min-h-[12rem] flex-1 flex-col gap-4" role="status" aria-live="polite">
      <div className="flex items-center justify-center gap-2 py-1">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-primary)]" aria-hidden />
        <p className="text-sm text-gray-600">Carregando especialidades…</p>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {Array.from({ length: 9 }).map((_, index) => (
          <Skeleton key={index} className="h-14 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function ScheduleDayChipsSkeleton() {
  return (
    <div className="-mx-1 flex flex-nowrap gap-2 overflow-hidden px-1 pb-2" aria-hidden>
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-[4.75rem] w-[5.75rem] shrink-0 rounded-xl" />
      ))}
    </div>
  )
}
