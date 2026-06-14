import { CalendarDays, Eye, Filter, Loader2, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  type ConsultationRecord,
  type ConsultationStatus,
} from '../../data/consultasMock'
import { useUbtAuth } from '../../contexts/UbtAuthContext'
import type { useNetworkUserDrawer } from '../../hooks/useNetworkUserDrawer'
import {
  fetchUbtConsultasList,
  isUbtConsultasApiError,
  type UbtConsultasOverviewApi,
} from '../../lib/services/ubt/consultas'
import {
  defaultConsultasFilters,
  countActiveConsultasFilters,
  type ConsultasFilters,
} from '../../utils/consultasFilters'
import {
  consultasStaticFilterOptions,
  withAllOption,
} from '../../utils/consultasFilterConstants'
import { getDefaultConsultasPeriod } from '../../utils/consultasPeriod'
import { findNetworkUserForConsultation } from '../../utils/consultasPatientUser'
import { consultaDateTimeCaption } from '../../utils/consultasDateTimeLabel'
import {
  exportConsultasExcel,
  exportConsultasPdf,
  type ConsultasExportContext,
} from '../../utils/consultas/consultasExport'
import { maskCpfForDisplay } from '../../utils/lgpdDisplay'
import { getLoggedOperatorName } from '../../utils/sessionUser'
import { ConsultasExportMenu, type ConsultasExportFormat } from './ConsultasExportMenu'
import {
  CONSULTAS_FILTERS_TRIGGER_ID,
  ConsultasFiltersMegamenu,
} from './ConsultasFiltersMegamenu'
import { Toast, type ToastVariant } from '../ui/Toast'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

const STATUS_BADGE_WIDTH = 'w-[9rem]'

const statusConfig: Record<
  ConsultationStatus,
  { label: string; text: string; accent: string; lineGlow: string }
> = {
  concluida: {
    label: 'Concluída',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  em_andamento: {
    label: 'Em andamento',
    text: 'text-sky-700',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(59,130,246,0.55)]',
  },
  cancelada: {
    label: 'Cancelada',
    text: 'text-red-600',
    accent: 'bg-gradient-to-r from-rose-400 via-red-500 to-red-600',
    lineGlow: 'shadow-[0_2px_10px_rgba(239,68,68,0.5)]',
  },
}

export type ConsultasNetworkUserDrawer = Pick<
  ReturnType<typeof useNetworkUserDrawer>,
  | 'sensitiveDataUnlocked'
  | 'lockSensitiveData'
  | 'openUnlockModal'
  | 'openUser'
  | 'openUserWithPacienteDetail'
  | 'drawerLayer'
>

type ConsultasMainPanelProps = {
  networkUserDrawer: ConsultasNetworkUserDrawer
  filterOptions?: UbtConsultasOverviewApi['filterOptions']
  onAppliedPeriodChange?: (periodStart: string, periodEnd: string) => void
}

function StatusBadge({ status }: { status: ConsultationStatus }) {
  const config = statusConfig[status]
  return (
    <span
      className={[
        'relative inline-flex h-8 items-center justify-center overflow-hidden rounded-lg bg-transparent px-2 pb-2 text-xs font-semibold',
        STATUS_BADGE_WIDTH,
        config.text,
      ].join(' ')}
    >
      {config.label}
      <span
        className={`absolute inset-x-0 bottom-0 h-[3px] ${config.accent} ${config.lineGlow}`}
        aria-hidden
      />
    </span>
  )
}

function GenderAgeCell({ record }: { record: ConsultationRecord }) {
  const dotColor = record.gender === 'F' ? 'bg-pink-500' : 'bg-blue-500'
  const genderLabel = record.gender === 'F' ? 'Feminino' : 'Masculino'
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} aria-hidden />
      <span>
        {record.age} anos · {genderLabel}
      </span>
    </div>
  )
}

