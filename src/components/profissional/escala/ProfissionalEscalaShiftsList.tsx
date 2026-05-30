import { HandMetal, Stethoscope } from 'lucide-react'
import { PROFISSIONAL_ESCALA_TOUR_DEMO_SHIFT_ID } from '../../../config/profissionalEscalaTour'
import type { ProfissionalEscalaDisponivel } from '../../../types/profissionalEscalaDisponivel'
import { PROFISSIONAL_TELEMEDICINE_LABEL } from '../../../config/profissionalConfig'
import { ProfissionalEscalaCityTooltip } from './ProfissionalEscalaCityTooltip'
import { formatProfissionalCurrency } from '../../../utils/profissional/formatProfissionalCurrency'
import {
  formatProfissionalEscalaCardDate,
  formatProfissionalEscalaDurationLabel,
  formatProfissionalEscalaTimeRange,
  modalityIcon,
  profissionalEscalaShiftsPanelClass,
} from './profissionalEscalaUi'

const thClass =
  'px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500'

type ProfissionalEscalaShiftsListProps = {
  shifts: ProfissionalEscalaDisponivel[]
  onClaim: (shift: ProfissionalEscalaDisponivel) => void
  tourHighlightCity?: boolean
  tourSuppressCityTooltip?: boolean
}

function ShiftsTableColGroup() {
  return (
    <colgroup>
      <col className="w-[4.75rem]" />
      <col className="w-[13%]" />
      <col className="w-[20%]" />
      <col className="w-[11%]" />
      <col className="w-[12%]" />
      <col className="w-[11%]" />
      <col className="w-[9.5rem]" />
    </colgroup>
  )
}

function EscalaDateCell({ startAt }: { startAt: string }) {
  const { day, month, weekday } = formatProfissionalEscalaCardDate(startAt)
  return (
    <div className="mx-auto flex h-[4.25rem] w-[4.25rem] flex-col items-center justify-center rounded-xl border border-gray-200 bg-slate-50">
      <span className="text-lg font-bold leading-none tabular-nums text-gray-900">{day}</span>
      <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--brand-primary)]">
        {month}
      </span>
      <span className="mt-0.5 text-[9px] font-semibold capitalize text-gray-500">{weekday}</span>
    </div>
  )
}

function EscalaHorarioCell({ shift }: { shift: ProfissionalEscalaDisponivel }) {
  return (
    <div className="mx-auto max-w-[9rem] text-center">
      <p className="text-sm font-semibold tabular-nums text-gray-900">
        {formatProfissionalEscalaTimeRange(shift.startAt, shift.endAt)}
      </p>
      <p className="mt-0.5 text-[11px] text-gray-500">
        {formatProfissionalEscalaDurationLabel(shift)} · {shift.turnLabel}
      </p>
    </div>
  )
}

function EscalaPlantaoCell({ shift }: { shift: ProfissionalEscalaDisponivel }) {
  const subtitle =
    shift.modality === 'tele' ? PROFISSIONAL_TELEMEDICINE_LABEL : shift.unitName

  return (
    <div className="mx-auto max-w-[12rem] text-center">
      <p className="truncate text-sm font-semibold text-gray-900">{shift.specialty}</p>
      <p className="mt-0.5 truncate text-[11px] text-gray-500">{subtitle}</p>
    </div>
  )
}

function EscalaModalityCell({ shift }: { shift: ProfissionalEscalaDisponivel }) {
  const ModalityIcon = modalityIcon(shift.modality)
  return (
    <span className="inline-flex items-center justify-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-700">
      <ModalityIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
      {shift.modalityLabel}
    </span>
  )
}

