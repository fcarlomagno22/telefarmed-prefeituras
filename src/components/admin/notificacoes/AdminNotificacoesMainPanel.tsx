import { Eye, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AdminBroadcast, AdminNotificationPriority } from '../../../data/adminNotificacoesMock'
import { CustomSelect } from '../../ui/CustomSelect'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import { dashboardMainPanelSurfaceClass } from '../../layout/dashboardPageLayout'
import { AdminNotificacoesDetailModal } from './AdminNotificacoesDetailModal'
import {
  buildAdminNotificationPriorityBadge,
  buildAdminTargetChannelBadge,
  formatAdminNotificationDateCompact,
  getBroadcastTargetKinds,
  type AdminBroadcastTargetFilter,
} from './adminNotificacoesUi'

const thClass = 'px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500'
const tdClass = 'px-2 py-3 text-center align-middle'

const TABLE_COLUMN_COUNT = 7

type PriorityFilter = 'all' | AdminNotificationPriority
type PeriodFilter = 'all' | '7d' | '30d' | '90d'

const targetOptions = [
  { value: 'all', label: 'Destino: Todos' },
  { value: 'prefeitura', label: 'Só prefeituras' },
  { value: 'ubt', label: 'Só UBTs' },
  { value: 'ambos', label: 'Prefeitura + UBT' },
]

const priorityOptions = [
  { value: 'all', label: 'Prioridade: Todas' },
  { value: 'normal', label: 'Normal' },
  { value: 'important', label: 'Importante' },
]

