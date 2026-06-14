import {
  CalendarPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getPrefeituraById, getUbtById } from '../../../data/adminEscalaCatalog'
import type { AdminEscalaShift, AdminEscalaShiftStatus } from '../../../types/adminEscala'
import { dashboardMainPanelSurfaceClass } from '../../layout/dashboardPageLayout'
import { CustomSelect } from '../../ui/CustomSelect'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import {
  buildAdminEscalaStatusBadge,
  getRowStatus,
  groupEscalaShiftsForTable,
  rowIntersectsWeek,
  type AdminEscalaTableRow,
} from './adminEscalaUi'

type StatusFilter = 'all' | AdminEscalaShiftStatus

type AdminEscalaMainPanelProps = {
  shifts: AdminEscalaShift[]
  onNewShift: () => void
  onEditRow: (row: AdminEscalaTableRow) => void
  onDeleteShifts: (shiftIds: string[], label: string) => void | Promise<void>
  canInsert?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

type FlatShiftRow = {
  shift: AdminEscalaShift
  sourceRow: AdminEscalaTableRow
}

type ScopeGroup = {
  key: string
  label: string
  shifts: AdminEscalaShift[]
  sourceRow: AdminEscalaTableRow
  ubts: ScopeGroup[]
}

const statusFilterOptions = [
  { value: 'all', label: 'Status: Todos' },
  { value: 'publicada', label: 'Publicadas' },
  { value: 'rascunho', label: 'Rascunhos' },
  { value: 'cancelada', label: 'Canceladas' },
]

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatWeekLabel(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6)
  const fmt: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' }
  return `${weekStart.toLocaleDateString('pt-BR', fmt)} – ${weekEnd.toLocaleDateString('pt-BR', { ...fmt, year: 'numeric' })}`
}

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function shiftSearchBlob(shift: AdminEscalaShift) {
  const prefeituraNames =
    shift.prefeituraScope.mode === 'all'
      ? 'todas prefeituras'
      : shift.prefeituraScope.prefeituraIds
          .map((id) => getPrefeituraById(id)?.name ?? id)
          .join(' ')
  const ubtNames =
    shift.ubtScope.mode === 'selected'
      ? shift.ubtScope.ubtIds.map((id) => getUbtById(id)?.name ?? id).join(' ')
      : shift.ubtScope.mode
  return [
    shift.specialty,
    prefeituraNames,
    ubtNames,
    shift.primaryDoctorId,
    ...shift.backupDoctorIds,
    shift.notes,
  ].join(' ')
}

function flattenRows(rows: AdminEscalaTableRow[]): FlatShiftRow[] {
  const out: FlatShiftRow[] = []
  for (const row of rows) {
    if (row.kind === 'single') {
      out.push({ shift: row.shift, sourceRow: row })
      continue
    }
    for (const shift of row.shifts) {
      out.push({ shift, sourceRow: row })
    }
  }
  return out
}

function buildMetrics(shifts: AdminEscalaShift[]) {
  const doctors = new Set<string>()
  const specialties = new Set<string>()
  let latestUpdatedAt = ''
  let drafts = 0
  let noBackup = 0
  const coveredDays = new Set<string>()
  for (const shift of shifts) {
    doctors.add(shift.primaryDoctorId)
    shift.backupDoctorIds.forEach((id) => doctors.add(id))
    specialties.add(shift.specialtyId ?? shift.specialty)
    coveredDays.add(shift.startAt.slice(0, 10))
    if (shift.status === 'rascunho') drafts += 1
    if (shift.backupDoctorIds.length === 0) noBackup += 1
    if (!latestUpdatedAt || shift.updatedAt > latestUpdatedAt) {
      latestUpdatedAt = shift.updatedAt
    }
  }
  const allPublished = shifts.length > 0 && shifts.every((s) => s.status === 'publicada')
  const allCancelled = shifts.length > 0 && shifts.every((s) => s.status === 'cancelada')
  const status: AdminEscalaShiftStatus = allCancelled
    ? 'cancelada'
    : allPublished
      ? 'publicada'
      : 'rascunho'
  return {
    status,
    doctors: doctors.size,
    specialties: specialties.size,
    turns: shifts.length,
    coveredDays: coveredDays.size,
    drafts,
    noBackup,
    latestUpdatedAt,
  }
}

