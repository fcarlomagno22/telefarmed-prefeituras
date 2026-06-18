import { Skeleton } from '../../ui/Skeleton'

const ORIGIN_CARD_COUNT = 3

function OriginSliceCardSkeleton({ showUnread }: { showUnread?: boolean }) {
  return (
    <article className="flex w-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-b from-slate-50/90 to-white px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-4 min-w-0 flex-1 max-w-[8rem]" />
        <Skeleton className="h-6 w-[5.25rem] shrink-0 rounded-lg" />
      </div>
      <div className="flex flex-col items-center py-3">
        <Skeleton className="h-9 w-12" />
        <Skeleton className="mt-1 h-3 w-16" />
        {showUnread ? (
          <Skeleton className="mt-2 h-5 w-20 rounded-full" />
        ) : (
          <Skeleton className="mt-2 h-3 w-14" />
        )}
      </div>
    </article>
  )
}

export function PrefeituraNotificacoesSidebarPanelSkeleton() {
  return (
    <aside
      className="flex h-full min-h-0 w-full flex-col gap-3"
      aria-busy="true"
      aria-label="Carregando painel de notificações"
    >
      <section className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-1 h-3 w-44" />
        <Skeleton className="mt-3 h-10 w-full rounded-xl" />
      </section>

      <section className="relative aspect-square w-full shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary-light)]/40 via-white to-[var(--brand-primary-muted)]/50"
          aria-hidden
        />
        <Skeleton className="relative m-auto h-[70%] w-[70%] max-w-[200px] rounded-2xl" />
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <header className="shrink-0 border-b border-gray-100 px-4 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
          </div>
        </header>

        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain p-3">
          {Array.from({ length: ORIGIN_CARD_COUNT }).map((_, index) => (
            <li key={index} className="shrink-0">
              <OriginSliceCardSkeleton showUnread={index !== 2} />
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}
