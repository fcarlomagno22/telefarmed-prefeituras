import { Send } from 'lucide-react'
import { useMemo } from 'react'
import type { AdminBroadcast } from '../../../data/adminNotificacoesMock'
import { PrefeituraNotificacoesIllustration } from '../../prefeitura/notificacoes/PrefeituraNotificacoesIllustration'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import { buildAdminTargetChannelBadge } from './adminNotificacoesUi'

type AdminNotificacoesSidebarPanelProps = {
  broadcasts: AdminBroadcast[]
  onCompose: () => void
  canInsert?: boolean
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function AdminNotificacoesSidebarPanel({
  broadcasts,
  onCompose,
  canInsert = true,
}: AdminNotificacoesSidebarPanelProps) {
  const stats = useMemo(() => {
    let prefeitura = 0
    let ubt = 0
    let ambos = 0
    for (const item of broadcasts) {
      const channels = new Set(item.targets.map((t) => t.channel))
      if (channels.has('prefeitura') && channels.has('ubt')) ambos += 1
      else if (channels.has('prefeitura')) prefeitura += 1
      else if (channels.has('ubt')) ubt += 1
    }
    return { prefeitura, ubt, ambos, total: broadcasts.length }
  }, [broadcasts])

  return (
    <aside className="flex h-full min-h-0 w-full flex-col gap-3">
      <section className="shrink-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <h2 className="text-sm font-bold text-gray-900">Novo comunicado</h2>
        <p className="mt-0.5 text-xs leading-snug text-gray-500">
          Prefeituras, UBTs, profissionais ou combinações — você escolhe o destino.
        </p>
        {canInsert ? (
          <button
            type="button"
            onClick={onCompose}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
          >
            <Send className="h-4 w-4" strokeWidth={2.25} />
            Enviar notificação
          </button>
        ) : null}
      </section>

      <PrefeituraNotificacoesIllustration />

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <header className="shrink-0 border-b border-gray-100 px-4 py-3.5">
          <h2 className="text-sm font-bold text-gray-900">Envios por canal</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {formatNumber(stats.total)} comunicado{stats.total === 1 ? '' : 's'} no histórico
          </p>
        </header>
        <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
          {[
            { key: 'prefeitura' as const, label: 'Só prefeituras', count: stats.prefeitura },
            { key: 'ubt' as const, label: 'Só UBTs', count: stats.ubt },
            { key: 'prefeitura' as const, label: 'Prefeitura + UBT', count: stats.ambos, dual: true },
          ].map((row, index) => (
            <li key={`${row.label}-${index}`} className="rounded-xl border border-gray-100 bg-slate-50/80 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-gray-800">{row.label}</p>
                {row.dual ? (
                  <span className="flex gap-1">
                    <SituationStatusBadge
                      config={buildAdminTargetChannelBadge('prefeitura')}
                      widthClass="w-[4.5rem]"
                    />
                    <SituationStatusBadge
                      config={buildAdminTargetChannelBadge('ubt')}
                      widthClass="w-[3.5rem]"
                    />
                  </span>
                ) : (
                  <SituationStatusBadge
                    config={buildAdminTargetChannelBadge(row.key)}
                    widthClass="w-[5rem]"
                  />
                )}
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">{row.count}</p>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}
