import { AlertTriangle, Activity } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { AdminMonitorPageData } from '../../../lib/services/admin/monitor'
import { dashboardPageScrollAreaClass, dashboardPageScrollPaddingClass } from '../../layout/dashboardPageLayout'
import { KpiStatCards } from '../../ui/KpiStatCards'
import { CustomSelect } from '../../ui/CustomSelect'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import { DashCard, DashLiveBadge } from '../../prefeitura/prefeituraDashboardUi'
import { prefeituraSlaBadgeConfig } from '../../prefeitura/prefeituraDashboardUi'

const TABLE_ROWS_PER_PAGE = 25

type AdminMonitorMainPanelProps = {
  monitor: AdminMonitorPageData
  selectedEntidadeId: string
  regionKey: string
  timelinePeriod: string
  onEntidadeChange: (value: string) => void
  onRegionChange: (value: string) => void
  onTimelineChange: (value: string) => void
}

function statusDotClass(status: string) {
  if (status === 'Online') return 'bg-emerald-500'
  if (status === 'Manutenção') return 'bg-amber-500'
  return 'bg-gray-400'
}

export function AdminMonitorMainPanel({
  monitor,
  selectedEntidadeId,
  regionKey,
  timelinePeriod,
  onEntidadeChange,
  onRegionChange,
  onTimelineChange,
}: AdminMonitorMainPanelProps) {
  const [evolucaoPage, setEvolucaoPage] = useState(1)
  const [consultasPage, setConsultasPage] = useState(1)
  const [rankingTab, setRankingTab] = useState<'ubt' | 'municipio'>('ubt')

  const municipioOptions = monitor.filterOptions.municipios
  const regionOptions = monitor.filterOptions.regions
  const timelineOptions = monitor.filterOptions.timelinePeriod

  const evolucaoTotalPages = Math.max(1, Math.ceil(monitor.unitRows.length / TABLE_ROWS_PER_PAGE))
  const consultasTotalPages = Math.max(
    1,
    Math.ceil(monitor.consultasLive.length / TABLE_ROWS_PER_PAGE),
  )

  const paginatedEvolucaoRows = useMemo(() => {
    const start = (evolucaoPage - 1) * TABLE_ROWS_PER_PAGE
    return monitor.unitRows.slice(start, start + TABLE_ROWS_PER_PAGE)
  }, [monitor.unitRows, evolucaoPage])

  const paginatedConsultasRows = useMemo(() => {
    const start = (consultasPage - 1) * TABLE_ROWS_PER_PAGE
    return monitor.consultasLive.slice(start, start + TABLE_ROWS_PER_PAGE)
  }, [monitor.consultasLive, consultasPage])

  useEffect(() => {
    setEvolucaoPage(1)
    setConsultasPage(1)
    setRankingTab('ubt')
  }, [selectedEntidadeId, regionKey, timelinePeriod, monitor.filterKey])

  useEffect(() => {
    if (evolucaoPage > evolucaoTotalPages) setEvolucaoPage(evolucaoTotalPages)
  }, [evolucaoPage, evolucaoTotalPages])

  useEffect(() => {
    if (consultasPage > consultasTotalPages) setConsultasPage(consultasTotalPages)
  }, [consultasPage, consultasTotalPages])

  const selectedTimeline = useMemo(() => {
    const currentHour = new Date().getHours()
    const slot =
      currentHour < 6 ? '00:00' : currentHour < 12 ? '06:00' : currentHour < 18 ? '12:00' : '18:00'
    return (
      monitor.timeline.find((entry) => entry.hora === slot) ??
      monitor.timeline[monitor.timeline.length - 1] ?? {
        hora: '—',
        emCurso: 0,
        concluidas: 0,
        aguardando: 0,
      }
    )
  }, [monitor.timeline])

  const criticalAlerts = monitor.alerts.filter((a) => a.severity === 'critical').length

  return (
    <div className={dashboardPageScrollAreaClass}>
      <div className={[dashboardPageScrollPaddingClass, 'w-full space-y-4 pt-5 sm:pt-6'].join(' ')}>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
              Painel administrativo
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
              Monitor Operacional municipal
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Visão ao vivo das UBTs, filas, consultas e capacidade por prefeituras.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="w-64">
              <CustomSelect
                value={selectedEntidadeId}
                onChange={onEntidadeChange}
                options={municipioOptions}
                size="compact"
              />
            </div>
            <div className="flex items-center gap-2">
              {criticalAlerts > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {criticalAlerts} alerta{criticalAlerts === 1 ? '' : 's'} crítico
                  {criticalAlerts === 1 ? '' : 's'}
                </span>
              ) : null}
              <DashLiveBadge />
            </div>
          </div>
        </header>

        <KpiStatCards
          items={monitor.kpiCards}
          updateKey={monitor.filterKey}
          layout="grid-1x6"
          variant="centered"
          className="w-full"
        />

        <DashCard
          title="Alertas operacionais"
          subtitle="Filas críticas, UBTs offline e capacidade no recorte."
          bodyClassName="max-h-48 overflow-auto p-0"
        >
          {monitor.alerts.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500">
              Nenhum alerta ativo no recorte selecionado.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {monitor.alerts.map((alert) => (
                <li
                  key={alert.id}
                  className={[
                    'border-l-4 px-4 py-3',
                    alert.severity === 'critical' ? 'border-l-rose-500 bg-rose-50/40' : 'border-l-amber-400 bg-amber-50/30',
                  ].join(' ')}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      {alert.timeAgo}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-600">
                    {alert.municipality} · {alert.unit} · {alert.category}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{alert.description}</p>
                </li>
              ))}
            </ul>
          )}
        </DashCard>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(22rem,1fr)]">
          <div className="grid gap-4">
            <DashCard
              title="Evolução do Monitor Operacional"
              subtitle="Recorte por unidade e município."
              bodyClassName="flex min-h-0 flex-1 flex-col p-0"
              action={
                <div className="w-32">
                  <CustomSelect
                    value={regionKey}
                    onChange={onRegionChange}
                    size="compact"
                    options={regionOptions}
                  />
                </div>
              }
              className="h-[25.5rem]"
              fillHeight
            >
              <div className="min-h-0 flex-1 overflow-auto">
                {monitor.unitRows.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-sm text-gray-500">
                    <Activity className="h-8 w-8 text-gray-300" />
                    Nenhuma UBT no recorte selecionado.
                  </div>
                ) : (
                  <table className="w-full min-w-[980px] text-xs">
                    <thead className="sticky top-0 z-10 bg-white">
                      <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wide text-gray-500">
                        <th className="px-3 py-2 text-left">Prefeitura</th>
                        <th className="px-3 py-2 text-center">UBT</th>
                        <th className="px-3 py-2 text-center">Região</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-center">Em curso</th>
                        <th className="px-3 py-2 text-center">Fila</th>
                        <th className="px-3 py-2 text-center">Tempo médio</th>
                        <th className="px-3 py-2 text-center">Operador</th>
                        <th className="px-3 py-2 text-center">Terminal</th>
                        <th className="px-3 py-2 text-center">Ocupação</th>
                        <th className="px-3 py-2 text-center">SLA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedEvolucaoRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-semibold text-gray-900">{row.prefeitura}</td>
                          <td className="px-3 py-2 text-center text-gray-700">{row.ubt}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{row.regiao}</td>
                          <td className="px-3 py-2 text-center">
                            <span className="inline-flex items-center gap-1 text-gray-700">
                              <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(row.status)}`} />
                              {row.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center font-semibold">{row.emCurso}</td>
                          <td className="px-3 py-2 text-center">{row.fila}</td>
                          <td className="px-3 py-2 text-center">{row.tempoMedio}</td>
                          <td className="px-3 py-2 text-center">{row.operador}</td>
                          <td className="px-3 py-2 text-center">{row.terminal}</td>
                          <td className="px-3 py-2 text-center">
                            <div className="mx-auto h-2 w-16 rounded-full bg-gray-100">
                              <div
                                className="h-2 rounded-full bg-emerald-500"
                                style={{ width: `${Math.min(row.ocupacao, 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <SituationStatusBadge
                              config={prefeituraSlaBadgeConfig[row.sla]}
                              widthClass="w-[7.5rem]"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2 text-[11px] text-gray-500">
                <span>
                  Página {evolucaoPage} de {evolucaoTotalPages} · {monitor.unitRows.length} itens
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEvolucaoPage((page) => Math.max(1, page - 1))}
                    disabled={evolucaoPage === 1}
                    className="rounded-md border border-gray-200 px-2 py-1 text-gray-600 transition enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvolucaoPage((page) => Math.min(evolucaoTotalPages, page + 1))}
                    disabled={evolucaoPage === evolucaoTotalPages}
                    className="rounded-md border border-gray-200 px-2 py-1 text-gray-600 transition enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </DashCard>

            <DashCard
              title="Lista global de consultas"
              subtitle="Em andamento e aguardando médico."
              bodyClassName="flex min-h-0 flex-1 flex-col p-0"
              className="h-[16.5rem]"
              fillHeight
            >
              <div className="min-h-0 flex-1 overflow-auto">
                {monitor.consultasLive.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-6 text-sm text-gray-500">
                    Nenhuma consulta ao vivo no recorte.
                  </div>
                ) : (
                  <table className="w-full min-w-[860px] text-xs">
                    <thead className="sticky top-0 z-10 bg-white">
                      <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wide text-gray-500">
                        <th className="px-3 py-2 text-left">Prefeitura</th>
                        <th className="px-3 py-2 text-center">UBT</th>
                        <th className="px-3 py-2 text-center">Paciente</th>
                        <th className="px-3 py-2 text-center">Especialidade</th>
                        <th className="px-3 py-2 text-center">Médico</th>
                        <th className="px-3 py-2 text-center">Início</th>
                        <th className="px-3 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedConsultasRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-semibold text-gray-900">{row.prefeitura}</td>
                          <td className="px-3 py-2 text-center">{row.ubt}</td>
                          <td className="px-3 py-2 text-center">{row.paciente}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{row.especialidade}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{row.medico}</td>
                          <td className="px-3 py-2 text-center">{row.inicio}</td>
                          <td className="px-3 py-2 text-center">
                            <span className="inline-flex items-center justify-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2 text-[11px] text-gray-500">
                <span>
                  Página {consultasPage} de {consultasTotalPages} · {monitor.consultasLive.length} itens
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConsultasPage((page) => Math.max(1, page - 1))}
                    disabled={consultasPage === 1}
                    className="rounded-md border border-gray-200 px-2 py-1 text-gray-600 transition enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsultasPage((page) => Math.min(consultasTotalPages, page + 1))}
                    disabled={consultasPage === consultasTotalPages}
                    className="rounded-md border border-gray-200 px-2 py-1 text-gray-600 transition enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </DashCard>
          </div>

          <div className="grid gap-4">
            <DashCard
              title="Timeline agregada"
              subtitle="Em curso, concluídas e aguardando médico."
              className="h-[15rem]"
              fillHeight
              bodyClassName="flex min-h-0 flex-1 flex-col gap-3 p-4"
              action={
                <div className="w-32">
                  <CustomSelect
                    value={timelinePeriod}
                    onChange={onTimelineChange}
                    size="compact"
                    options={timelineOptions}
                  />
                </div>
              }
            >
              <div className="grid grid-cols-4 gap-2 text-[10px] text-gray-500">
                {monitor.timeline.map((entry) => (
                  <div
                    key={entry.hora}
                    className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5 text-center"
                  >
                    <p className="font-semibold text-gray-700">{entry.hora}</p>
                    <p>Em curso {entry.emCurso}</p>
                  </div>
                ))}
              </div>
              <div className="grid flex-1 grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2">
                  <p className="text-[10px] uppercase text-emerald-700">Em curso</p>
                  <p className="text-lg font-bold text-emerald-800">{selectedTimeline.emCurso}</p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-2">
                  <p className="text-[10px] uppercase text-blue-700">Concluídas</p>
                  <p className="text-lg font-bold text-blue-800">{selectedTimeline.concluidas}</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-2">
                  <p className="text-[10px] uppercase text-amber-700">Aguardando</p>
                  <p className="text-lg font-bold text-amber-800">{selectedTimeline.aguardando}</p>
                </div>
              </div>
            </DashCard>

            <DashCard
              title="Ranking operacional"
              subtitle="Performance no recorte."
              className="h-[11rem]"
              fillHeight
              bodyClassName="flex min-h-0 flex-1 flex-col p-0"
              action={
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setRankingTab('ubt')}
                    className={[
                      'rounded-md px-2 py-1 transition',
                      rankingTab === 'ubt' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500',
                    ].join(' ')}
                  >
                    UBT
                  </button>
                  <button
                    type="button"
                    onClick={() => setRankingTab('municipio')}
                    className={[
                      'rounded-md px-2 py-1 transition',
                      rankingTab === 'municipio' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500',
                    ].join(' ')}
                  >
                    Município
                  </button>
                </div>
              }
            >
              <div className="min-h-0 overflow-auto">
                {rankingTab === 'ubt' ? (
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-white text-[10px] uppercase tracking-wide text-gray-500">
                      <tr className="border-b border-gray-200">
                        <th className="px-3 py-2 text-left">UBT</th>
                        <th className="px-3 py-2 text-left">Município</th>
                        <th className="px-3 py-2 text-center">Hoje</th>
                        <th className="px-3 py-2 text-center">Ocupação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {monitor.rankingUbts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                            Sem unidades no ranking.
                          </td>
                        </tr>
                      ) : (
                        monitor.rankingUbts.map((row) => (
                          <tr key={row.id}>
                            <td className="px-3 py-1.5 font-semibold text-gray-900">{row.nome}</td>
                            <td className="px-3 py-1.5 text-gray-600">{row.municipio}</td>
                            <td className="px-3 py-1.5 text-center">{row.hoje}</td>
                            <td className="px-3 py-1.5 text-center">{row.ocupacao}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-white text-[10px] uppercase tracking-wide text-gray-500">
                      <tr className="border-b border-gray-200">
                        <th className="px-3 py-2 text-left">Município</th>
                        <th className="px-3 py-2 text-center">UF</th>
                        <th className="px-3 py-2 text-center">Hoje</th>
                        <th className="px-3 py-2 text-center">Fila</th>
                        <th className="px-3 py-2 text-center">Ocupação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {monitor.rankingMunicipios.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-center text-gray-500">
                            Sem municípios no ranking.
                          </td>
                        </tr>
                      ) : (
                        monitor.rankingMunicipios.map((row) => (
                          <tr key={row.id}>
                            <td className="px-3 py-1.5 font-semibold text-gray-900">{row.nome}</td>
                            <td className="px-3 py-1.5 text-center text-gray-600">{row.uf}</td>
                            <td className="px-3 py-1.5 text-center">{row.hoje}</td>
                            <td className="px-3 py-1.5 text-center">{row.fila}</td>
                            <td className="px-3 py-1.5 text-center">{row.ocupacao}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </DashCard>

            <DashCard
              title="Heatmap de ocupação"
              subtitle="Últimas 6h por macro-região."
              className="h-[10.5rem]"
              fillHeight
              bodyClassName="grid min-h-0 flex-1 grid-cols-[7rem_repeat(6,minmax(0,1fr))] gap-1 p-3"
            >
              {monitor.heatmap.length === 0 ? (
                <p className="col-span-full flex items-center justify-center text-xs text-gray-500">
                  Sem dados de ocupação no recorte.
                </p>
              ) : (
                monitor.heatmap.map((row) => (
                  <div key={row.regiao} className="contents">
                    <div className="flex items-center text-[10px] font-semibold text-gray-600">
                      {row.regiao}
                    </div>
                    {row.slots.map((slot, index) => (
                      <div
                        key={`${row.regiao}-${index}`}
                        className="flex items-center justify-center rounded-md text-[10px] font-semibold text-gray-700"
                        style={{
                          backgroundColor:
                            slot > 80
                              ? 'rgba(248,113,113,0.34)'
                              : slot > 65
                                ? 'rgba(251,191,36,0.35)'
                                : 'rgba(74,222,128,0.32)',
                        }}
                      >
                        {slot}%
                      </div>
                    ))}
                  </div>
                ))
              )}
            </DashCard>

            <DashCard
              title="Snapshot das filas"
              subtitle="Visão dos picos no momento."
              className="h-[8rem]"
              fillHeight
              bodyClassName="grid min-h-0 flex-1 grid-cols-2 gap-2 p-3"
            >
              <div className="flex h-full items-center justify-center rounded-xl border border-sky-100 bg-gradient-to-b from-white to-sky-50/70 p-2 shadow-[0_4px_14px_rgba(14,116,144,0.08)]">
                <div className="flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Fila média
                  </p>
                  <p className="mt-0.5 text-xl font-bold leading-none text-slate-900">
                    {monitor.queueSnapshot.filaMedia}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-sky-700">
                    {monitor.queueSnapshot.filaMediaTrend}
                  </p>
                </div>
              </div>
              <div className="flex h-full items-center justify-center rounded-xl border border-amber-100 bg-gradient-to-b from-white to-amber-50/70 p-2 shadow-[0_4px_14px_rgba(245,158,11,0.1)]">
                <div className="flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    No-show hoje
                  </p>
                  <p className="mt-0.5 text-xl font-bold leading-none text-slate-900">
                    {monitor.queueSnapshot.noShowHoje}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-amber-700">
                    {monitor.queueSnapshot.noShowTaxa}
                  </p>
                </div>
              </div>
            </DashCard>
          </div>
        </section>
      </div>
    </div>
  )
}
