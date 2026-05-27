import { CalendarDays, Eye, Filter, RotateCcw, Search } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { CustomSelect } from '../ui/CustomSelect'
import { CompactDateRangePicker } from '../ui/CompactDateRangePicker'
import {
  consultasFilterOptions,
  consultasPagination,
  consultasRecords,
  defaultConsultasPeriod,
  type ConsultationRecord,
  type ConsultationStatus,
} from '../../data/consultasMock'
import type { useNetworkUserDrawer } from '../../hooks/useNetworkUserDrawer'
import {
  applyConsultasFilters,
  defaultConsultasFilters,
  type ConsultasFilters,
} from '../../utils/consultasFilters'
import { findNetworkUserForConsultation } from '../../utils/consultasPatientUser'
import { unitStation } from '../../data/unitDashboardMock'
import {
  exportConsultasExcel,
  exportConsultasPdf,
  type ConsultasExportContext,
} from '../../utils/consultas/consultasExport'
import { maskCpfForDisplay } from '../../utils/lgpdDisplay'
import { getLoggedOperatorName } from '../../utils/sessionUser'
import { ConsultasExportMenu, type ConsultasExportFormat } from './ConsultasExportMenu'
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
  | 'setSensitiveDataUnlocked'
  | 'openUnlockModal'
  | 'openUser'
  | 'drawerLayer'
>

type ConsultasMainPanelProps = {
  networkUserDrawer: ConsultasNetworkUserDrawer
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-600">{label}</label>
      {children}
    </div>
  )
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