export function ConsultasMainPanel({
  networkUserDrawer,
  filterOptions,
  onAppliedPeriodChange,
}: ConsultasMainPanelProps) {
  const { getAccessToken, isAuthenticated, user } = useUbtAuth()
  const defaultPeriod = getDefaultConsultasPeriod()
  const {
    sensitiveDataUnlocked,
    lockSensitiveData,
    openUnlockModal,
    openUser,
    openUserWithPacienteDetail,
    drawerLayer,
  } = networkUserDrawer

  const [draftFilters, setDraftFilters] = useState<ConsultasFilters>({
    ...defaultConsultasFilters,
    periodStart: defaultPeriod.start,
    periodEnd: defaultPeriod.end,
  })
  const [appliedFilters, setAppliedFilters] = useState<ConsultasFilters>({
    ...defaultConsultasFilters,
    periodStart: defaultPeriod.start,
    periodEnd: defaultPeriod.end,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [records, setRecords] = useState<ConsultationRecord[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [debouncedPatientSearch, setDebouncedPatientSearch] = useState('')

  const pageSize = pagination.pageSize

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedPatientSearch(patientSearch)
      setCurrentPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [patientSearch])

  const loadRecords = useCallback(async () => {
    const token = getAccessToken()
    if (!token || !isAuthenticated) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError(null)
    try {
      const result = await fetchUbtConsultasList(
        token,
        { ...appliedFilters, generalSearch: debouncedPatientSearch },
        currentPage,
        pageSize,
      )
      setRecords(result.records)
      setPagination(result.pagination)
    } catch (error) {
      const message = isUbtConsultasApiError(error)
        ? error.message
        : 'Não foi possível carregar as consultas.'
      setLoadError(message)
    } finally {
      setIsLoading(false)
    }
  }, [
    appliedFilters,
    currentPage,
    debouncedPatientSearch,
    getAccessToken,
    isAuthenticated,
    pageSize,
  ])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const paginatedRecords = records
  const totalFiltered = pagination.total
  const totalPages = pagination.totalPages
  const safePage = pagination.page
  const showingFrom = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize + 1
  const showingTo = Math.min(safePage * pageSize, totalFiltered)
  const catalogTotal = pagination.total

  const mergedFilterOptions = useMemo(
    () => ({
      specialties: withAllOption(filterOptions?.specialties ?? [], 'Todas'),
      doctors: withAllOption(filterOptions?.doctors ?? [], 'Todos'),
      neighborhoods: withAllOption(filterOptions?.neighborhoods ?? [], 'Todos'),
      genders: consultasStaticFilterOptions.genders,
      ageRanges: consultasStaticFilterOptions.ageRanges,
      statuses: consultasStaticFilterOptions.statuses,
    }),
    [filterOptions],
  )

  const unitLabel = user?.unidadeUbtNome ?? 'Unidade UBT'

  const activeFilterCount = useMemo(
    () => countActiveConsultasFilters(appliedFilters),
    [appliedFilters],
  )

  function applyFilters() {
    setAppliedFilters({ ...draftFilters })
    setCurrentPage(1)
    onAppliedPeriodChange?.(draftFilters.periodStart, draftFilters.periodEnd)
  }

  function displayCpf(cpf: string) {
    return sensitiveDataUnlocked ? cpf : maskCpfForDisplay(cpf)
  }

  function clearFilters() {
    const cleared: ConsultasFilters = {
      ...defaultConsultasFilters,
      periodStart: defaultPeriod.start,
      periodEnd: defaultPeriod.end,
    }
    setDraftFilters(cleared)
    setAppliedFilters(cleared)
    setCurrentPage(1)
    onAppliedPeriodChange?.(cleared.periodStart, cleared.periodEnd)
  }

  useEffect(() => {
    if (!filtersOpen) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      const trigger = document.getElementById(CONSULTAS_FILTERS_TRIGGER_ID)
      const panel = document.getElementById('consultas-filters-megamenu')
      if (trigger?.contains(target) || panel?.contains(target)) return
      setFiltersOpen(false)
      setDraftFilters(appliedFilters)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [appliedFilters, filtersOpen])

  function buildExportContext(): ConsultasExportContext {
    return {
      records: paginatedRecords,
      filters: appliedFilters,
      generalSearch: debouncedPatientSearch,
      sensitiveDataUnlocked,
      unitLabel: user?.unidadeUbtNome ?? 'Unidade UBT',
      operatorName: getLoggedOperatorName(),
    }
  }

  async function handleExport(format: ConsultasExportFormat) {
    if (totalFiltered === 0) {
      showToast('Nenhuma consulta encontrada para exportar.', 'error')
      return
    }

    showToast('Exportação iniciada', 'warning')

    try {
      const context = buildExportContext()
      if (format === 'pdf') {
        await exportConsultasPdf(context)
      } else {
        exportConsultasExcel(context)
      }
      showToast('Relatório gerado', 'success')
    } catch {
      showToast('Não foi possível gerar o relatório. Tente novamente.', 'error')
    }
  }

  return (
    <>
      <div className="flex h-full min-h-0 min-w-0 flex-col">
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
          <header className="relative z-[1] flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
                <CalendarDays className="h-4 w-4" strokeWidth={2} />
              </span>
              <h2 className="text-base font-bold text-gray-900">Histórico de consultas</h2>
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3 sm:flex-none">
              <label className="relative block w-full min-w-[12rem] max-w-xs sm:w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={patientSearch}
                  onChange={(event) => setPatientSearch(event.target.value)}
                  placeholder="Nome ou CPF do paciente"
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                />
              </label>
              <button
                id={CONSULTAS_FILTERS_TRIGGER_ID}
                type="button"
                aria-expanded={filtersOpen}
                aria-controls="consultas-filters-megamenu"
                onClick={() => setFiltersOpen((open) => !open)}
                className={[
                  'inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-4 text-sm font-semibold transition',
                  filtersOpen || activeFilterCount > 0
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                    : 'border-[var(--brand-primary)] bg-white text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]',
                ].join(' ')}
              >
                <Filter className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                Aplicar filtros
                {activeFilterCount > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-primary)] px-1.5 text-[10px] font-bold text-white tabular-nums">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
              <ConsultasExportMenu resultCount={totalFiltered} onSelect={handleExport} />
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-gray-800">{formatNumber(totalFiltered)}</span>{' '}
                consulta{totalFiltered === 1 ? '' : 's'} encontrada
                {totalFiltered !== catalogTotal ? (
                  <span className="text-gray-400"> (de {formatNumber(catalogTotal)} no período)</span>
                ) : null}
              </span>
            </div>
          </header>

          {filtersOpen ? (
            <ConsultasFiltersMegamenu
              open={filtersOpen}
              filters={draftFilters}
              unitLabel={unitLabel}
              filterOptions={mergedFilterOptions}
              onChange={setDraftFilters}
              onApply={() => {
                applyFilters()
                setFiltersOpen(false)
              }}
              onCancel={() => {
                setDraftFilters(appliedFilters)
                setFiltersOpen(false)
              }}
              onClear={() => {
                clearFilters()
                setFiltersOpen(false)
              }}
            />
          ) : null}

          <div className="flex shrink-0 items-center justify-end gap-3 border-b border-gray-200 bg-gray-50/60 px-5 py-2 sm:px-6">
            {!sensitiveDataUnlocked ? (
              <>
                <span className="mr-auto text-xs text-gray-500">
                  CPF mascarado conforme a LGPD.
                </span>
                <button
                  type="button"
                  onClick={openUnlockModal}
                  className="text-sm font-semibold text-[var(--brand-primary)] underline-offset-2 hover:underline"
                >
                  Ver dados
                </button>
              </>
            ) : (
              <>
                <span className="mr-auto text-xs font-medium text-emerald-600">
                  Dados pessoais visíveis
                </span>
                <button
                  type="button"
                  onClick={() => lockSensitiveData()}
                  className="text-sm font-semibold text-gray-600 underline-offset-2 transition hover:text-gray-900 hover:underline"
                >
                  Ocultar dados
                </button>
              </>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 text-center sm:px-5">Data e hora</th>
                  <th className="px-3 py-3 text-center">Paciente</th>
                  <th className="px-3 py-3 text-center">Idade / sexo</th>
                  <th className="px-3 py-3 text-center">Especialidade</th>
                  <th className="px-3 py-3 text-center">Médico</th>
                  <th className="px-3 py-3 text-center">Bairro</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-center">Duração</th>
                  <th className="px-3 py-3 text-center sm:px-5">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-sm text-gray-500 sm:px-6">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando consultas…
                      </span>
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-sm text-red-600 sm:px-6">
                      {loadError}
                    </td>
                  </tr>
                ) : paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-sm text-gray-500 sm:px-6">
                      {debouncedPatientSearch.trim() ||
                      appliedFilters.specialty ||
                      appliedFilters.doctor ||
                      appliedFilters.neighborhood ||
                      appliedFilters.gender ||
                      appliedFilters.ageRange ||
                      appliedFilters.status
                        ? 'Nenhuma consulta encontrada com os filtros e a busca atuais.'
                        : 'Nenhuma consulta encontrada.'}
                    </td>
                  </tr>
                ) : null}
                {paginatedRecords.map((record) => (
                  <tr key={record.id} className="text-sm text-gray-700 hover:bg-gray-50/80">
                    <td className="px-4 py-3.5 text-center align-middle sm:px-5">
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        {consultaDateTimeCaption(record.status)}
                      </span>
                      <span className="mt-0.5 block font-medium text-gray-900">{record.date}</span>
                      <span className="mt-0.5 block text-xs text-gray-500">{record.time}</span>
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle">
                      <span className="block font-semibold text-gray-900">{record.patientName}</span>
                      <span
                        className={`mt-0.5 block text-xs ${
                          sensitiveDataUnlocked ? 'text-sky-600' : 'text-gray-500'
                        }`}
                      >
                        {displayCpf(record.cpf)}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle">
                      <GenderAgeCell record={record} />
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle text-gray-700">
                      {record.specialty}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle">
                      <span className="block font-semibold text-gray-900">{record.doctorName}</span>
                      <span className="mt-0.5 block text-xs text-gray-500">{record.doctorCrm}</span>
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle text-gray-700">
                      {record.neighborhood}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle">
                      <div className="flex justify-center">
                        <StatusBadge status={record.status} />
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle tabular-nums text-gray-700">
                      {record.durationMinutes !== null ? `${record.durationMinutes} min` : '—'}
                    </td>
                    <td className="px-3 py-3.5 text-center align-middle sm:px-5">
                      <button
                        type="button"
                        onClick={() => {
                          const fallbackUser = findNetworkUserForConsultation(record)
                          if (record.pacienteId) {
                            openUserWithPacienteDetail(record.pacienteId, fallbackUser)
                          } else {
                            openUser(fallbackUser)
                          }
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary-light)] hover:text-[var(--brand-primary)]"
                        aria-label={`Ver perfil de ${record.patientName}`}
                      >
                        <Eye className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="flex shrink-0 flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-gray-500">
              {totalFiltered === 0
                ? 'Nenhum resultado na lista filtrada'
                : `Mostrando ${showingFrom} a ${showingTo} de ${formatNumber(totalFiltered)} resultado${totalFiltered === 1 ? '' : 's'}`}
            </p>
            <nav className="flex items-center gap-1" aria-label="Paginação de consultas">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              {Array.from({ length: Math.min(3, totalPages) }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                      pageNumber === safePage
                        ? 'border border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                        : 'border border-transparent text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ),
              )}
              {totalPages > 3 ? (
                <>
                  <span className="px-1 text-sm text-gray-400">…</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                      safePage === totalPages
                        ? 'border border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              ) : null}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próximo
              </button>
            </nav>
          </footer>
        </section>
      </div>

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant}
        onClose={dismissToast}
      />

      {drawerLayer}
    </>
  )
}
