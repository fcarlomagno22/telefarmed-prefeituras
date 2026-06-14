import { AlertTriangle, CheckCircle2, RefreshCw, Search, Stethoscope } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { EscalaRepasseModalidade } from '../../../types/adminEscala'
import type {
  AdminPlantaoElegibilidade,
  AdminRepasseProfissionalCompetenciaRow,
  RepasseCompetenciaAprovadaPayload,
  SubmitPlantaoDecisaoPayload,
} from '../../../types/adminProfissionalRepasse'
import type { AdminProfissionalRepassePermissions } from '../../../hooks/useAdminProfissionalRepassePage'
import { CustomSelect } from '../../ui/CustomSelect'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import { AdminProfissionalRepasseCompetenciaDrawer } from './AdminProfissionalRepasseCompetenciaDrawer'
import { AdminProfissionalRepasseTabSkeleton } from './skeletons/AdminProfissionalRepasseTabSkeleton'
import {
  ADMIN_REPASSE_ELEGIBILIDADE_BADGE_WIDTH,
  ADMIN_REPASSE_MODALIDADE_BADGE_WIDTH,
  ADMIN_REPASSE_STATUS_BADGE_WIDTH,
  adminRepasseElegibilidadeBadgeConfig,
  adminRepasseElegibilidadeLabel,
  adminRepasseModalidadeBadgeConfig,
  adminRepasseModalidadeFilterLabel,
  adminRepasseStatusBadgeConfig,
  formatAdminRepasseCurrency,
} from './adminProfissionalRepasseUi'
import type { KpiStatCardItem } from '../../ui/KpiStatCards'

export function buildAdminRepasseProfissionalKpis(
  rows: AdminRepasseProfissionalCompetenciaRow[],
): KpiStatCardItem[] {
  const pendenteConferencia = rows.filter((r) => r.status === 'pendente_conferencia').length
  const elegivel = rows.filter((r) => r.elegibilidadeAgregada === 'elegivel').length
  const parcial = rows.filter((r) => r.elegibilidadeAgregada === 'parcial').length
  const indeferido = rows.filter((r) => r.elegibilidadeAgregada === 'indeferido').length

  return [
    {
      label: 'Pendente conferência',
      value: String(pendenteConferencia),
      suffix: 'Competências aguardando análise',
      icon: Stethoscope,
      iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
      iconRing: 'ring-orange-100/80',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Elegível',
      value: String(elegivel),
      suffix: 'Repasse integral conforme regra',
      icon: CheckCircle2,
      iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
      iconRing: 'ring-emerald-100/80',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Parcial',
      value: String(parcial),
      suffix: 'Critérios parciais ou proporcional',
      icon: AlertTriangle,
      iconGradient: 'from-amber-500 via-yellow-500 to-orange-500',
      iconShadow: 'shadow-[0_8px_20px_rgba(245,158,11,0.35)]',
      iconRing: 'ring-amber-100/80',
      topBar: 'from-amber-400 to-orange-500',
    },
    {
      label: 'Indeferido',
      value: String(indeferido),
      suffix: 'Presença ou demanda crítica',
      icon: AlertTriangle,
      iconGradient: 'from-rose-500 via-red-500 to-red-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(239,68,68,0.35)]',
      iconRing: 'ring-red-100/80',
      topBar: 'from-rose-400 to-red-500',
    },
  ]
}

type AdminProfissionalRepasseTabPanelProps = {
  rows: AdminRepasseProfissionalCompetenciaRow[]
  permissions: AdminProfissionalRepassePermissions
  isLoading?: boolean
  isMutating?: boolean
  error?: string | null
  competenciaOptions?: string[]
  profissionalOptions?: string[]
  openCompetenciaId?: string | null
  onOpenCompetenciaConsumed?: () => void
  onReload?: () => void
  onApprove: (payload: RepasseCompetenciaAprovadaPayload) => Promise<boolean>
  onReject: (competenciaId: string, motivo: string) => Promise<boolean>
  onRequestCorrecao: (competenciaId: string, motivo: string) => Promise<boolean>
  onMarkPaid: (competenciaId: string) => Promise<boolean>
  onSubmitPlantaoDecisao: (
    payload: SubmitPlantaoDecisaoPayload,
  ) => Promise<AdminRepasseProfissionalCompetenciaRow | null>
}