function EscalaCityCell({
  shift,
  tourHighlightCity,
  tourSuppressCityTooltip,
}: {
  shift: ProfissionalEscalaDisponivel
  tourHighlightCity?: boolean
  tourSuppressCityTooltip?: boolean
}) {
  if (shift.modality !== 'presencial') {
    return <span className="text-xs text-gray-400">—</span>
  }

  const displayCity = shift.city?.trim() || shift.municipalityName?.trim() || shift.cityUf

  if (!shift.fullAddress) {
    return <span className="text-sm font-semibold text-gray-800">{displayCity}</span>
  }

  return (
    <div className="flex justify-center">
      <ProfissionalEscalaCityTooltip
        city={displayCity}
        locationName={shift.unitName}
        fullAddress={shift.fullAddress}
        tourPinned={tourHighlightCity && shift.id === PROFISSIONAL_ESCALA_TOUR_DEMO_SHIFT_ID}
        tourSuppress={tourSuppressCityTooltip}
        dataTour={
          shift.id === PROFISSIONAL_ESCALA_TOUR_DEMO_SHIFT_ID ? 'escala-city-tooltip' : undefined
        }
      />
    </div>
  )
}

function EscalaValorCell({ shift }: { shift: ProfissionalEscalaDisponivel }) {
  const canClaim = shift.status === 'disponivel' && shift.vacancies > 0
  return (
    <div className="text-center">
      <p className="text-sm font-bold tabular-nums text-gray-900">
        {formatProfissionalCurrency(shift.amountCents)}
      </p>
      {canClaim ? (
        <p className="mt-0.5 text-[11px] font-semibold text-emerald-600">
          {shift.vacancies} vaga{shift.vacancies === 1 ? '' : 's'}
        </p>
      ) : (
        <p className="mt-0.5 text-[11px] font-medium text-gray-400">Reservado</p>
      )}
    </div>
  )
}

function EscalaActionCell({
  shift,
  onClaim,
}: {
  shift: ProfissionalEscalaDisponivel
  onClaim: (shift: ProfissionalEscalaDisponivel) => void
}) {
  const canClaim = shift.status === 'disponivel' && shift.vacancies > 0
  if (!canClaim) {
    return <span className="text-xs text-gray-300">—</span>
  }

  return (
    <button
      type="button"
      onClick={() => onClaim(shift)}
      data-tour={
        shift.id === PROFISSIONAL_ESCALA_TOUR_DEMO_SHIFT_ID ? 'escala-claim-btn' : undefined
      }
      className="inline-flex w-full max-w-[9.5rem] items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-primary)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-105 active:brightness-95"
    >
      <HandMetal className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
      Pegar plantão
    </button>
  )
}

export function ProfissionalEscalaShiftsList({
  shifts,
  onClaim,
  tourHighlightCity = false,
  tourSuppressCityTooltip = false,
}: ProfissionalEscalaShiftsListProps) {
  return (
    <section
      data-tour="escala-shifts-list"
      className={profissionalEscalaShiftsPanelClass}
      aria-label="Plantões encontrados"
    >
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
              Ajuste os filtros ou o período e busque novamente.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[52rem] table-fixed border-collapse text-center">
            <ShiftsTableColGroup />
            <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
              <tr>
                <th className={thClass}>Data</th>
                <th className={thClass}>Horário</th>
                <th className={thClass}>Plantão</th>
                <th className={thClass}>Modalidade</th>
                <th className={thClass}>Cidade</th>
                <th className={thClass}>Valor</th>
                <th className={thClass}>Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {shifts.map((shift) => (
                <tr
                  key={shift.id}
                  className="align-middle text-sm text-gray-700 transition hover:bg-orange-50/35"
                >
                  <td className="px-3 py-3 align-middle sm:px-4">
                    <EscalaDateCell startAt={shift.startAt} />
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <EscalaHorarioCell shift={shift} />
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <EscalaPlantaoCell shift={shift} />
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <EscalaModalityCell shift={shift} />
                  </td>
                  <td className="relative overflow-visible px-3 py-3 align-middle">
                    <EscalaCityCell
                      shift={shift}
                      tourHighlightCity={tourHighlightCity}
                      tourSuppressCityTooltip={tourSuppressCityTooltip}
                    />
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <EscalaValorCell shift={shift} />
                  </td>
                  <td className="px-3 py-3 align-middle sm:px-4">
                    <div className="flex justify-center">
                      <EscalaActionCell shift={shift} onClaim={onClaim} />
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
