import { Skeleton } from '../../ui/Skeleton'

const UBT_GROUP_COUNT = 4

function UbtGroupRowSkeleton({ expanded = false }: { expanded?: boolean }) {
  return (
    <li className="border-b border-gray-100 last:border-b-0">
      <div className="flex w-full items-center gap-3 px-5 py-4 sm:px-6">
        <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        <Skeleton className="h-5 w-5 shrink-0 rounded" />
      </div>
      {expanded ? (
        <div className="border-t border-gray-100 bg-gray-50/40 px-3 pb-4 sm:px-4">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-3">
            <div className="mb-3 flex gap-2 border-b border-gray-100 pb-3">
              {['w-24', 'w-16', 'w-20', 'w-14', 'w-12'].map((width) => (
                <Skeleton key={width} className={`h-3 ${width}`} />
              ))}
            </div>
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 border-t border-gray-100 py-3 first:border-t-0"
              >
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="hidden h-4 w-20 sm:block" />
                <Skeleton className="h-6 w-24 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </li>
  )
}

export function PrefeituraAccessCredentialsMainPanelSkeleton() {
  return (
    <section
      className="flex h-full min-h-[28rem] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
      aria-busy="true"
      aria-label="Carregando credenciais por UBT"
    >
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
        <Skeleton className="h-10 min-h-10 flex-1 rounded-xl sm:max-w-md" />
        <Skeleton className="h-10 w-full rounded-xl sm:w-52" />
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-gray-100 overflow-hidden">
        {Array.from({ length: UBT_GROUP_COUNT }).map((_, index) => (
          <UbtGroupRowSkeleton key={index} expanded={index === 0} />
        ))}
      </ul>

      <footer className="shrink-0 border-t border-gray-200 px-5 py-4 sm:px-6">
        <Skeleton className="h-3 w-64" />
      </footer>
    </section>
  )
}