export function AdminProfissionalRepasseTabPanel({
  rows,
  permissions,
  isLoading = false,
  isMutating = false,
  error = null,
  competenciaOptions = [],
  profissionalOptions = [],
  openCompetenciaId = null,
  onOpenCompetenciaConsumed,
  onReload,
  onApprove,
  onReject,
  onRequestCorrecao,
  onMarkPaid,
  onSubmitPlantaoDecisao,
}: AdminProfissionalRepasseTabPanelProps) {
  const [competenciaFilter, setCompetenciaFilter] = useState<string | 'all'>('all')
  const [profissionalFilter, setProfissionalFilter] = useState<string | 'all'>('all')
  const [modalidadeFilter, setModalidadeFilter] = useState<EscalaRepasseModalidade | 'all'>('all')
  const [elegibilidadeFilter, setElegibilidadeFilter] = useState<AdminPlantaoElegibilidade | 'all'>(
    'all',
  )
  const [alertaFilter, setAlertaFilter] = useState<'all' | 'sim' | 'nao'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [isDrawerClosing, setIsDrawerClosing] = useState(false)

  useEffect(() => {
    if (!openCompetenciaId) return
    const exists = rows.some((row) => row.id === openCompetenciaId)
    if (!exists) {
      onOpenCompetenciaConsumed?.()
      return
    }
    setSelectedRowId(openCompetenciaId)
    setIsDrawerClosing(false)
    onOpenCompetenciaConsumed?.()
  }, [openCompetenciaId, onOpenCompetenciaConsumed, rows])

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return rows.filter((row) => {
      if (competenciaFilter !== 'all' && row.competencia !== competenciaFilter) return false
      if (profissionalFilter !== 'all' && row.profissionalNome !== profissionalFilter) return false
      if (modalidadeFilter !== 'all' && row.regraPredominante !== modalidadeFilter) return false
      if (elegibilidadeFilter !== 'all' && row.elegibilidadeAgregada !== elegibilidadeFilter) {
        return false
      }
      if (alertaFilter === 'sim' && !row.temAlerta) return false
      if (alertaFilter === 'nao' && row.temAlerta) return false
      if (!q) return true
      return (
        row.profissionalNome.toLowerCase().includes(q) ||
        row.pjRazaoSocial.toLowerCase().includes(q) ||
        row.pjCnpj.includes(q) ||
        row.competencia.includes(q)
      )
    })
  }, [
    alertaFilter,
    competenciaFilter,
    elegibilidadeFilter,
    modalidadeFilter,
    profissionalFilter,
    rows,
    searchQuery,
  ])

  const selectedRow = rows.find((row) => row.id === selectedRowId) ?? null

  const competenciaFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'Todas as competências' },
      ...competenciaOptions.map((c) => ({ value: c, label: c })),
    ],
    [competenciaOptions],
  )

  const profissionalFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'Todos os profissionais' },
      ...profissionalOptions.map((nome) => ({ value: nome, label: nome })),
    ],
    [profissionalOptions],
  )

  const modalidadeOptions = useMemo(
    () => [
      { value: 'all', label: 'Todas as modalidades' },
      { value: 'plantao_fixo', label: adminRepasseModalidadeFilterLabel('plantao_fixo') },
      { value: 'por_consulta', label: adminRepasseModalidadeFilterLabel('por_consulta') },
      { value: 'hibrido', label: adminRepasseModalidadeFilterLabel('hibrido') },
    ],
    [],
  )

  const elegibilidadeOptions = useMemo(
    () => [
      { value: 'all', label: 'Todas elegibilidades' },
      ...(Object.keys(adminRepasseElegibilidadeLabel) as AdminPlantaoElegibilidade[]).map(
        (key) => ({
          value: key,
          label: adminRepasseElegibilidadeLabel[key],
        }),
      ),
    ],
    [],
  )

  const alertaOptions = useMemo(
    () => [
      { value: 'all', label: 'Com ou sem alerta' },
      { value: 'sim', label: 'Somente com alerta' },
      { value: 'nao', label: 'Sem alerta' },
    ],
    [],
  )

  const hasActiveFilters =
    competenciaFilter !== 'all' ||
    profissionalFilter !== 'all' ||
    modalidadeFilter !== 'all' ||
    elegibilidadeFilter !== 'all' ||
    alertaFilter !== 'all' ||
    searchQuery.trim().length > 0

  function limparFiltros() {
    setCompetenciaFilter('all')
    setProfissionalFilter('all')
    setModalidadeFilter('all')
    setElegibilidadeFilter('all')
    setAlertaFilter('all')
    setSearchQuery('')
  }

  function handleOpenDrawer(rowId: string) {
    if (!permissions.canView) return
    setSelectedRowId(rowId)
    setIsDrawerClosing(false)
  }

  function handleCloseDrawer() {
    if (!selectedRowId) return
    setIsDrawerClosing(true)
  }

  function handleDrawerTransitionEnd() {
    setIsDrawerClosing(false)
    setSelectedRowId(null)
  }

  if (isLoading) {
    return <AdminProfissionalRepasseTabSkeleton />
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col" data-testid="admin-repasse-profissionais-tab">
        {error ? (
          <div className="mx-4 mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p>{error}</p>
            {onReload ? (
              <button
                type="button"
                onClick={() => void onReload()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                Tentar novamente
              </button>
            ) : null}
          </div>
        ) : null}

        {!permissions.canView ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <p className="text-sm font-semibold text-gray-700">Sem permissão para visualizar repasses</p>
            <p className="max-w-sm text-xs text-gray-500">
              Solicite acesso de visualização ao módulo financeiro ao administrador.
            </p>
          </div>
        ) : (
          <>
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Repasse de profissionais</h2>
            <p className="text-xs text-gray-500">
              Conferência mensal por competência com base nas regras definidas na escala.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
            <CheckCircle2 className="h-4 w-4" />
            {filteredRows.length} fechamento{filteredRows.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              strokeWidth={2}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar profissional, PJ ou CNPJ"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)]/40 focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/15"
              data-testid="admin-repasse-search"
            />
          </label>

          <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-5">
            <CustomSelect
              value={competenciaFilter}
              onChange={setCompetenciaFilter}
              options={competenciaFilterOptions}
              size="compact"
              className="w-full"
              menuMinWidthPx={200}
            />
            <CustomSelect
              value={profissionalFilter}
              onChange={setProfissionalFilter}
              options={profissionalFilterOptions}
              size="compact"
              className="w-full"
              menuMinWidthPx={240}
            />
            <CustomSelect
              value={modalidadeFilter}
              onChange={(value) => setModalidadeFilter(value as EscalaRepasseModalidade | 'all')}
              options={modalidadeOptions}
              size="compact"
              className="w-full"
              menuMinWidthPx={200}
            />
            <CustomSelect
              value={elegibilidadeFilter}
              onChange={(value) =>
                setElegibilidadeFilter(value as AdminPlantaoElegibilidade | 'all')
              }
              options={elegibilidadeOptions}
              size="compact"
              className="w-full"
              menuMinWidthPx={200}
            />
            <CustomSelect
              value={alertaFilter}
              onChange={(value) => setAlertaFilter(value as 'all' | 'sim' | 'nao')}
              options={alertaOptions}
              size="compact"
              className="w-full"
              menuMinWidthPx={200}
            />
          </div>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={limparFiltros}
              className="self-start rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 lg:self-center"
            >
              Limpar filtros
            </button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="min-w-full text-left text-sm" data-testid="admin-repasse-table">
            <thead className="sticky top-0 z-10 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Profissional</th>
                <th className="px-4 py-3">PJ</th>
                <th className="px-4 py-3 text-center">Competência</th>
                <th className="px-4 py-3 text-center">Plantões</th>
                <th className="px-4 py-3 text-center">Regra</th>
                <th className="px-4 py-3 text-center">Atendidos</th>
                <th className="px-4 py-3 text-right">Valor calculado</th>
                <th className="px-4 py-3 text-right">Valor NF</th>
                <th className="px-4 py-3 text-center">Elegibilidade</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <Stethoscope className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
                    <p className="mt-3 text-sm font-semibold text-gray-700">
                      Nenhuma competência de repasse disponível
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Os fechamentos aparecerão após plantões executados com regra de repasse na escala.
                    </p>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-500">
                    Nenhum repasse encontrado para os filtros selecionados.
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={limparFiltros}
                        className="mt-2 block w-full text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                      >
                        Limpar filtros
                      </button>
                    ) : null}
                  </td>
                </tr>
              ) : null}

              {filteredRows.map((row) => (
                <tr
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenDrawer(row.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleOpenDrawer(row.id)
                    }
                  }}
                  className="cursor-pointer border-t border-gray-100 transition hover:bg-orange-50/40 focus-visible:bg-orange-50/60 focus-visible:outline-none"
                  data-testid={`admin-repasse-row-${row.id}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{row.profissionalNome}</p>
                      {row.temAlerta ? (
                        <AlertTriangle
                          className="h-3.5 w-3.5 shrink-0 text-amber-600"
                          aria-label="Com alertas"
                        />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{row.pjRazaoSocial}</p>
                    <p className="text-[11px] text-gray-500">{row.pjCnpj}</p>
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-gray-700">
                    {row.competencia}
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-gray-700">
                    {row.qtdPlantoes}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <SituationStatusBadge
                        config={adminRepasseModalidadeBadgeConfig[row.regraPredominante]}
                        widthClass={ADMIN_REPASSE_MODALIDADE_BADGE_WIDTH}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-gray-700">
                    {row.totalAtendidos}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-900">
                    {formatAdminRepasseCurrency(row.valorCalculadoCentavos)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                    {row.valorNFCentavos != null
                      ? formatAdminRepasseCurrency(row.valorNFCentavos)
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <SituationStatusBadge
                        config={adminRepasseElegibilidadeBadgeConfig[row.elegibilidadeAgregada]}
                        widthClass={ADMIN_REPASSE_ELEGIBILIDADE_BADGE_WIDTH}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <SituationStatusBadge
                        config={adminRepasseStatusBadgeConfig[row.status]}
                        widthClass={ADMIN_REPASSE_STATUS_BADGE_WIDTH}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          </>
        )}
      </div>

      <AdminProfissionalRepasseCompetenciaDrawer
        open={selectedRowId !== null && !isDrawerClosing}
        closing={isDrawerClosing}
        row={selectedRow}
        permissions={permissions}
        isMutating={isMutating}
        onClose={handleCloseDrawer}
        onTransitionEnd={handleDrawerTransitionEnd}
        onApprove={onApprove}
        onReject={onReject}
        onRequestCorrecao={onRequestCorrecao}
        onMarkPaid={onMarkPaid}
        onSubmitPlantaoDecisao={onSubmitPlantaoDecisao}
      />
    </>
  )
}
