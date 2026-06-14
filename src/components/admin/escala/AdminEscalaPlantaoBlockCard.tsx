import { MapPin, Monitor, Trash2 } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { getSpecialtyById } from '../../../data/specialties'
import type { AdminEscalaProgrammingSlot, AdminEscalaUbtScope } from '../../../types/adminEscala'
import {
  adminEscalaWeekdayOptions,
  defaultClosedWeekdays,
  type AdminEscalaWeekday,
} from '../../../utils/adminEscala/buildClosedSchedule'
import { countScheduleDaysInRange } from '../../../utils/adminEscala/countScheduleDays'
import { isSingleDayEscalaPeriod } from '../../../utils/adminEscala/dateRange'
import { getDoctorsForEscalaSpecialty } from '../../../utils/adminEscala/doctorsForSpecialty'
import { normalizeProgrammingSlot } from '../../../utils/adminEscala/repasseRule'
import { maskCurrencyBrl } from '../../../utils/masks'
import { CustomSelect } from '../../ui/CustomSelect'
import { AdminEscalaBackupQueueEditor } from './AdminEscalaBackupQueueEditor'
import { AdminEscalaRepasseBadge } from './AdminEscalaRepasseBadge'
import { AdminEscalaRepasseRuleSection } from './AdminEscalaRepasseRuleSection'
import {
  AdminEscalaPresencialLocationFields,
  applyPresencialLocationFromUbtScope,
} from './AdminEscalaPresencialLocationFields'
import {
  escalaComposeInputClass,
  escalaComposeSegmentBtn,
  escalaComposeSegmentClass,
} from './adminEscalaComposePremium'

function formatAmountCentsInput(cents: number) {
  if (!cents) return ''
  return maskCurrencyBrl(String(cents))
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-sm font-semibold text-gray-800">{children}</p>
}

type AdminEscalaPlantaoBlockCardProps = {
  slot: AdminEscalaProgrammingSlot
  index?: number
  title?: string
  rangeStart: string
  rangeEnd: string
  specialtyOptions: { value: string; label: string }[]
  ubtScope: AdminEscalaUbtScope
  onChange: (patch: Partial<AdminEscalaProgrammingSlot>) => void
  onRemove?: () => void
  repasseReadOnly?: boolean
}

