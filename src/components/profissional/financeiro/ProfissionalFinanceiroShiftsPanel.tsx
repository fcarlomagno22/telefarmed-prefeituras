import { FileCheck2, Stethoscope } from 'lucide-react'
import type { ProfissionalBillingShift } from '../../../types/profissionalFinanceiro'
import { formatProfissionalCurrency } from '../../../utils/profissional/formatProfissionalCurrency'
import { ProfissionalFinanceiroShiftsTableSkeleton } from '../skeletons/ProfissionalFinanceiroShiftsTableSkeleton'
import {
  profissionalBillingStatusConfig,
  profissionalFinanceiroAlignedPanelClass,
} from './profissionalFinanceiroUi'

const STATUS_BADGE_WIDTH = 'w-[7.5rem]'

type ProfissionalFinanceiroShiftsPanelProps = {
  shifts: ProfissionalBillingShift[]
  isLoading?: boolean
  closureButtonLabel: string
  onOpenClosure: () => void
  tourHighlightClosureBtn?: boolean
}

function formatShiftDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatShiftTimeRange(startAt: string, endAt: string) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${formatter.format(new Date(startAt))}–${formatter.format(new Date(endAt))}`
}

function ShiftTurnCell({ shift }: { shift: ProfissionalBillingShift }) {
  return (
    <div className="text-center">
      <p className="font-medium text-gray-900">{shift.turnLabel}</p>
      <p className="mt-0.5 text-[11px] tabular-nums text-gray-500">
        {formatShiftTimeRange(shift.startAt, shift.endAt)}
      </p>
      <p className="mt-1 font-mono text-[10px] tracking-wide text-gray-500 md:hidden">
        {shift.escalaShiftId}
      </p>
    </div>
  )
}

function BillingStatusBadge({ status }: { status: ProfissionalBillingShift['status'] }) {
  const config = profissionalBillingStatusConfig[status]
  return (
    <span
      className={[
        'relative inline-flex h-8 items-center justify-center overflow-hidden rounded-lg bg-transparent px-2 pb-2 text-xs font-semibold',
        STATUS_BADGE_WIDTH,
        config.text,
        status === 'cancelado' ? 'line-through opacity-70' : '',
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

function ShiftsTableColGroup() {
  return (
    <colgroup>
      <col className="w-[18%] md:w-[14%]" />
      <col className="w-[38%] md:w-[24%]" />
      <col className="hidden md:table-column md:w-[26%]" />
      <col className="w-[22%] md:w-[18%]" />
      <col className="w-[22%] md:w-[18%]" />
    </colgroup>
  )
}

export function ProfissionalFinanceiroShiftsPanel({
  shifts,
  isLoading = false,
  closureButtonLabel,
  onOpenClosure,
  tourHighlightClosureBtn = false,
}: ProfissionalFinanceiroShiftsPanelProps) {
  return (
    <section className={profissionalFinanceiroAlignedPanelClass} data-tour="financeiro-shifts-panel">
      <div className="shrink-0 border-b border-gray-100 px-5 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900">Extrato da competência</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Consultas concluídas contabilizadas para repasse.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenClosure}
            {...(tourHighlightClosureBtn ? { 'data-tour': 'financeiro-closure-btn' } : {})}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            <FileCheck2 className="h-4 w-4 shrink-0" aria-hidden />
            {closureButtonLabel}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {isLoading ? (
          <ProfissionalFinanceiroShiftsTableSkeleton />
        ) : shifts.length === 0 ? (
          <EmptyShiftsState />
        ) : (
          <table className="w-full table-fixed border-collapse text-center">
            <ShiftsTableColGroup />
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 text-center sm:px-6">Data</th>
                <th className="px-3 py-3 text-center">Turno</th>
                <th className="hidden px-3 py-3 text-center md:table-cell">ID escala</th>
                <th className="px-3 py-3 text-center">Valor</th>
                <th className="px-5 py-3 text-center sm:px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {shifts.map((shift) => (
                <tr
                  key={shift.id}
                  className="align-middle text-sm text-gray-700 transition hover:bg-gray-50/80"
                >
                  <td className="px-5 py-3.5 text-center align-middle tabular-nums font-medium text-gray-900 sm:px-6">
                    {formatShiftDate(shift.startAt)}
                  </td>
                  <td className="px-3 py-3.5 text-center align-middle">
                    <ShiftTurnCell shift={shift} />
                  </td>
                  <td className="hidden px-3 py-3.5 text-center align-middle font-mono text-xs tracking-wide text-gray-600 md:table-cell">
                    {shift.escalaShiftId}
                  </td>
                  <td className="px-3 py-3.5 text-center align-middle font-semibold tabular-nums text-gray-900">
                    {shift.status === 'cancelado'
                      ? '—'
                      : formatProfissionalCurrency(shift.amountCents)}
                  </td>
                  <td className="px-5 py-3.5 text-center align-middle sm:px-6">
                    <div className="flex justify-center">
                      <BillingStatusBadge status={shift.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

function EmptyShiftsState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
      <Stethoscope className="h-8 w-8 text-gray-300" strokeWidth={1.5} />
      <p className="mt-3 text-sm font-semibold text-gray-700">Nenhuma consulta nesta competência</p>
      <p className="mt-1 max-w-sm text-xs text-gray-500">
        Consultas concluídas aparecem aqui para conferência e fechamento.
      </p>
    </div>
  )
}
