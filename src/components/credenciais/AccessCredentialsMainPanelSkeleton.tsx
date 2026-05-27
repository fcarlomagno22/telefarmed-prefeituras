import { Skeleton } from '../ui/Skeleton'

const TABLE_ROW_COUNT = 6

const HEADER_WIDTHS = ['w-16', 'w-14', 'w-20', 'w-12', 'w-10'] as const

export function AccessCredentialsMainPanelSkeleton() {
  return (
    <section
      className="flex h-full min-h-[28rem] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
      aria-busy="true"
      aria-label="Carregando lista de usuários"
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mb-0 border-b border-gray-100 px-5 py-3 sm:px-6">
          <div className="flex gap-3">
            {HEADER_WIDTHS.map((width) => (
              <Skeleton key={width} className={`h-3 shrink-0 ${width}`} />
            ))}
          </div>
        </div>

        <ul className="divide-y divide-gray-100">
          {Array.from({ length: TABLE_ROW_COUNT }).map((_, index) => (
            <li key={index} className="flex items-center gap-3 px-5 py-4 sm:px-6">
              <div className="flex min-w-0 flex-[1.2] items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40 max-w-full" />
                </div>
              </div>
              <Skeleton className="hidden h-4 w-20 shrink-0 sm:block sm:flex-[0.5]" />
              <Skeleton className="mx-auto h-6 w-24 shrink-0 rounded-lg" />
              <Skeleton className="mx-auto h-6 w-16 shrink-0 rounded-lg" />
              <Skeleton className="mx-auto h-8 w-8 shrink-0 rounded-lg" />
            </li>
          ))}
        </ul>
      </div>

      <footer className="shrink-0 border-t border-gray-200 px-5 py-4 sm:px-6">
        <Skeleton className="h-3 w-56" />
      </footer>
    </section>
  )
}
