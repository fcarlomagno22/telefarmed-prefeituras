import { Skeleton } from '../../ui/Skeleton'

export function ProfissionalAtendimentosChartsSidebarSkeleton() {
  return (
    <aside
      className="flex h-full min-h-0 w-full flex-col gap-4"
      aria-busy="true"
      aria-label="Carregando estatísticas de atendimentos"
    >
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-10 w-20" />
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-[88px] w-full rounded-xl" />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <Skeleton className="h-4 w-36" />
        <div className="mt-4 flex items-center justify-center">
          <Skeleton className="h-28 w-28 rounded-full" />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <Skeleton className="h-4 w-44" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-6 w-full rounded-lg" />
          <Skeleton className="h-6 w-[85%] rounded-lg" />
          <Skeleton className="h-6 w-[70%] rounded-lg" />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <Skeleton className="h-4 w-36" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-5 w-full rounded-md" />
          <Skeleton className="h-5 w-full rounded-md" />
          <Skeleton className="h-5 w-full rounded-md" />
        </div>
      </section>
    </aside>
  )
}
