import { Send } from 'lucide-react'
import { useMemo } from 'react'
import type { PrefeituraNotification } from '../../../data/prefeituraNotificacoesMock'
import { useUbtPageAccess } from '../../../hooks/useUbtPageAccess'
import { computeUbtNotificacoesOriginSlices } from '../../../utils/notificacoes/ubtNotificacoesOriginSlices'
import { PrefeituraNotificacoesIllustration } from '../../prefeitura/notificacoes/PrefeituraNotificacoesIllustration'
import { buildPrefeituraNotificationOriginBadge } from '../../prefeitura/notificacoes/prefeituraNotificacoesUi'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'

type UbtNotificacoesSidebarPanelProps = {
  notifications: PrefeituraNotification[]
  onCompose: () => void
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function UbtNotificacoesSidebarPanel({
  notifications,
  onCompose,
}: UbtNotificacoesSidebarPanelProps) {
  const { pageAccess } = useUbtPageAccess('notificacoes')
  const originSlices = useMemo(
    () => computeUbtNotificacoesOriginSlices(notifications),
    [notifications],
  )
  const totalUnread = originSlices.reduce((sum, slice) => sum + slice.unread, 0)
  const totalMessages = useMemo(
    () => originSlices.reduce((sum, slice) => sum + slice.count, 0),
    [originSlices],
  )

  return (
    <aside className="flex h-full min-h-0 w-full flex-col gap-3">
      {pageAccess.canInsert ? (
        <section className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
          <h2 className="text-sm font-bold text-gray-900">Enviar para profissionais</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Comunique profissionais vinculados a esta unidade
          </p>
          <button
            type="button"
            onClick={onCompose}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 active:brightness-95"
          >
            <Send className="h-4 w-4" strokeWidth={2.25} />
            Nova notificação
          </button>
          <p className="mt-2 text-[10px] leading-snug text-gray-500">
            Mensagens da Telefarmed são somente leitura. Para a operadora, use Suporte técnico.
          </p>
        </section>
      ) : null}

      <PrefeituraNotificacoesIllustration />

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <header className="shrink-0 border-b border-gray-100 px-4 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900">Por origem</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                {formatNumber(totalMessages)} mensagens no período
              </p>
            </div>
            {totalUnread > 0 ? (
              <span className="shrink-0 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {totalUnread} não lidas
              </span>
            ) : null}
          </div>
        </header>

        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain p-3">
          {originSlices.map((slice) => {
            const badge = buildPrefeituraNotificationOriginBadge(slice.key)

            return (
              <li key={slice.key} className="shrink-0">
                <article className="flex w-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-b from-slate-50/90 to-white px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-bold leading-tight text-gray-900">
                      {slice.label}
                    </p>
                    <SituationStatusBadge
                      config={badge}
                      widthClass="w-[5.25rem] shrink-0"
                    />
                  </div>

                  <div className="flex flex-col items-center py-3">
                    <span className="text-3xl font-bold tabular-nums tracking-tight text-gray-900">
                      {formatNumber(slice.count)}
                    </span>
                    <span className="mt-0.5 text-[11px] font-medium text-gray-500">
                      mensagem{slice.count === 1 ? '' : 's'}
                    </span>
                    {slice.unread > 0 ? (
                      <span className="mt-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                        {slice.unread} não lida{slice.unread === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="mt-2 text-[10px] font-medium text-gray-400">Todas lidas</span>
                    )}
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      </section>
    </aside>
  )
}
