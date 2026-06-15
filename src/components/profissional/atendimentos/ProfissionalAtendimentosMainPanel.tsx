import { ChevronLeft, ChevronRight, Eye, Search, Stethoscope } from 'lucide-react'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { CustomSelect } from '../../ui/CustomSelect'
import { CompactDateRangePicker } from '../../ui/CompactDateRangePicker'
import { Skeleton } from '../../ui/Skeleton'
import { PROFISSIONAL_ATENDIMENTOS_TOUR_DEMO_RECORD_ID } from '../../../config/profissionalAtendimentosTour'
import { PROFISSIONAL_HISTORICO_DEMO_RECORD_ID } from '../../../config/profissionalHistoricoDemo'
import { useProfissionalAuth } from '../../../contexts/ProfissionalAuthContext'
import { resolveProfissionalAtendimentosTourRecords } from '../../../utils/profissional/profissionalTourDemoFallbacks'
import { shouldShowPortalPageLoadingBlock } from '../../../utils/portal/portalPageLoading'
import {
  createDefaultProfissionalAtendimentosFilters,
  useProfissionalAtendimentosPage,
} from '../../../hooks/useProfissionalAtendimentosPage'
import type {
  ProfissionalAttendanceRecord,
  ProfissionalAtendimentosFilters,
} from '../../../types/profissionalAtendimentos'
import {
  profissionalAtendimentosPanelClass,
  profissionalAtendimentosStatusConfig,
} from './profissionalAtendimentosUi'
import {
  ProfissionalAtendimentoDetailDrawer,
  type ProfissionalAtendimentoDetailDrawerHandle,
} from './ProfissionalAtendimentoDetailDrawer'
import { ProfissionalAttendanceDocsCell } from './ProfissionalAttendanceDocsCell'
import { ProfissionalAtendimentosTableSkeleton } from './ProfissionalAtendimentosTableSkeleton'

type ProfissionalAtendimentosMainPanelProps = {
  onFilteredRecordsChange?: (records: ProfissionalAttendanceRecord[]) => void
  onLoadingChange?: (loading: boolean) => void
  tourLockDrawerClose?: boolean
  tourActive?: boolean
  initialOpenRecordId?: string | null
}

export type ProfissionalAtendimentosMainPanelHandle = {
  openDemoRecord: () => void
  closeDrawer: () => void
  openFullRecord: () => void
  closeFullRecord: () => void
  openReceivedPreview: (attachmentId?: string) => void
  closeAttachmentPreview: () => void
  closeAllOverlays: () => void
}

const STATUS_BADGE_WIDTH = 'w-[8.5rem]'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatAttendanceDateCell(iso: string) {
  const date = new Date(iso)
  return {
    dateLine: new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date),
    timeLine: new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date),
  }
}

function AttendanceDateTimeCell({ dateTimeIso }: { dateTimeIso: string }) {
  const { dateLine, timeLine } = formatAttendanceDateCell(dateTimeIso)
  return (
    <div className="tabular-nums">
      <p className="text-sm font-medium text-gray-900">{dateLine}</p>
      <p className="mt-0.5 text-[11px] text-gray-500">{timeLine}</p>
    </div>
  )
}

function AgeCell({ age }: { age: number }) {
  return <span className="text-sm tabular-nums text-gray-700">{age} anos</span>
}

function PatientGenderSubtitle({ gender }: { gender: ProfissionalAttendanceRecord['gender'] }) {
  const dotColor = gender === 'F' ? 'bg-pink-500' : 'bg-blue-500'
  const genderLabel = gender === 'F' ? 'Feminino' : 'Masculino'
  return (
    <p className="inline-flex items-center gap-1.5 truncate text-[11px] leading-none text-gray-500">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} aria-hidden />
      {genderLabel}
    </p>
  )
}

