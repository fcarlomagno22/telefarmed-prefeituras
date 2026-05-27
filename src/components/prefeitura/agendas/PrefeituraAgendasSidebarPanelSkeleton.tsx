import { Skeleton } from '../../ui/Skeleton'

const WEEKLY_SUMMARY_COUNT = 4

export function PrefeituraAgendasSidebarPanelSkeleton() {
  return (
    <aside
      className="flex shrink-0 flex-col gap-4"
      aria-busy="true"
      aria-label="Carregando painel lateral de agendas"
    >
      <section className="shrink-0 rounded-2xl border border-gray-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-1 h-3 w-52" />
        <ul className="mt-3 flex flex-col gap-2">
          {Array.from({ length: WEEKLY_SUMMARY_COUNT }).map((_, index) => (
            <li key={index}>
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5">
                <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="shrink-0 rounded-2xl border border-gray-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-1 h-3 w-44" />
        <div className="mt-3 flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full rounded-xl" />
          ))}
          <div className="mt-1 space-y-2 rounded-xl border border-gray-100 bg-slate-50/80 px-3 py-2.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="mx-auto mt-2 h-24 w-full max-w-[240px] rounded-2xl" />
        </div>
      </section>
    </aside>
  )
}
