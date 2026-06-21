import { History, Search } from 'lucide-react'
import { useCallback, useState } from 'react'
import { SituationStatusBadge } from '../../../ui/SituationStatusBadge'
import { Toast, type ToastVariant } from '../../../ui/Toast'
import {
  usePrefeituraFaturamentoHistoricoPage,
  type PrefeituraFaturamentoHistoricoItem,
} from '../../../../hooks/usePrefeituraFaturamentoFechamentoPage'
import {
  formatFechamentoDateTime,
  prefeituraFaturamentoFechamentoStatusBadgeConfig,
} from '../fechamento/prefeituraFaturamentoFechamentoUi'
import {
  PrefeituraFaturamentoHistoricoActionsMenu,
  type PrefeituraFaturamentoHistoricoMenuAction,
} from './PrefeituraFaturamentoHistoricoActionsMenu'

type PrefeituraFaturamentoHistoricoPanelProps = {
  onOpenFechamento: (competencia: string, recordId: string) => void
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function PrefeituraFaturamentoHistoricoPanel({
  onOpenFechamento,
}: PrefeituraFaturamentoHistoricoPanelProps) {
  const page = usePrefeituraFaturamentoHistoricoPage()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const handleMenuAction = useCallback(
    (item: PrefeituraFaturamentoHistoricoItem, action: PrefeituraFaturamentoHistoricoMenuAction) => {
      if (action === 'view_fechamento') {
        page.openInFechamento(item.record.competencia, item.record.id)
        onOpenFechamento(item.record.competencia, item.record.id)
        return
      }

      if (action === 'download_relatorio') {
        page.baixarRelatorio(item.record)
        showToast('Relatório de pendências BPA gerado para download.')
        return
      }

      if (action === 'export_bpa_txt') {
        page.exportarBpa(item.record)
        showToast('Arquivo BPA-I gerado para download.')
        return
      }
    },
    [onOpenFechamento, page, showToast],
  )

  const renderActionsMenu = useCallback(
    (item: PrefeituraFaturamentoHistoricoItem, align: 'left' | 'center' | 'right' = 'center') => (
      <PrefeituraFaturamentoHistoricoActionsMenu
        item={item}
        open={openMenuId === item.record.id}
        align={align}
        onToggle={() =>
          setOpenMenuId((current) => (current === item.record.id ? null : item.record.id))
        }
        onClose={() => setOpenMenuId(null)}
        onAction={(action) => handleMenuAction(item, action)}
      />
    ),
    [handleMenuAction, openMenuId],
  )

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-gray-200 bg-violet-50/60 px-5 py-4 sm:px-6">
          <p className="text-sm font-medium leading-relaxed text-violet-950">
            Consulte fechamentos consolidados da competência, exportações BPA e relatórios de
            auditoria.
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-6">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Histórico de fechamentos</h3>
              <p className="mt-1 text-xs text-gray-500">
                Competências já fechadas ou exportadas para o SUS/SIGTAP.
              </p>
            </div>
            <label className="relative min-w-0 sm:min-w-[16rem]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={page.search}
                onChange={(event) => page.setSearch(event.target.value)}
                placeholder="Buscar competência, ID ou responsável..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
              />
            </label>
          </div>

          {page.items.length === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-10 text-center">
              <History className="h-10 w-10 text-gray-400" />
              <p className="mt-4 text-sm font-semibold text-gray-900">
                Nenhum fechamento registrado
              </p>
              <p className="mt-1 max-w-md text-sm text-gray-600">
                Feche uma competência na aba Fechamento para que ela apareça aqui.
              </p>
            </div>
          ) : (
            <div className="hidden min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 lg:flex">
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-3 py-3">Competência</th>
                      <th className="px-3 py-3">Tipo</th>
                      <th className="px-3 py-3">Lote</th>
                      <th className="px-3 py-3 text-center">Consultas</th>
                      <th className="px-3 py-3 text-center">Status</th>
                      <th className="px-3 py-3">Fechado em</th>
                      <th className="px-3 py-3">Responsável</th>
                      <th className="px-3 py-3">ID</th>
                      <th className="px-3 py-3">Exportado em</th>
                      <th className="w-14 px-3 py-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {page.items.map((item) => (
                      <tr
                        key={item.record.id}
                        className="bg-white transition hover:bg-gray-50/80"
                      >
                        <td className="px-3 py-3">
                          <p className="font-semibold text-gray-900">{item.competenciaLabel}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{item.record.competencia}</p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-xs font-semibold text-gray-900">{item.tipoLabel}</p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-mono text-xs font-semibold text-gray-900">
                            {item.record.loteId ?? '—'}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-center font-semibold tabular-nums text-gray-900">
                          {formatNumber(item.consultasNoLote)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-center">
                            <SituationStatusBadge
                              config={
                                prefeituraFaturamentoFechamentoStatusBadgeConfig[item.record.status]
                              }
                              widthClass="w-[6.5rem]"
                            />
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-gray-700">
                          {formatFechamentoDateTime(item.record.closedAt)}
                        </td>
                        <td className="px-3 py-3 text-gray-700">
                          {item.record.closedBy ?? '—'}
                        </td>
                        <td className="px-3 py-3 tabular-nums text-gray-900">
                          {item.record.fechamentoId ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-gray-700">
                          {formatFechamentoDateTime(item.record.exportedAt)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-center">
                            {renderActionsMenu(item, 'center')}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto lg:hidden">
            {page.items.map((item) => (
              <article
                key={item.record.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.competenciaLabel}</p>
                    <p className="mt-1 text-xs font-semibold text-violet-700">{item.tipoLabel}</p>
                    <p className="mt-1 font-mono text-xs font-semibold text-gray-700">
                      {item.record.loteId ?? '—'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <SituationStatusBadge
                      config={
                        prefeituraFaturamentoFechamentoStatusBadgeConfig[item.record.status]
                      }
                      widthClass="w-[6.5rem]"
                    />
                    {renderActionsMenu(item, 'right')}
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-600">
                  {formatNumber(item.consultasNoLote)} consulta(s) no lote ·{' '}
                  {formatFechamentoDateTime(item.record.closedAt)}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {item.record.closedBy ?? '—'} · {item.record.fechamentoId ?? '—'}
                </p>
              </article>
            ))}
          </div>
        </div>

        {page.items.length > 0 ? (
          <footer className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-gray-600">
              {formatNumber(page.items.length)} fechamento(s) registrado(s)
            </p>
            <p className="text-xs text-gray-500">
              Use a aba Fechamento para consolidar novas competências.
            </p>
          </footer>
        ) : null}
      </div>

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant ?? 'success'}
        onClose={dismissToast}
      />
    </>
  )
}