function formatUpdatedAt(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusPillClass(status: AdminEscalaShiftStatus) {
  if (status === 'publicada') {
    return 'text-emerald-700 shadow-[inset_0_-2px_0_0_#10b981]'
  }
  if (status === 'rascunho') {
    return 'text-amber-700 shadow-[inset_0_-2px_0_0_#f59e0b]'
  }
  return 'text-gray-600 shadow-[inset_0_-2px_0_0_#9ca3af]'
}

function groupByScope(entries: FlatShiftRow[]): ScopeGroup[] {
  const prefeituraMap = new Map<string, ScopeGroup>()

  for (const entry of entries) {
    const { shift, sourceRow } = entry
    const prefeituraBuckets =
      shift.prefeituraScope.mode === 'all'
        ? [{ key: 'all-prefeituras', label: 'Todas as prefeituras' }]
        : shift.prefeituraScope.prefeituraIds.map((id) => ({
            key: id,
            label: getPrefeituraById(id)?.name ?? id,
          }))

    for (const prefeituraBucket of prefeituraBuckets) {
      if (!prefeituraMap.has(prefeituraBucket.key)) {
        prefeituraMap.set(prefeituraBucket.key, {
          key: prefeituraBucket.key,
          label: prefeituraBucket.label,
          shifts: [],
          sourceRow,
          ubts: [],
        })
      }
      const prefeituraGroup = prefeituraMap.get(prefeituraBucket.key)!
      prefeituraGroup.shifts.push(shift)

      const ubtBuckets =
        shift.ubtScope.mode === 'tele_only'
          ? [{ key: 'tele-only', label: 'Somente telemedicina' }]
          : shift.ubtScope.mode === 'all'
            ? [{ key: 'all-ubts', label: 'Todas as UBTs' }]
            : shift.ubtScope.ubtIds.map((id) => ({
                key: id,
                label: getUbtById(id)?.name ?? id,
              }))

      for (const ubtBucket of ubtBuckets) {
        const ubtGroupKey = `${prefeituraBucket.key}::${ubtBucket.key}`
        let ubtGroup = prefeituraGroup.ubts.find((item) => item.key === ubtGroupKey)
        if (!ubtGroup) {
          ubtGroup = {
            key: ubtGroupKey,
            label: ubtBucket.label,
            shifts: [],
            sourceRow,
            ubts: [],
          }
          prefeituraGroup.ubts.push(ubtGroup)
        }
        ubtGroup.shifts.push(shift)
      }
    }
  }

  const groups = [...prefeituraMap.values()].sort((a, b) =>
    a.label.localeCompare(b.label, 'pt-BR'),
  )
  for (const group of groups) {
    group.ubts.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
  }
  return groups
}

function ActionMenu({
  menuKey,
  isOpen,
  onToggle,
  onVisualizar,
  onEditar,
  onExcluir,
  canEdit = true,
  canDelete = true,
}: {
  menuKey: string
  isOpen: boolean
  onToggle: (key: string | null) => void
  onVisualizar: () => void
  onEditar: () => void
  onExcluir: () => void
  canEdit?: boolean
  canDelete?: boolean
}) {
  return (
    <div className="relative" data-escala-action-menu="true">
      <button
        type="button"
        onClick={() => onToggle(isOpen ? null : menuKey)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
        aria-label="Ações"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {isOpen ? (
        <div className="absolute right-0 z-20 mt-1 w-40 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={onVisualizar}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
          >
            <Eye className="h-3.5 w-3.5" />
            Visualizar
          </button>
          {canEdit ? (
            <button
              type="button"
              onClick={onEditar}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              onClick={onExcluir}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function AdminEscalaMainPanel({
  shifts,
  onNewShift,
  onEditRow,
  onDeleteShifts,
  canInsert = true,
  canEdit = true,
  canDelete = true,
}: AdminEscalaMainPanelProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedPrefeituras, setExpandedPrefeituras] = useState<Record<string, boolean>>({})
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ ids: string[]; label: string } | null>(null)

  useEffect(() => {
    if (!openMenuKey) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-escala-action-menu="true"]')) return
      setOpenMenuKey(null)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenMenuKey(null)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openMenuKey])

  const filteredRows = useMemo(() => {
    const query = normalizeSearch(search.trim())
    return groupEscalaShiftsForTable(shifts)
      .filter((row) => rowIntersectsWeek(row, weekStart))
      .filter((row) => statusFilter === 'all' || getRowStatus(row) === statusFilter)
      .filter((row) => {
        if (!query) return true
        const rowShifts = row.kind === 'single' ? [row.shift] : row.shifts
        return rowShifts.some((shift) => normalizeSearch(shiftSearchBlob(shift)).includes(query))
      })
  }, [shifts, weekStart, search, statusFilter])

  const scopedGroups = useMemo(
    () => groupByScope(flattenRows(filteredRows)),
    [filteredRows],
  )

  function togglePrefeitura(key: string) {
    setOpenMenuKey(null)
    setExpandedPrefeituras((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <section
      className={[dashboardMainPanelSurfaceClass, 'flex min-h-0 flex-1 flex-col'].join(' ')}
      aria-label="Resumo por prefeitura da escala"
    >
      <div className="shrink-0 border-b border-gray-100 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-center gap-2 lg:justify-start">
            <button
              type="button"
              onClick={() => setWeekStart((w) => addDays(w, -7))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[10rem] text-center text-sm font-bold text-gray-900">
              {formatWeekLabel(weekStart)}
            </span>
            <button
              type="button"
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              aria-label="Próxima semana"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setWeekStart(startOfWeek(new Date()))}
              className="ml-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]/40"
            >
              Hoje
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-[16rem] flex-1 sm:max-w-md lg:max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar prefeitura, UBT, especialidade…"
                className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--brand-primary)]/40"
              />
            </div>
            <CustomSelect
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
              options={statusFilterOptions}
            />
            {canInsert ? (
              <button
                type="button"
                onClick={onNewShift}
                className="btn-brand-gradient inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                <CalendarPlus className="h-4 w-4" />
                Montar escala do período
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[64rem] border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Escopo
              </th>
              <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>
              <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Cobertura (7 dias)
              </th>
              <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Médicos
              </th>
              <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Especialidades
              </th>
              <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Risco
              </th>
              <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Últ. atualização
              </th>
              <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {scopedGroups.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-sm text-gray-500">
                  Nenhuma escala nesta semana com os filtros atuais.
                </td>
              </tr>
            ) : (
              scopedGroups.flatMap((group) => {
                const prefMetrics = buildMetrics(group.shifts)
                const isExpanded = Boolean(expandedPrefeituras[group.key])
                const prefIds = [...new Set(group.shifts.map((s) => s.id))]
                const prefBadge = buildAdminEscalaStatusBadge(prefMetrics.status)
                return [
                  <tr
                    key={`pref-${group.key}`}
                    className="cursor-pointer border-t border-gray-200 bg-white hover:bg-slate-50/60"
                    onClick={() => togglePrefeitura(group.key)}
                  >
                    <td className="px-4 py-3 text-left">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          togglePrefeitura(group.key)
                        }}
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-900"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                        {group.label}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={[
                          'inline-flex min-w-[82px] justify-center rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-semibold',
                          statusPillClass(prefMetrics.status),
                        ].join(' ')}
                      >
                        {prefBadge.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-sm text-gray-800">
                      <span className="font-semibold">{prefMetrics.coveredDays}</span>/7 dias
                      <span className="ml-1 text-xs text-gray-500">· {prefMetrics.turns} turnos</span>
                    </td>
                    <td className="px-3 py-3 text-center text-sm font-semibold text-gray-900">
                      {prefMetrics.doctors}
                    </td>
                    <td className="px-3 py-3 text-center text-sm font-semibold text-gray-900">
                      {prefMetrics.specialties}
                    </td>
                    <td className="px-3 py-3 text-center text-sm text-gray-800">
                      {prefMetrics.noBackup > 0 ? (
                        <span className="text-amber-600">{prefMetrics.noBackup} sem reserva</span>
                      ) : prefMetrics.drafts > 0 ? (
                        <span className="text-violet-600">{prefMetrics.drafts} rascunho(s)</span>
                      ) : (
                        <span className="text-emerald-600">Baixo</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-gray-600">
                      {formatUpdatedAt(prefMetrics.latestUpdatedAt)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div
                        className="flex justify-center"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <ActionMenu
                          menuKey={`pref-menu-${group.key}`}
                          isOpen={openMenuKey === `pref-menu-${group.key}`}
                          onToggle={setOpenMenuKey}
                          onVisualizar={() => {
                            setExpandedPrefeituras((current) => ({ ...current, [group.key]: true }))
                            setOpenMenuKey(null)
                          }}
                          onEditar={() => {
                            onEditRow(group.sourceRow)
                            setOpenMenuKey(null)
                          }}
                          onExcluir={() => {
                            setConfirmDelete({ ids: prefIds, label: group.label })
                            setOpenMenuKey(null)
                          }}
                          canEdit={canEdit}
                          canDelete={canDelete}
                        />
                      </div>
                    </td>
                  </tr>,
                  ...(isExpanded
                    ? group.ubts.map((ubt) => {
                        const ubtMetrics = buildMetrics(ubt.shifts)
                        const ubtIds = [...new Set(ubt.shifts.map((s) => s.id))]
                        const ubtBadge = buildAdminEscalaStatusBadge(ubtMetrics.status)
                        return (
                          <tr
                            key={`ubt-${ubt.key}`}
                            className="border-t border-gray-100 bg-slate-50/50"
                          >
                            <td className="px-4 py-2.5 text-left text-sm text-gray-700">
                              <span className="inline-flex items-center gap-2 pl-6">
                                <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                                {ubt.label}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span
                                className={[
                                  'inline-flex min-w-[76px] justify-center rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold',
                                  statusPillClass(ubtMetrics.status),
                                ].join(' ')}
                              >
                                {ubtBadge.label}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center text-sm text-gray-800">
                              <span className="font-semibold">{ubtMetrics.coveredDays}</span>/7
                              <span className="ml-1 text-xs text-gray-500">· {ubtMetrics.turns}</span>
                            </td>
                            <td className="px-3 py-2.5 text-center text-sm text-gray-800">
                              {ubtMetrics.doctors}
                            </td>
                            <td className="px-3 py-2.5 text-center text-sm text-gray-800">
                              {ubtMetrics.specialties}
                            </td>
                            <td className="px-3 py-2.5 text-center text-sm text-gray-800">
                              {ubtMetrics.noBackup > 0 ? (
                                <span className="text-amber-600">{ubtMetrics.noBackup} sem reserva</span>
                              ) : ubtMetrics.drafts > 0 ? (
                                <span className="text-violet-600">{ubtMetrics.drafts} rascunho(s)</span>
                              ) : (
                                <span className="text-emerald-600">Baixo</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center text-xs text-gray-600">
                              {formatUpdatedAt(ubtMetrics.latestUpdatedAt)}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <div className="flex justify-center">
                                <ActionMenu
                                  menuKey={`ubt-menu-${ubt.key}`}
                                  isOpen={openMenuKey === `ubt-menu-${ubt.key}`}
                                  onToggle={setOpenMenuKey}
                                  onVisualizar={() => setOpenMenuKey(null)}
                                  onEditar={() => {
                                    onEditRow(ubt.sourceRow)
                                    setOpenMenuKey(null)
                                  }}
                                  onExcluir={() => {
                                    setConfirmDelete({ ids: ubtIds, label: `${group.label} / ${ubt.label}` })
                                    setOpenMenuKey(null)
                                  }}
                                  canEdit={canEdit}
                                  canDelete={canDelete}
                                />
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    : []),
                ]
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Excluir escala"
        description={`Deseja excluir a escala de ${confirmDelete?.label ?? ''}? Essa ação remove os turnos listados neste agrupamento.`}
        confirmLabel="Excluir"
        tone="danger"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            onDeleteShifts(confirmDelete.ids, confirmDelete.label)
          }
          setConfirmDelete(null)
        }}
      />
    </section>
  )
}

