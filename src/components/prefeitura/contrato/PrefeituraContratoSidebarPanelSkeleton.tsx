import { Skeleton } from '../../ui/Skeleton'

const DETAIL_ROW_COUNT = 5

export function PrefeituraContratoSidebarPanelSkeleton() {
  return (
    <aside
      className="flex h-full min-h-0 flex-1 flex-col gap-3"
      aria-busy="true"
      aria-label="Carregando resumo do contrato"
    >
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="mt-2 h-4 w-48" />

        <Skeleton className="mx-auto mt-4 h-36 w-36 rounded-full" />
        <Skeleton className="mx-auto mt-3 h-4 w-56 max-w-full" />
        <Skeleton className="mx-auto mt-2 h-3 w-64 max-w-full" />

        <div className="mt-4 rounded-xl border border-gray-100 bg-slate-50/80 px-3 py-1">
          {Array.from({ length: DETAIL_ROW_COUNT }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 border-b border-gray-100 py-2.5 last:border-0"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-5 w-44" />
        </div>
        <Skeleton className="mt-2 h-4 w-40" />

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="mt-2 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-[85%]" />
        <Skeleton className="mt-3 h-4 w-48" />
      </section>

      <section className="mt-auto shrink-0 rounded-xl border border-dashed border-gray-200 bg-gradient-to-br from-slate-50/90 to-white p-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="mt-2.5 h-9 w-full rounded-lg" />
        <Skeleton className="mx-auto mt-1.5 h-3 w-40" />
      </section>
    </aside>
  )
}