export function ConsultasMainPanel({ networkUserDrawer }: ConsultasMainPanelProps) {
  const {
    sensitiveDataUnlocked,
    setSensitiveDataUnlocked,
    openUnlockModal,
    openUser,
    drawerLayer,
  } = networkUserDrawer

  const [draftFilters, setDraftFilters] = useState<ConsultasFilters>({
    ...defaultConsultasFilters,
    periodStart: defaultConsultasPeriod.start,
    periodEnd: defaultConsultasPeriod.end,
  })
  const [appliedFilters, setAppliedFilters] = useState<ConsultasFilters>({
    ...defaultConsultasFilters,
    periodStart: defaultConsultasPeriod.start,
    periodEnd: defaultConsultasPeriod.end,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const pageSize = consultasPagination.pageSize

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const filteredRecords = useMemo(
    () =>
      applyConsultasFilters(consultasRecords, {
        ...appliedFilters,
        generalSearch: draftFilters.generalSearch,
      }),
    [appliedFilters, draftFilters.generalSearch],
  )

  const totalFiltered = filteredRecords.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedRecords = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filteredRecords.slice(start, start + pageSize)
  }, [filteredRecords, safePage, pageSize])

  const showingFrom = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize + 1
  const showingTo = Math.min(safePage * pageSize, totalFiltered)
  const catalogTotal = consultasPagination.total

  function updateDraft<K extends keyof ConsultasFilters>(key: K, value: ConsultasFilters[K]) {
    setDraftFilters((prev) => ({ ...prev, [key]: value }))
    if (key === 'generalSearch') {
      setCurrentPage(1)
    }
  }

  function applyFilters() {
    setAppliedFilters({ ...draftFilters })
    setCurrentPage(1)
  }

  function displayCpf(cpf: string) {
    return sensitiveDataUnlocked ? cpf : maskCpfForDisplay(cpf)
  }

  function clearFilters() {
    const cleared: ConsultasFilters = {
      ...defaultConsultasFilters,
      periodStart: defaultConsultasPeriod.start,
      periodEnd: defaultConsultasPeriod.end,
    }
    setDraftFilters(cleared)
    setAppliedFilters(cleared)
    setCurrentPage(1)
  }

  function buildExportContext(): ConsultasExportContext {
    return {
      records: filteredRecords,
      filters: appliedFilters,
      generalSearch: draftFilters.generalSearch,
      sensitiveDataUnlocked,
      unitLabel: unitStation.unitName,
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

  const selectClass = 'py-2.5'

  return (
    <>
      <div className="flex h-full min-h-0 min-w-0 flex-col gap-4">
        <section className="shrink-0 rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
          <header className="flex items-center gap-2 border-b border-gray-200 px-5 py-4 sm:px-6">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
              <Filter className="h-4 w-4" strokeWidth={2} />
            </span>
            <h2 className="text-base font-bold text-gray-900">Filtros de busca</h2>
          </header>

          <div className="px-5 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <FilterField label="Período de atendimento">
                <CompactDateRangePicker
                  start={draftFilters.periodStart}
                  end={draftFilters.periodEnd}
                  onStartChange={(value) => updateDraft('periodStart', value)}
                  onEndChange={(value) => updateDraft('periodEnd', value)}
                />
              </FilterField>
              <FilterField label="Especialidade">
                <CustomSelect
                  value={draftFilters.specialty}
                  onChange={(value) => updateDraft('specialty', value)}
                  options={[...consultasFilterOptions.specialties]}
                  className={selectClass}
                />
              </FilterField>
              <FilterField label="Médico">
                <CustomSelect
                  value={draftFilters.doctor}
                  onChange={(value) => updateDraft('doctor', value)}
                  options={[...consultasFilterOptions.doctors]}
                  className={selectClass}
                />
              </FilterField>
              <FilterField label="Bairro">
                <CustomSelect
                  value={draftFilters.neighborhood}
                  onChange={(value) => updateDraft('neighborhood', value)}
                  options={[...consultasFilterOptions.neighborhoods]}
                  className={selectClass}
                />
              </FilterField>

              <FilterField label="Sexo">
                <CustomSelect
                  value={draftFilters.gender}
                  onChange={(value) => updateDraft('gender', value)}
                  options={[...consultasFilterOptions.genders]}
                  className={selectClass}
                />
              </FilterField>
              <FilterField label="Faixa etária">
                <CustomSelect
                  value={draftFilters.ageRange}
                  onChange={(value) => updateDraft('ageRange', value)}
                  options={[...consultasFilterOptions.ageRanges]}
                  className={selectClass}
                />
              </FilterField>
              <FilterField label="Status da consulta">
                <CustomSelect
                  value={draftFilters.status}
                  onChange={(value) => updateDraft('status', value)}
                  options={[...consultasFilterOptions.statuses]}
                  className={selectClass}
                />
              </FilterField>
              <FilterField label="Unidade de atendimento">
                <CustomSelect
                  value={draftFilters.unit}
                  onChange={(value) => updateDraft('unit', value)}
                  options={[...consultasFilterOptions.units]}
                  className={selectClass}
                />
              </FilterField>

              <div className="col-span-1 sm:col-span-2 xl:col-span-4">
                <FilterField label="Busca geral">
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      value={draftFilters.generalSearch}
                      onChange={(e) => updateDraft('generalSearch', e.target.value)}
                      placeholder="Paciente, médico, CPF, CRM, especialidade, bairro, protocolo..."
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                    />
                  </label>
                </FilterField>
              </div>
            </div>

            <div className="mt-5 flex flex-col items-end gap-2 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={2} />
                Limpar filtros
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)]"
              >
                <Search className="h-4 w-4" strokeWidth={2} />
                Aplicar filtros
              </button>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
                <CalendarDays className="h-4 w-4" strokeWidth={2} />
              </span>
              <h2 className="text-base font-bold text-gray-900">Histórico de consultas</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
                  onClick={() => setSensitiveDataUnlocked(false)}
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
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-sm text-gray-500 sm:px-6">
                      {draftFilters.generalSearch.trim() ||
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
                      <span className="block font-medium text-gray-900">{record.date}</span>
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
                        onClick={() => openUser(findNetworkUserForConsultation(record))}
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