export function AdminEscalaPlantaoBlockCard({
  slot,
  index = 0,
  title,
  rangeStart,
  rangeEnd,
  specialtyOptions,
  ubtScope,
  onChange,
  onRemove,
  repasseReadOnly = false,
}: AdminEscalaPlantaoBlockCardProps) {
  const safeSlot = normalizeProgrammingSlot(slot)
  const [showDoctorFields, setShowDoctorFields] = useState(safeSlot.assignmentMode === 'assigned')
  const singleDayPeriod = isSingleDayEscalaPeriod(rangeStart, rangeEnd)
  const shiftCount = countScheduleDaysInRange(rangeStart, rangeEnd, safeSlot.weekdays)
  const isOpen = safeSlot.assignmentMode === 'open'
  const isPresencial = safeSlot.modality === 'presencial_ubt' || safeSlot.modality === 'hibrido'

  const doctorOptions = useMemo(
    () => getDoctorsForEscalaSpecialty(safeSlot.specialtyId),
    [safeSlot.specialtyId],
  )
  const specialtyName = getSpecialtyById(safeSlot.specialtyId)?.name ?? 'esta especialidade'

  function toggleWeekday(day: AdminEscalaWeekday) {
    const weekdays = safeSlot.weekdays.includes(day)
      ? safeSlot.weekdays.filter((d) => d !== day)
      : ([...safeSlot.weekdays, day].sort() as AdminEscalaWeekday[])
    onChange({ weekdays })
  }

  function setVirtual(presencial: boolean) {
    if (!presencial) {
      onChange({ modality: 'tele', fullAddress: null })
      return
    }
    onChange({
      modality: 'presencial_ubt',
      ...applyPresencialLocationFromUbtScope(ubtScope, slot),
    })
  }

  const cardTitle = title ?? (index === 0 ? 'Plantão principal' : `Plantão ${index + 1}`)
  const showLegacyAmountField = safeSlot.repasseRule.modalidade !== 'por_consulta'
  const openVacanciesTotal = isOpen ? shiftCount * safeSlot.vacancies : 0

  function patchSlot(patch: Partial<AdminEscalaProgrammingSlot>) {
    onChange(patch)
  }

  return (
    <div className="rounded-xl bg-[#f8f9fb] p-5 ring-1 ring-gray-200/70 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500">{cardTitle}</p>
          {shiftCount > 0 ? (
            <p className="mt-0.5 text-sm font-bold text-[var(--brand-primary)]">
              {shiftCount} plantão{shiftCount === 1 ? '' : 's'} no período
              {isOpen && safeSlot.vacancies > 0 ? (
                <span className="font-semibold text-gray-600">
                  {' '}
                  · {openVacanciesTotal} vaga{openVacanciesTotal === 1 ? '' : 's'} no total
                </span>
              ) : null}
            </p>
          ) : singleDayPeriod ? (
            <p className="mt-0.5 text-sm text-gray-600">1 plantão na data selecionada</p>
          ) : (
            <p className="mt-0.5 text-sm text-amber-700">Marque os dias da semana</p>
          )}
          <div className="mt-1">
            <AdminEscalaRepasseBadge
              repasseRule={safeSlot.repasseRule}
              amountCents={safeSlot.amountCents}
              size="sm"
            />
          </div>
        </div>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
            aria-label="Remover plantão"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="space-y-5">
        <div>
          <FieldLabel>Especialidade</FieldLabel>
          <CustomSelect
            value={slot.specialtyId}
            onChange={(value) => {
              const doctors = getDoctorsForEscalaSpecialty(value)
              const primaryStillValid = doctors.some((d) => d.value === slot.primaryDoctorId)
              const backupDoctorIds = slot.backupDoctorIds.filter((id) =>
                doctors.some((d) => d.value === id),
              )
              onChange({
                specialtyId: value,
                primaryDoctorId: primaryStillValid ? slot.primaryDoctorId : doctors[0]?.value ?? '',
                backupDoctorIds,
              })
            }}
            options={specialtyOptions}
          />
        </div>

        {singleDayPeriod ? null : (
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <FieldLabel>Dias da semana</FieldLabel>
              <button
                type="button"
                onClick={() => onChange({ weekdays: [...defaultClosedWeekdays] })}
                className="text-xs font-bold text-[var(--brand-primary)] hover:underline"
              >
                Seg a sex
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {adminEscalaWeekdayOptions.map((day) => {
                const on = slot.weekdays.includes(day.value)
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekday(day.value)}
                    title={day.label}
                    className={[
                      'rounded-lg py-2 text-xs font-bold transition',
                      on
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200/80 hover:bg-gray-100',
                    ].join(' ')}
                  >
                    {day.short}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Das</FieldLabel>
            <input
              type="time"
              value={slot.dailyStart}
              onChange={(e) => onChange({ dailyStart: e.target.value })}
              className={escalaComposeInputClass}
            />
          </div>
          <div>
            <FieldLabel>Até</FieldLabel>
            <input
              type="time"
              value={slot.dailyEnd}
              onChange={(e) => onChange({ dailyEnd: e.target.value })}
              className={escalaComposeInputClass}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Tipo de atendimento</FieldLabel>
          <div className={`${escalaComposeSegmentClass} grid w-full grid-cols-2`}>
            <button
              type="button"
              onClick={() => setVirtual(false)}
              className={[
                escalaComposeSegmentBtn(slot.modality === 'tele'),
                'inline-flex items-center justify-center gap-2 py-2.5',
              ].join(' ')}
            >
              <Monitor className="h-4 w-4" />
              Virtual
            </button>
            <button
              type="button"
              onClick={() => setVirtual(true)}
              className={[
                escalaComposeSegmentBtn(isPresencial),
                'inline-flex items-center justify-center gap-2 py-2.5',
              ].join(' ')}
            >
              <MapPin className="h-4 w-4" />
              Presencial
            </button>
          </div>
        </div>

        {isPresencial ? (
          <AdminEscalaPresencialLocationFields
            values={slot}
            onChange={onChange}
            inputClass={escalaComposeInputClass}
            ubtScope={ubtScope}
          />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {showLegacyAmountField ? (
            <div>
              <FieldLabel>Valor por plantão</FieldLabel>
              <input
                type="text"
                inputMode="numeric"
                value={formatAmountCentsInput(slot.amountCents)}
                readOnly={repasseReadOnly}
                onChange={(e) => {
                  if (repasseReadOnly) return
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
                  const amountCents = digits ? Number(digits) : 0
                  patchSlot({
                    amountCents,
                    repasseRule: {
                      ...safeSlot.repasseRule,
                      valorPlantaoCentavos: amountCents,
                    },
                  })
                }}
                className={[
                  escalaComposeInputClass,
                  repasseReadOnly ? 'cursor-not-allowed bg-slate-100 text-slate-600' : '',
                ].join(' ')}
                placeholder="R$ 0,00"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white/70 px-3 py-3 text-xs text-gray-600">
              Repasse por consulta — o valor unitário está na regra abaixo.
            </div>
          )}
          <div>
            <FieldLabel>Vagas por plantão</FieldLabel>
            <input
              type="number"
              min={1}
              value={safeSlot.vacancies}
              disabled={!isOpen}
              onChange={(e) =>
                onChange({ vacancies: Math.max(1, Number(e.target.value) || 1) })
              }
              className={[
                escalaComposeInputClass,
                !isOpen ? 'cursor-not-allowed opacity-50' : '',
              ].join(' ')}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              {isOpen
                ? shiftCount > 1
                  ? `Cada um dos ${shiftCount} plantões do período terá ${safeSlot.vacancies} vaga${safeSlot.vacancies === 1 ? '' : 's'} (${openVacanciesTotal} no total).`
                  : 'Profissionais se inscrevem no portal para ocupar esta vaga.'
                : 'Disponível quando o plantão está aberto no portal.'}
            </p>
          </div>
        </div>

        <AdminEscalaRepasseRuleSection
          repasseRule={safeSlot.repasseRule}
          amountCents={safeSlot.amountCents}
          readOnly={repasseReadOnly}
          onChange={({ repasseRule, amountCents: nextAmountCents }) => {
            patchSlot({
              repasseRule,
              ...(nextAmountCents != null ? { amountCents: nextAmountCents } : {}),
            })
          }}
        />

        <div className="border-t border-gray-100 pt-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={!isOpen}
              onChange={(e) => {
                const assigned = e.target.checked
                if (assigned) {
                  const doctors = getDoctorsForEscalaSpecialty(slot.specialtyId)
                  onChange({
                    assignmentMode: 'assigned',
                    primaryDoctorId:
                      slot.primaryDoctorId && doctors.some((d) => d.value === slot.primaryDoctorId)
                        ? slot.primaryDoctorId
                        : doctors[0]?.value ?? '',
                    backupDoctorIds: slot.backupDoctorIds.filter((id) =>
                      doctors.some((d) => d.value === id),
                    ),
                  })
                  setShowDoctorFields(true)
                } else {
                  onChange({
                    assignmentMode: 'open',
                    primaryDoctorId: '',
                    backupDoctorIds: [],
                    vacancies: safeSlot.vacancies > 0 ? safeSlot.vacancies : 1,
                  })
                  setShowDoctorFields(false)
                }
              }}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
            />
            <span>
              <span className="text-sm font-semibold text-gray-900">Definir médico titular</span>
              <span className="mt-0.5 block text-xs text-gray-500">
                Desmarcado = plantão aberto para inscrição no portal (padrão).
              </span>
            </span>
          </label>

          {!isOpen && showDoctorFields ? (
            <div className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4">
              <div>
                <FieldLabel>Médico titular</FieldLabel>
                {doctorOptions.length > 0 ? (
                  <CustomSelect
                    value={slot.primaryDoctorId}
                    onChange={(value) =>
                      onChange({
                        primaryDoctorId: value,
                        backupDoctorIds: slot.backupDoctorIds.filter((id) => id !== value),
                      })
                    }
                    options={doctorOptions.map((d) => ({
                      value: d.value,
                      label: d.label,
                    }))}
                  />
                ) : (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                    Nenhum médico de {specialtyName} disponível na escala.
                  </p>
                )}
              </div>
              <AdminEscalaBackupQueueEditor
                variant="premium"
                specialtyId={slot.specialtyId}
                primaryDoctorId={slot.primaryDoctorId}
                backupDoctorIds={slot.backupDoctorIds}
                onBackupDoctorIdsChange={(backupDoctorIds) => onChange({ backupDoctorIds })}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
