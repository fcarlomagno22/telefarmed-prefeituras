import { Skeleton } from '../../../ui/Skeleton'

function LegalSidebarSkeleton() {
  return (
    <aside
      className="shrink-0 border-b border-gray-200 bg-gray-50/80 p-4 lg:w-72 xl:w-80 lg:border-b-0 lg:border-r"
      aria-hidden
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-14 rounded-lg" />
      </div>
      <ul className="space-y-0">
        {Array.from({ length: 5 }, (_, index) => (
          <li key={index}>
            {index > 0 ? <div className="mx-3 border-t border-gray-200" aria-hidden /> : null}
            <div className="space-y-1.5 px-3 py-3">
              <Skeleton className="h-3.5 w-[82%]" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}

function LegalFormFieldSkeleton({ className = '' }: { className?: string }) {
  return (
    <label className={`block ${className}`.trim()}>
      <Skeleton className="mb-1.5 h-3 w-24" />
      <Skeleton className="h-10 w-full rounded-xl" />
    </label>
  )
}

export function AdminConfigLegalPanelSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row" aria-hidden>
      <LegalSidebarSkeleton />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
        <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3.5 w-56 max-w-[50%]" />
            </div>
          </div>
          <div className="flex shrink-0 items-start justify-end gap-2">
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-8 w-36 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>

        <article className="flex min-h-0 flex-1 flex-col rounded-2xl border border-gray-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-4">
          <div className="shrink-0 grid gap-3.5 sm:grid-cols-2">
            <LegalFormFieldSkeleton className="sm:col-span-2" />
            <LegalFormFieldSkeleton />
            <LegalFormFieldSkeleton />
          </div>

          <div className="mt-3.5 shrink-0">
            <Skeleton className="mb-2 h-3 w-32" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-8 w-20 rounded-lg" />
              ))}
            </div>
          </div>

          <label className="mt-5 flex min-h-0 flex-1 flex-col">
            <Skeleton className="mb-1.5 h-3 w-36 shrink-0" />
            <Skeleton className="min-h-0 flex-1 rounded-xl" />
          </label>

          <div className="mt-3.5 flex shrink-0 justify-end border-t border-gray-100 pt-3.5">
            <Skeleton className="h-10 w-44 rounded-xl" />
          </div>
        </article>
      </div>
    </div>
  )
}
