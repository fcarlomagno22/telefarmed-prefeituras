import { Skeleton } from '../../ui/Skeleton'
import {
  profissionalAgendaColumnsGridClass,
  profissionalAgendaMainColumnFillClass,
  profissionalAgendaMainColumnScrollClass,
  profissionalAgendaSidebarColumnFillClass,
  profissionalAgendaSidebarColumnScrollClass,
} from '../agenda/profissionalAgendaPageLayout'
import { profissionalAgendaPanelClass } from '../agenda/profissionalAgendaUi'

const WEEKDAY_LABELS = 7
const CALENDAR_ROWS = 6
const SHIFT_CARD_COUNT = 2
const UPCOMING_SHIFT_COUNT = 4

function AgendaTabsSkeleton() {
  return (
    <nav
      className={[
        'mb-4 flex shrink-0 flex-col gap-2 overflow-hidden rounded-2xl border border-orange-100/80',
        'bg-gradient-to-br from-white via-white to-[var(--brand-primary-light)]/25 p-1.5',
        'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(255,107,0,0.08)]',
        'xl:flex-row xl:items-stretch',
      ].join(' ')}
      aria-hidden
    >
      <div className="flex min-w-0 flex-1 gap-1">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3"
          >
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <span className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36 max-w-full" />
            </span>
          </div>
        ))}
      </div>
    </nav>
  )
}

function MonthCalendarSkeleton() {
  return (
    <section className={[profissionalAgendaPanelClass, 'flex min-h-0 shrink-0 flex-col p-4 sm:p-5'].join(' ')}>
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1">
        {Array.from({ length: WEEKDAY_LABELS }).map((_, index) => (
          <Skeleton key={index} className="mx-auto h-3 w-6" />
        ))}
      </div>
      <div className="mt-2 grid flex-1 grid-cols-7 gap-1">
        {Array.from({ length: CALENDAR_ROWS * WEEKDAY_LABELS }).map((_, index) => (
          <Skeleton key={index} className="min-h-10 rounded-xl sm:min-h-11" />
        ))}
      </div>
      <div className="mt-3 flex justify-center">
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </section>
  )
}

function ShiftCardSkeleton() {
  return (
    <article className={[profissionalAgendaPanelClass, 'overflow-hidden p-0'].join(' ')}>
      <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </article>
  )
}

function AgendaSidebarSkeleton() {
  return (
    <aside className="flex h-full w-full min-w-0 flex-col gap-3 xl:gap-4" aria-hidden>
      <section
        className={[
          profissionalAgendaPanelClass,
          'shrink-0 overflow-hidden bg-gradient-to-br from-[var(--brand-primary-light)]/50 via-white to-white p-4',
        ].join(' ')}
      >
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-3 w-32" />
          <div className="flex items-end gap-1.5">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 flex-1 rounded-md" />
            ))}
          </div>
        </div>
      </section>

      <section className={[profissionalAgendaPanelClass, 'flex min-h-0 flex-1 flex-col overflow-hidden'].join(' ')}>
        <div className="shrink-0 border-b border-gray-100 px-4 py-3">
          <Skeleton className="h-4 w-36" />
        </div>
        <ul className="min-h-0 flex-1 space-y-2 overflow-hidden px-3 py-2">
          {Array.from({ length: UPCOMING_SHIFT_COUNT }).map((_, index) => (
            <li key={index} className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-1.5 h-4 w-40" />
              <Skeleton className="mt-1 h-3 w-28" />
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}

export function ProfissionalAgendaPageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando agenda">
      <AgendaTabsSkeleton />

      <div className={[profissionalAgendaColumnsGridClass, 'min-h-0 flex-1'].join(' ')}>
        <div className={profissionalAgendaMainColumnScrollClass}>
          <div className={profissionalAgendaMainColumnFillClass}>
            <MonthCalendarSkeleton />

            <section className="flex min-h-0 flex-1 flex-col max-xl:min-h-[12rem] xl:h-full xl:min-h-0">
              <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-2 pb-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="min-h-0 flex-1 space-y-3">
                {Array.from({ length: SHIFT_CARD_COUNT }).map((_, index) => (
                  <ShiftCardSkeleton key={index} />
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className={profissionalAgendaSidebarColumnScrollClass}>
          <div className={profissionalAgendaSidebarColumnFillClass}>
            <AgendaSidebarSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}
