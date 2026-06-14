import { PauseCircle, Stethoscope, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import type { AdminEscalaShift } from '../../../types/adminEscala'
import { ProfissionalEscalaCityTooltip } from '../../profissional/escala/ProfissionalEscalaCityTooltip'
import {
  formatProfissionalEscalaCardDate,
  formatProfissionalEscalaTimeRange,
  profissionalEscalaShiftsPanelClass,
} from '../../profissional/escala/profissionalEscalaUi'
import { formatProfissionalCurrency } from '../../../utils/profissional/formatProfissionalCurrency'
import {
  buildAdminEscalaFillStatusBadge,
  formatAdminEscalaModality,
} from './adminEscalaUi'
import { AdminEscalaListaShiftActionsMenu } from './AdminEscalaListaShiftActionsMenu'
import { AdminEscalaRepasseBadge } from './AdminEscalaRepasseBadge'

const thClass =
  'px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500'

type AdminEscalaOpenShiftsTableProps = {
  shifts: AdminEscalaShift[]
  headerActions?: ReactNode
  selectedIds: Set<string>
  allVisibleSelected: boolean
  selectedCount: number
  suspendableSelectedCount: number
  canEdit?: boolean
  canDelete?: boolean
  openMenuId: string | null
  onToggleSelect: (shiftId: string) => void
  onToggleSelectAll: () => void
  onToggleMenu: (shiftId: string | null) => void
  onView: (shift: AdminEscalaShift) => void
  onEdit: (shift: AdminEscalaShift) => void
  onSuspend: (shift: AdminEscalaShift) => void
  onDelete: (shift: AdminEscalaShift) => void
  onBulkSuspend: () => void
  onBulkDelete: () => void
}

function formatShiftMenuLabel(shift: AdminEscalaShift) {
  const date = formatProfissionalEscalaCardDate(shift.startAt)
  return `${shift.specialty} · ${date.day}/${date.month}`
}

export function AdminEscalaOpenShiftsTable({
  shifts,
  headerActions,
  selectedIds,
  allVisibleSelected,
  selectedCount,
  suspendableSelectedCount,
  canEdit = true,
  canDelete = true,
  openMenuId,
  onToggleSelect,
  onToggleSelectAll,
  onToggleMenu,
  onView,
  onEdit,
  onSuspend,
  onDelete,
  onBulkSuspend,
  onBulkDelete,
}: AdminEscalaOpenShiftsTableProps) {
  return (
    <section className={profissionalEscalaShiftsPanelClass} aria-label="Plantões da escala">
      <header className="shrink-0 border-b border-gray-100 px-5 py-3.5 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Plantões encontrados</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {shifts.length} resultado{shifts.length === 1 ? '' : 's'}
              {selectedCount > 0 ? ` · ${selectedCount} selecionado${selectedCount === 1 ? '' : 's'}` : ''}
            </p>
          </div>
          {headerActions ? (
            <div className="flex flex-wrap items-center justify-end gap-2">{headerActions}</div>
          ) : null}
        </div>
      </header>

      {shifts.length > 0 ? (
        <div className="shrink-0 border-b border-gray-100 px-5 py-2.5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2.5">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={onToggleSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
              />
              Selecionar todos ({shifts.length})
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {canEdit ? (
                <button
                  type="button"
                  disabled={suspendableSelectedCount === 0}
                  onClick={onBulkSuspend}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PauseCircle className="h-3.5 w-3.5" />
                  Suspender selecionados
                  {suspendableSelectedCount > 0 ? ` (${suspendableSelectedCount})` : ''}
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  disabled={selectedCount === 0}
                  onClick={onBulkDelete}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir selecionados
                  {selectedCount > 0 ? ` (${selectedCount})` : ''}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto">
        {shifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <Stethoscope className="h-8 w-8 text-gray-300" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-gray-700">Nenhum plantão encontrado</p>
            <p className="max-w-sm text-xs text-gray-500">
              Ajuste os filtros ou publique plantões abertos no marketplace.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[62rem] table-fixed border-collapse text-center">
            <colgroup>
              <col className="w-10" />
              <col className="w-[4.75rem]" />
              <col className="w-[11%]" />
              <col className="w-[14%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[8%]" />
              <col className="w-[11%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[11%]" />
              <col className="w-12" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
              <tr>
                <th className={thClass}>
                  <span className="sr-only">Selecionar</span>
                </th>
                <th className={thClass}>Data</th>
                <th className={thClass}>Horário</th>
                <th className={thClass}>Plantão</th>
                <th className={thClass}>Modalidade</th>
                <th className={thClass}>Modo</th>
                <th className={thClass}>Cidade</th>
                <th className={thClass}>Valor</th>
                <th className={thClass}>Repasse</th>
                <th className={thClass}>Vagas / capturas</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {shifts.map((shift) => {
                const date = formatProfissionalEscalaCardDate(shift.startAt)
                const fillBadge = buildAdminEscalaFillStatusBadge(shift)
                const modeLabel = shift.assignmentMode === 'open' ? 'Aberto' : 'Atribuído'
                const captures =
                  shift.claimedCaptures.length > 0
                    ? shift.claimedCaptures.map((c) => c.doctorName).join(', ')
                    : '—'
                const isSelected = selectedIds.has(shift.id)
                const canSuspend = canEdit && shift.status !== 'cancelada'

                return (
                  <tr
                    key={shift.id}
                    className={[
                      'align-middle text-sm text-gray-700 hover:bg-orange-50/35',
                      isSelected ? 'bg-orange-50/50' : '',
                    ].join(' ')}
                  >
                    <td className="px-2 py-3 align-middle">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(shift.id)}
                        aria-label={`Selecionar ${formatShiftMenuLabel(shift)}`}
                        className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/20"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="mx-auto flex h-[4.25rem] w-[4.25rem] flex-col items-center justify-center rounded-xl border border-gray-200 bg-slate-50">
                        <span className="text-lg font-bold text-gray-900">{date.day}</span>
                        <span className="text-[9px] font-bold uppercase text-[var(--brand-primary)]">
                          {date.month}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold tabular-nums">
                      {formatProfissionalEscalaTimeRange(shift.startAt, shift.endAt)}
                      <p className="mt-0.5 font-normal text-gray-500">{shift.turnLabel}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-gray-900">{shift.specialty}</p>
                      <p className="mt-0.5 text-[11px] text-gray-500">{shift.unitName}</p>
                    </td>
                    <td className="px-3 py-3 text-xs">{formatAdminEscalaModality(shift.modality)}</td>
                    <td className="px-3 py-3 text-xs font-semibold">{modeLabel}</td>
                    <td className="px-3 py-3">
                      {shift.modality === 'presencial_ubt' && shift.fullAddress ? (
                        <ProfissionalEscalaCityTooltip
                          city={shift.city}
                          locationName={shift.unitName}
                          fullAddress={shift.fullAddress}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm font-bold tabular-nums">
                      {formatProfissionalCurrency(shift.amountCents)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-center">
                        <AdminEscalaRepasseBadge
                          repasseRule={shift.repasseRule}
                          amountCents={shift.amountCents}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {shift.assignmentMode === 'open' ? (
                        <>
                          <p className="font-semibold text-emerald-700">
                            {shift.vacancies} / {shift.totalVacancies} vagas
                          </p>
                          <p className="mt-1 line-clamp-2 text-[10px] text-gray-500">{captures}</p>
                        </>
                      ) : (
                        <span className="text-gray-400">Titular definido</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={[
                          'inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1',
                          fillBadge.className,
                        ].join(' ')}
                      >
                        {fillBadge.label}
                      </span>
                    </td>
                    <td className="px-2 py-3 align-middle">
                      <div className="flex justify-center">
                        <AdminEscalaListaShiftActionsMenu
                          label={formatShiftMenuLabel(shift)}
                          open={openMenuId === shift.id}
                          canEdit={canEdit}
                          canDelete={canDelete}
                          canSuspend={canSuspend}
                          onToggle={() =>
                            onToggleMenu(openMenuId === shift.id ? null : shift.id)
                          }
                          onClose={() => onToggleMenu(null)}
                          onView={() => onView(shift)}
                          onEdit={() => onEdit(shift)}
                          onSuspend={() => onSuspend(shift)}
                          onDelete={() => onDelete(shift)}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
