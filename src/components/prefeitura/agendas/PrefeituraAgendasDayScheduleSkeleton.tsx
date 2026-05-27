import { Skeleton } from '../../ui/Skeleton'
import { prefeituraAgendasDayScheduleHeightClass } from './prefeituraAgendasUi'

const APPOINTMENT_ROWS = 5

export function PrefeituraAgendasDayScheduleSkeleton() {
  return (
    <section
      className={[
        'flex flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]',
        prefeituraAgendasDayScheduleHeightClass,
      ].join(' ')}
      aria-busy="true"
      aria-label="Carregando agenda do dia"
    >
      <header className="shrink-0 border-b border-gray-100 px-4 py-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-1 h-3 w-48" />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 flex-1 min-w-[8rem] rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-24 rounded-full" />
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden px-3 py-2">
        <div className="mb-2 flex gap-2 border-b border-gray-100 pb-2">
          {['w-14', 'w-20', 'w-16', 'w-12', 'w-24'].map((width) => (
            <Skeleton key={width} className={`h-3 ${width}`} />
          ))}
        </div>
        <ul className="space-y-2">
          {Array.from({ length: APPOINTMENT_ROWS }).map((_, index) => (
            <li
              key={index}
              className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2.5"
            >
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 min-w-0 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-24 rounded-lg" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
