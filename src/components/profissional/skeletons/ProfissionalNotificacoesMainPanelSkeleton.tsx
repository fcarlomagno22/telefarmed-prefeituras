import { Skeleton } from '../../ui/Skeleton'
import { dashboardMainPanelSurfaceClass } from '../../layout/dashboardPageLayout'

const TABLE_ROW_COUNT = 8
const headerWidths = ['w-10', 'w-14', 'w-8', 'w-8', 'w-12', 'w-10', 'w-8', 'w-6']

export function ProfissionalNotificacoesMainPanelSkeleton() {
  return (
    <section
      className={[dashboardMainPanelSurfaceClass, 'flex min-h-0 flex-1 flex-col !shrink'].join(' ')}
      aria-busy="true"
      aria-label="Carregando central de notificações"
    >
      <header className="shrink-0 border-b border-gray-100 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-40 shrink-0 rounded-lg" />
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 min-h-10 w-full flex-1 rounded-xl" />
          <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2 lg:w-[min(100%,24rem)]">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden bg-white px-1 py-2">
        <div className="mb-2 flex justify-center gap-1 border-b border-gray-100 pb-2">
          {headerWidths.map((width, index) => (
            <Skeleton key={`header-col-${index}`} className={`h-3 shrink-0 ${width}`} />
          ))}
        </div>
        <ul className="divide-y divide-gray-100">
          {Array.from({ length: TABLE_ROW_COUNT }).map((_, index) => (
            <li
              key={index}
              className={[
                'grid items-center gap-1 px-1 py-2.5',
                index === 0 || index === 2 ? 'bg-orange-50/30' : '',
              ].join(' ')}
              style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}
            >
              <Skeleton className="mx-auto h-5 w-10 rounded-full" />
              <Skeleton className="mx-auto h-3 w-full max-w-[8rem]" />
              <Skeleton className="mx-auto h-3 w-full max-w-[5rem]" />
              <Skeleton className="mx-auto h-3 w-full max-w-[5rem]" />
              <Skeleton className="mx-auto h-6 w-[4.75rem] rounded-lg" />
              <Skeleton className="mx-auto h-5 w-14 rounded-md" />
              <Skeleton className="mx-auto h-3 w-12" />
              <Skeleton className="mx-auto h-7 w-7 rounded-lg" />
            </li>
          ))}
        </ul>
      </div>

      <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 sm:px-6">
        <Skeleton className="h-3 w-52" />
      </footer>
    </section>
  )
}