const periodOptions = [
  { value: 'all', label: 'Período: Todo histórico' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
]

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function isWithinPeriod(sentAt: string, period: PeriodFilter) {
  if (period === 'all') return true
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return new Date(sentAt).getTime() >= cutoff
}

type AdminNotificacoesMainPanelProps = {
  broadcasts: AdminBroadcast[]
}

export function AdminNotificacoesMainPanel({ broadcasts }: AdminNotificacoesMainPanelProps) {
  const [search, setSearch] = useState('')
  const [targetFilter, setTargetFilter] = useState<AdminBroadcastTargetFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailBroadcast, setDetailBroadcast] = useState<AdminBroadcast | null>(null)

  const filteredBroadcasts = useMemo(() => {
    const query = normalizeSearch(search.trim())

    return [...broadcasts]
      .filter((item) => {
        if (targetFilter !== 'all' && getBroadcastTargetKinds(item) !== targetFilter) return false
        if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false
        if (!isWithinPeriod(item.sentAt, periodFilter)) return false

        if (!query) return true
        const labels = item.targets.flatMap((t) => t.recipientLabels).join(' ')
        const haystack = normalizeSearch(
          `${item.title} ${item.body} ${item.sentBy} ${item.recipientSummary} ${labels}`,
        )
        return haystack.includes(query)
      })
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
  }, [broadcasts, search, targetFilter, priorityFilter, periodFilter])

  function openDetail(item: AdminBroadcast) {
    setDetailBroadcast(item)
    setDetailOpen(true)
  }

  function closeDetail() {
    setDetailOpen(false)
    setDetailBroadcast(null)
  }

  const displayedDetail = useMemo(() => {
    if (!detailBroadcast) return null
    return broadcasts.find((b) => b.id === detailBroadcast.id) ?? detailBroadcast
  }, [broadcasts, detailBroadcast])

  return (
    <>
      <section
        className={[
          dashboardMainPanelSurfaceClass,
          'flex min-h-0 flex-1 flex-col !shrink',
        ].join(' ')}
      >
        <header className="shrink-0 border-b border-gray-100 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">Histórico de envios</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {filteredBroadcasts.length} comunicado
              {filteredBroadcasts.length === 1 ? '' : 's'} exibido
              {filteredBroadcasts.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                strokeWidth={2}
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por título, destinatário ou remetente..."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-[var(--brand-primary)]/40 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
              />
            </div>
            <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2 lg:w-[min(100%,36rem)]">
              <CustomSelect
                value={targetFilter}
                onChange={(value) => setTargetFilter(value as AdminBroadcastTargetFilter)}
                options={targetOptions}
              />
              <CustomSelect
                value={priorityFilter}
                onChange={(value) => setPriorityFilter(value as PriorityFilter)}
                options={priorityOptions}
              />
              <CustomSelect
                value={periodFilter}
                onChange={(value) => setPeriodFilter(value as PeriodFilter)}
                options={periodOptions}
              />
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-white">
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col style={{ width: '24%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '4%' }} />
            </colgroup>
            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
              <tr>
                <th className={thClass}>Assunto</th>
                <th className={thClass}>Destinatários</th>
                <th className={thClass}>Canais</th>
                <th className={thClass}>Prioridade</th>
                <th className={thClass}>Enviado por</th>
                <th className={thClass}>Data</th>
                <th className={thClass}>Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredBroadcasts.length === 0 ? (
                <tr>
                  <td
                    colSpan={TABLE_COLUMN_COUNT}
                    className="px-5 py-16 text-center text-sm text-gray-500 sm:px-6"
                  >
                    Nenhum comunicado para os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredBroadcasts.map((item) => {
                  const targetKind = getBroadcastTargetKinds(item)

                  return (
                    <tr
                      key={item.id}
                      className="text-gray-800 transition hover:bg-slate-50/80"
                    >
                      <td className={tdClass}>
                        <button
                          type="button"
                          onClick={() => openDetail(item)}
                          className="mx-auto block w-full max-w-full truncate text-center"
                          title={item.title}
                        >
                          <span className="text-xs font-semibold leading-snug text-gray-800">
                            {item.title}
                          </span>
                        </button>
                      </td>
                      <td className={tdClass}>
                        <p
                          className="mx-auto max-w-full truncate text-[11px] font-medium text-gray-700"
                          title={item.recipientSummary}
                        >
                          {item.recipientSummary}
                        </p>
                        <p className="mt-0.5 text-[10px] tabular-nums text-gray-500">
                          {item.recipientCount} total
                        </p>
                      </td>
                      <td className={tdClass}>
                        <div className="flex flex-wrap justify-center gap-1">
                          {targetKind === 'ambos' ? (
                            <>
                              <SituationStatusBadge
                                config={buildAdminTargetChannelBadge('prefeitura')}
                                widthClass="w-[4.75rem]"
                              />
                              <SituationStatusBadge
                                config={buildAdminTargetChannelBadge('ubt')}
                                widthClass="w-[3.5rem]"
                              />
                            </>
                          ) : targetKind === 'prefeitura' ? (
                            <SituationStatusBadge
                              config={buildAdminTargetChannelBadge('prefeitura')}
                              widthClass="w-[5rem]"
                            />
                          ) : (
                            <SituationStatusBadge
                              config={buildAdminTargetChannelBadge('ubt')}
                              widthClass="w-[3.5rem]"
                            />
                          )}
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="flex justify-center">
                          <SituationStatusBadge
                            config={buildAdminNotificationPriorityBadge(item.priority)}
                            widthClass="w-[5.25rem]"
                          />
                        </div>
                      </td>
                      <td className={tdClass}>
                        <p
                          className="mx-auto max-w-full truncate text-[11px] font-medium text-gray-800"
                          title={item.sentBy}
                        >
                          {item.sentBy}
                        </p>
                      </td>
                      <td className={tdClass}>
                        <p className="text-[10px] font-medium tabular-nums text-gray-600">
                          {formatAdminNotificationDateCompact(item.sentAt)}
                        </p>
                      </td>
                      <td className={tdClass}>
                        <button
                          type="button"
                          onClick={() => openDetail(item)}
                          className="mx-auto inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary-light)] hover:text-[var(--brand-primary)]"
                          aria-label={`Ver comunicado: ${item.title}`}
                        >
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 sm:px-6">
          <p className="text-xs text-gray-500">
            {filteredBroadcasts.length === 0
              ? 'Nenhum envio na lista filtrada'
              : `${filteredBroadcasts.length} registro${filteredBroadcasts.length === 1 ? '' : 's'} no histórico`}
          </p>
        </footer>
      </section>

      <AdminNotificacoesDetailModal
        open={detailOpen}
        broadcast={displayedDetail}
        onClose={closeDetail}
      />
    </>
  )
}
