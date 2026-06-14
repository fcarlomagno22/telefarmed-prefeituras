import { Skeleton } from '../../../ui/Skeleton'
import { AdminNotificacoesChannelStatCardSkeleton } from './adminNotificacoesSkeletonUi'

export function AdminNotificacoesSidebarPanelSkeleton() {
  return (
    <aside
      className="flex h-full min-h-0 w-full flex-col gap-3"
      aria-busy="true"
      aria-label="Carregando painel de comunicados"
    >
      <section className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <h2 className="text-sm font-bold text-gray-900">Novo comunicado</h2>
        <Skeleton className="mt-0.5 h-3 w-full max-w-[15rem]" />
        <Skeleton className="mt-3 h-10 w-full rounded-xl" />
      </section>

      <section className="relative aspect-square w-full shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary-light)]/50 via-white to-orange-50/60"
          aria-hidden
        />
        <div className="relative flex h-full w-full items-center justify-center p-5">
          <Skeleton className="h-[70%] w-[70%] max-w-[200px] rounded-2xl" />
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <header className="shrink-0 border-b border-gray-100 px-4 py-3.5">
          <h2 className="text-sm font-bold text-gray-900">Envios por canal</h2>
          <Skeleton className="mt-0.5 h-3 w-40" />
        </header>
        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
          <AdminNotificacoesChannelStatCardSkeleton />
          <AdminNotificacoesChannelStatCardSkeleton />
          <AdminNotificacoesChannelStatCardSkeleton dualBadge />
        </ul>
      </section>
    </aside>
  )
}