function StatusBadge({ status }: { status: ProfissionalAttendanceRecord['status'] }) {
  const config = profissionalAtendimentosStatusConfig[status]
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

export const ProfissionalAtendimentosMainPanel = forwardRef<
  ProfissionalAtendimentosMainPanelHandle,
  ProfissionalAtendimentosMainPanelProps
>(function ProfissionalAtendimentosMainPanel(
  { onFilteredRecordsChange, onLoadingChange, tourLockDrawerClose = false, tourActive = false, initialOpenRecordId = null },
  ref,
) {
  const { isBootstrapping } = useProfissionalAuth()
  const drawerRef = useRef<ProfissionalAtendimentoDetailDrawerHandle>(null)
  const [filters, setFilters] = useState<ProfissionalAtendimentosFilters>(
    createDefaultProfissionalAtendimentosFilters,
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState<ProfissionalAttendanceRecord | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerClosing, setDrawerClosing] = useState(false)
  const initialOpenHandledRef = useRef(false)

  const pageSize = 10
  const { records: apiRecords, pagination: apiPagination, isLoading, loadError } = useProfissionalAtendimentosPage(
    filters,
    currentPage,
    pageSize,
  )

  const paginatedRecords = useMemo(
    () => resolveProfissionalAtendimentosTourRecords(apiRecords, tourActive),
    [apiRecords, tourActive],
  )

  const pagination = useMemo(() => {
    if (!tourActive || apiRecords.length > 0) return apiPagination
    return {
      page: 1,
      pageSize,
      total: paginatedRecords.length,
      totalPages: Math.max(1, Math.ceil(paginatedRecords.length / pageSize)),
    }
  }, [apiPagination, apiRecords.length, pageSize, paginatedRecords.length, tourActive])

  useEffect(() => {
    onFilteredRecordsChange?.(paginatedRecords)
  }, [paginatedRecords, onFilteredRecordsChange])

  const totalFiltered = pagination.total
  const totalPages = pagination.totalPages
  const safePage = pagination.page
  const showingFrom = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize + 1
  const showingTo = Math.min(safePage * pageSize, totalFiltered)
  const showLoadingBlock = shouldShowPortalPageLoadingBlock(
    isLoading || isBootstrapping,
    paginatedRecords.length > 0,
  )

  useEffect(() => {
    onLoadingChange?.(isLoading || isBootstrapping)
  }, [isBootstrapping, isLoading, onLoadingChange])

  useEffect(() => {
    if (!initialOpenRecordId || isLoading || isBootstrapping || tourActive) return
    if (initialOpenHandledRef.current) return
    const record = paginatedRecords.find((item) => item.id === initialOpenRecordId)
    if (!record) return
    initialOpenHandledRef.current = true
    setSelectedRecord(record)
    setDrawerClosing(false)
    setDrawerOpen(true)
  }, [initialOpenRecordId, isLoading, isBootstrapping, paginatedRecords, tourActive])

  function updateFilter<K extends keyof ProfissionalAtendimentosFilters>(
    key: K,
    value: ProfissionalAtendimentosFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  function openRecord(record: ProfissionalAttendanceRecord) {
    setSelectedRecord(record)
    setDrawerClosing(false)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    if (tourLockDrawerClose) return
    setDrawerClosing(true)
  }

  function handleDrawerTransitionEnd() {
    if (drawerClosing) {
      setDrawerOpen(false)
      setDrawerClosing(false)
      setSelectedRecord(null)
    }
  }

  useImperativeHandle(
    ref,
    () => ({
      openDemoRecord: () => {
        const record =
          paginatedRecords.find((item) => item.id === PROFISSIONAL_ATENDIMENTOS_TOUR_DEMO_RECORD_ID) ??
          paginatedRecords.find((item) => item.id === PROFISSIONAL_HISTORICO_DEMO_RECORD_ID) ??
          paginatedRecords[0]
        if (record) openRecord(record)
      },
      closeDrawer: () => {
        drawerRef.current?.closeAttachmentPreview()
        drawerRef.current?.closeFullRecord()
        setDrawerClosing(true)
      },
      openFullRecord: () => drawerRef.current?.openFullRecord(),
      closeFullRecord: () => drawerRef.current?.closeFullRecord(),
      openReceivedPreview: (attachmentId?: string) =>
        drawerRef.current?.openReceivedPreview(attachmentId),
      closeAttachmentPreview: () => drawerRef.current?.closeAttachmentPreview(),
      closeAllOverlays: () => {
        drawerRef.current?.closeAttachmentPreview()
        drawerRef.current?.closeFullRecord()
        setDrawerClosing(true)
      },
    }),
    [paginatedRecords],
  )

  return (
    <>
      <section
        data-tour="atendimentos-main-panel"
        className={[
          profissionalAtendimentosPanelClass,
          'flex h-full min-h-0 min-w-0 flex-col overflow-hidden',
        ].join(' ')}
      >
        <div className="shrink-0 border-b border-gray-100 bg-gradient-to-r from-[var(--brand-primary-light)]/30 via-white to-white px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[var(--brand-primary)] shadow-sm ring-1 ring-orange-100">
                <Stethoscope className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900">Histórico de atendimentos</p>
                {showLoadingBlock ? (
                  <Skeleton className="mt-1 h-3 w-40" />
                ) : (
                  <p className="text-xs text-gray-500">
                    {formatNumber(totalFiltered)} consulta{totalFiltered === 1 ? '' : 's'} no período
                  </p>
                )}
              </div>
            </div>
          </div>

          <div
            data-tour="atendimentos-filters"
            className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end"
          >
            <label className="relative min-w-0 flex-1 lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={filters.generalSearch}
                onChange={(e) => updateFilter('generalSearch', e.target.value)}
                placeholder="Buscar paciente, ID ou anotação..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:shrink-0">
              <div className="min-w-[10.5rem]">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Status</label>
                <CustomSelect
                  size="compact"
                  value={filters.status}
                  onChange={(value) =>
                    updateFilter('status', value as ProfissionalAtendimentosFilters['status'])
                  }
                  className="!rounded-xl !py-2.5"
                  options={[
                    { value: '', label: 'Todos' },
                    { value: 'concluido', label: 'Concluído' },
                    { value: 'interrompido', label: 'Interrompido' },
                  ]}
                />
              </div>
              <div className="min-w-[14rem] sm:min-w-[16rem]">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Período</label>
                <CompactDateRangePicker
                  start={filters.periodStart}
                  end={filters.periodEnd}
                  onStartChange={(value) => updateFilter('periodStart', value)}
                  onEndChange={(value) => updateFilter('periodEnd', value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {showLoadingBlock ? (
            <ProfissionalAtendimentosTableSkeleton />
          ) : paginatedRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-20 text-center">
              <Stethoscope className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-gray-800">Nenhum atendimento encontrado</p>
              <p className="max-w-sm text-xs text-gray-500">
                Ajuste os filtros ou o período para ver consultas anteriores.
              </p>
            </div>
          ) : (
            <table
              data-tour="atendimentos-table"
              className="w-full min-w-[720px] border-collapse text-left"
            >
              <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
                <tr className="border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Paciente</th>
                  <th className="px-5 py-3 text-center">Idade</th>
                  <th className="px-5 py-3 text-center">Duração</th>
                  <th className="px-5 py-3 text-center">Docs</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="w-20 px-3 py-3 text-center whitespace-nowrap">
                    <span className="relative -left-[23px] inline-block">Detalhes</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="group border-b border-gray-50 transition hover:bg-orange-50/40"
                  >
                    <td className="px-5 py-3.5">
                      <AttendanceDateTimeCell dateTimeIso={record.dateTimeIso} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={record.patientPhotoUrl}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-lg border border-white object-cover shadow-sm ring-1 ring-gray-100"
                        />
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <p className="truncate text-sm font-semibold leading-tight text-gray-900">
                            {record.patientName}
                          </p>
                          <PatientGenderSubtitle gender={record.gender} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <AgeCell age={record.age} />
                    </td>
                    <td className="px-5 py-3.5 text-center text-sm tabular-nums text-gray-700">
                      {record.durationMinutes} min
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <ProfissionalAttendanceDocsCell
                        sentCount={record.issuedDocuments.length}
                        receivedCount={record.patientUploads.length}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="w-20 px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => openRecord(record)}
                        data-tour={
                          record.id === PROFISSIONAL_ATENDIMENTOS_TOUR_DEMO_RECORD_ID
                            ? 'atendimentos-view-details-btn'
                            : undefined
                        }
                        className="mx-auto -translate-x-[23px] inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-orange-50 hover:text-[var(--brand-primary)]"
                        aria-label={`Ver detalhes de ${record.patientName}`}
                      >
                        <Eye className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div
          data-tour="atendimentos-pagination"
          className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3.5 sm:px-6"
        >
          <div className="text-xs text-gray-500">
            {showLoadingBlock ? (
              <Skeleton className="inline-block h-3 w-44" />
            ) : (
              <>
                Exibindo {showingFrom}–{showingTo} de {formatNumber(totalFiltered)}
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {showLoadingBlock ? (
              <>
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </>
            ) : (
              <>
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <span className="px-2 text-xs font-semibold tabular-nums text-gray-700">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
              </>
            )}
          </div>
        </div>
      </section>

      <ProfissionalAtendimentoDetailDrawer
        ref={drawerRef}
        record={selectedRecord}
        open={drawerOpen}
        closing={drawerClosing}
        onClose={closeDrawer}
        onTransitionEnd={handleDrawerTransitionEnd}
        tourLockClose={tourLockDrawerClose}
      />
    </>
  )
})
