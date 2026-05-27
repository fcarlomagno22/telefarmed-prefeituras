import { Skeleton } from '../ui/Skeleton'

function ChartBlockSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
      <Skeleton className="h-3 w-36" />
      <div className="mt-3 flex items-center gap-4">
        <Skeleton className="size-[5.5rem] shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2.5">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton className="size-2.5 rounded-full" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function BarsBlockSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
      <Skeleton className="h-3 w-28" />
      <ul className="mt-3 space-y-2.5">
        {Array.from({ length: rows }).map((_, index) => (
          <li key={index}>
            <div className="mb-1 flex justify-between gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </li>
        ))}
      </ul>
    </section>
  )
}

function VerticalBarsBlockSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
      <Skeleton className="h-3 w-44" />
      <Skeleton className="mt-1 h-3 w-20" />
      <div className="mt-4 flex h-32 items-end justify-between gap-1.5">
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="flex min-w-0 flex-1 flex-col items-center">
            <Skeleton
              className={`w-full max-w-9 rounded-t-md sm:max-w-10 ${['h-16', 'h-20', 'h-24', 'h-14', 'h-12'][index] ?? 'h-14'}`}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

export function NetworkUsersAboutPanelSkeleton() {
  return (
    <aside
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
      aria-busy="true"
      aria-label="Carregando painel sobre os usuários"
    >
      <div className="shrink-0 bg-gradient-to-b from-sky-50/50 to-white px-4 pt-4">
        <Skeleton className="mx-auto h-32 w-full max-w-[240px] rounded-xl" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-6">
        <header className="shrink-0">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-4 w-56 max-w-full" />
        </header>

        <div className="mt-4 min-h-0 flex-1 space-y-4">
          <ChartBlockSkeleton rows={2} />
          <BarsBlockSkeleton rows={4} />
          <VerticalBarsBlockSkeleton columns={5} />
        </div>

        <Skeleton className="mt-3 h-3 w-full max-w-xs mx-auto" />
      </div>
    </aside>
  )
}
