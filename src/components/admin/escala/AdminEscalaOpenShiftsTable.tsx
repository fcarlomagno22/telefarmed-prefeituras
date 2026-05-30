import { Stethoscope } from 'lucide-react'
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

const thClass =
  'px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500'

type AdminEscalaOpenShiftsTableProps = {
  shifts: AdminEscalaShift[]
}

export function AdminEscalaOpenShiftsTable({ shifts }: AdminEscalaOpenShiftsTableProps) {
  return (
    <section className={profissionalEscalaShiftsPanelClass} aria-label="Plantões da escala">
      <header className="shrink-0 border-b border-gray-100 px-5 py-3.5 sm:px-6">
        <h2 className="text-sm font-bold text-gray-900">Plantões encontrados</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          {shifts.length} resultado{shifts.length === 1 ? '' : 's'}
        </p>
      </header>

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
          <table className="w-full min-w-[58rem] table-fixed border-collapse text-center">
            <colgroup>
              <col className="w-[4.75rem]" />
              <col className="w-[12%]" />
              <col className="w-[16%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[14%]" />
              <col className="w-[9%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
              <tr>
                <th className={thClass}>Data</th>
                <th className={thClass}>Horário</th>
                <th className={thClass}>Plantão</th>
                <th className={thClass}>Modalidade</th>
                <th className={thClass}>Modo</th>
                <th className={thClass}>Cidade</th>
                <th className={thClass}>Valor</th>
                <th className={thClass}>Vagas / capturas</th>
                <th className={thClass}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {shifts.map((shift) => {
                const date = formatProfissionalEscalaCardDate(shift.startAt)
                const fillBadge = buildAdminEscalaFillStatusBadge(shift)
                const modeLabel =
                  shift.assignmentMode === 'open' ? 'Aberto' : 'Atribuído'
                const captures =
                  shift.claimedCaptures.length > 0
                    ? shift.claimedCaptures.map((c) => c.doctorName).join(', ')
                    : '—'

                return (
                  <tr
                    key={shift.id}
                    className="align-middle text-sm text-gray-700 hover:bg-orange-50/35"
                  >
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
