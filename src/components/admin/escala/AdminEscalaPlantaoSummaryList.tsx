import { MapPin, Monitor, Pencil, Trash2 } from 'lucide-react'
import { getSpecialtyById } from '../../../data/specialties'
import type { AdminEscalaProgrammingSlot } from '../../../types/adminEscala'
import { adminEscalaWeekdayOptions } from '../../../utils/adminEscala/buildClosedSchedule'
import { countScheduleDaysInRange } from '../../../utils/adminEscala/countScheduleDays'
import { isSingleDayEscalaPeriod, parseDateOnly } from '../../../utils/adminEscala/dateRange'
import { normalizeProgrammingSlot } from '../../../utils/adminEscala/repasseRule'
import { maskCurrencyBrl } from '../../../utils/masks'
import { getAdminEscalaDoctorLabel } from './adminEscalaUi'
import { AdminEscalaRepasseBadge } from './AdminEscalaRepasseBadge'

type AdminEscalaPlantaoSummaryListProps = {
  slots: AdminEscalaProgrammingSlot[]
  rangeStart: string
  rangeEnd: string
  onEdit: (slotId: string) => void
  onRemove: (slotId: string) => void
}

function formatWeekdays(weekdays: AdminEscalaProgrammingSlot['weekdays']) {
  if (weekdays.length === 0) return 'Nenhum dia'
  const sorted = [...weekdays].sort()
  const labels = sorted.map(
    (day) => adminEscalaWeekdayOptions.find((option) => option.value === day)?.short ?? '',
  )
  if (labels.join(',') === 'Seg,Ter,Qua,Qui,Sex') return 'Seg a sex'
  return labels.join(', ')
}

function formatAmount(cents: number) {
  if (!cents) return 'R$ 0,00'
  return maskCurrencyBrl(String(cents))
}

function formatSingleDateBr(iso: string) {
  const date = parseDateOnly(iso)
  if (!date) return iso
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function AdminEscalaPlantaoSummaryList({
  slots,
  rangeStart,
  rangeEnd,
  onEdit,
  onRemove,
}: AdminEscalaPlantaoSummaryListProps) {
  const singleDayPeriod = isSingleDayEscalaPeriod(rangeStart, rangeEnd)

  if (slots.length === 0) {
    return (
      <div className="flex h-full min-h-[20rem] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-[#f8f9fb] px-6 text-center">
        <p className="text-sm font-semibold text-gray-800">Plantões adicionados</p>
        <p className="mt-2 max-w-[16rem] text-sm text-gray-500">
          Preencha o formulário ao lado e clique em adicionar para montar a escala.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="mb-1">
        <p className="text-sm font-bold text-gray-900">Plantões adicionados</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {slots.length} configuraç{slots.length === 1 ? 'ão' : 'ões'} na escala
        </p>
      </div>

      {slots.map((slot, index) => {
        const safeSlot = normalizeProgrammingSlot(slot)
        const specialtyName = getSpecialtyById(safeSlot.specialtyId)?.name ?? 'Especialidade'
        const shiftCount = countScheduleDaysInRange(rangeStart, rangeEnd, safeSlot.weekdays)
        const isPresencial = safeSlot.modality === 'presencial_ubt' || safeSlot.modality === 'hibrido'
        const isOpen = safeSlot.assignmentMode === 'open'

        return (
          <article
            key={slot.id}
            className="rounded-xl bg-white p-4 ring-1 ring-gray-200/80 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500">
                  Plantão {index + 1}
                </p>
                <p className="mt-0.5 truncate text-sm font-bold text-gray-900">{specialtyName}</p>
                {shiftCount > 0 ? (
                  <p className="mt-0.5 text-xs font-semibold text-[var(--brand-primary)]">
                    {shiftCount} plantão{shiftCount === 1 ? '' : 's'} no período
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(slot.id)}
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  aria-label={`Editar ${specialtyName}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(slot.id)}
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label={`Excluir ${specialtyName}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <dl className="mt-3 space-y-2 text-xs text-gray-600">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <div>
                  <dt className="font-semibold text-gray-500">
                    {singleDayPeriod ? 'Data' : 'Dias'}
                  </dt>
                  <dd className="font-medium text-gray-800">
                    {singleDayPeriod
                      ? formatSingleDateBr(rangeStart)
                      : formatWeekdays(slot.weekdays)}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-500">Horário</dt>
                  <dd className="font-medium text-gray-800">
                    {slot.dailyStart} – {slot.dailyEnd}
                  </dd>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={[
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold',
                    isPresencial
                      ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-100'
                      : 'bg-gray-100 text-gray-700 ring-1 ring-gray-200/80',
                  ].join(' ')}
                >
                  {isPresencial ? (
                    <MapPin className="h-3 w-3" />
                  ) : (
                    <Monitor className="h-3 w-3" />
                  )}
                  {isPresencial ? 'Presencial' : 'Virtual'}
                </span>
                <span className="font-semibold text-gray-800">{formatAmount(slot.amountCents)}</span>
                {isOpen ? (
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-primary)] ring-1 ring-orange-100">
                    {safeSlot.vacancies} vaga{safeSlot.vacancies === 1 ? '' : 's'}/plantão
                    {shiftCount > 1 ? ` · ${shiftCount * safeSlot.vacancies} total` : ''}
                  </span>
                ) : null}
                <AdminEscalaRepasseBadge
                  repasseRule={safeSlot.repasseRule}
                  amountCents={safeSlot.amountCents}
                />
                {isOpen ? null : (
                  <span className="text-gray-500">
                    · {getAdminEscalaDoctorLabel(slot.primaryDoctorId)}
                  </span>
                )}
              </div>

              {isPresencial && slot.fullAddress ? (
                <div>
                  <dt className="font-semibold text-gray-500">Local</dt>
                  <dd className="font-medium text-gray-800">{slot.fullAddress}</dd>
                </div>
              ) : null}
            </dl>
          </article>
        )
      })}
    </div>
  )
}
