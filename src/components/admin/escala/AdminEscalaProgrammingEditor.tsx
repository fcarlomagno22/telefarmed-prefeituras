import { Plus, Trash2 } from 'lucide-react'
import { getSpecialtyById } from '../../../data/specialties'
import type { AdminEscalaProgrammingSlot } from '../../../types/adminEscala'
import {
  adminEscalaWeekdayOptions,
  defaultClosedWeekdays,
  type AdminEscalaWeekday,
} from '../../../utils/adminEscala/buildClosedSchedule'
import { countScheduleDaysInRange } from '../../../utils/adminEscala/countScheduleDays'
import { createDefaultProgrammingSlot } from '../../../utils/adminEscala/createDefaultProgrammingSlot'
import { getDoctorsForEscalaSpecialty } from '../../../utils/adminEscala/doctorsForSpecialty'
import { CustomSelect } from '../../ui/CustomSelect'
import { AdminEscalaBackupQueueEditor } from './AdminEscalaBackupQueueEditor'
import {
  escalaComposeCardClass,
  escalaComposeInputClass,
  escalaComposeLabelClass,
} from './adminEscalaComposePremium'
import { getAdminEscalaDoctorLabel } from './adminEscalaUi'

type AdminEscalaProgrammingEditorProps = {
  specialtyIds: string[]
  rangeStart: string
  rangeEnd: string
  onRangeStartChange: (value: string) => void
  onRangeEndChange: (value: string) => void
  slots: AdminEscalaProgrammingSlot[]
  onSlotsChange: (slots: AdminEscalaProgrammingSlot[]) => void
}

export function AdminEscalaProgrammingEditor({
  specialtyIds,
  rangeStart,
  rangeEnd,
  onRangeStartChange,
  onRangeEndChange,
  slots,
  onSlotsChange,
}: AdminEscalaProgrammingEditorProps) {
  const periodDays =
    rangeStart && rangeEnd && slots[0]?.weekdays.length
      ? countScheduleDaysInRange(rangeStart, rangeEnd, slots[0].weekdays)
      : 0

  function updateSlot(slotId: string, patch: Partial<AdminEscalaProgrammingSlot>) {
    onSlotsChange(slots.map((s) => (s.id === slotId ? { ...s, ...patch } : s)))
  }

  function removeSlot(slotId: string) {
    onSlotsChange(slots.filter((s) => s.id !== slotId))
  }

  function addSlot(specialtyId: string) {
    onSlotsChange([...slots, createDefaultProgrammingSlot(specialtyId)])
  }

  function toggleWeekday(slotId: string, day: AdminEscalaWeekday) {
    const slot = slots.find((s) => s.id === slotId)
    if (!slot) return
    const weekdays = slot.weekdays.includes(day)
      ? slot.weekdays.filter((d) => d !== day)
      : ([...slot.weekdays, day].sort() as AdminEscalaWeekday[])
    updateSlot(slotId, { weekdays })
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className={[escalaComposeCardClass, 'p-6 sm:p-8'].join(' ')}>
        <p className="text-sm font-bold text-gray-900">Período da escala</p>
        <p className="mt-0.5 text-xs text-gray-500">
          Todas as programações abaixo repetem-se entre estas datas.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={escalaComposeLabelClass}>Data inicial</label>
            <input
              type="date"
              value={rangeStart}
              onChange={(e) => onRangeStartChange(e.target.value)}
              className={escalaComposeInputClass}
            />
          </div>
          <div>
            <label className={escalaComposeLabelClass}>Data final</label>
            <input
              type="date"
              value={rangeEnd}
              onChange={(e) => onRangeEndChange(e.target.value)}
              className={escalaComposeInputClass}
            />
          </div>
        </div>
        {periodDays > 0 ? (
          <p className="mt-3 text-sm font-medium text-[var(--brand-primary)]">
            Até {periodDays} dias no intervalo (conforme dias marcados em cada bloco)
          </p>
        ) : null}
      </div>

      {specialtyIds.length === 0 ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-6 text-center text-sm text-amber-900 ring-1 ring-amber-200/80">
          Volte à etapa anterior e selecione ao menos uma especialidade.
        </p>
      ) : null}

      {specialtyIds.map((specialtyId) => {
        const specialtyName = getSpecialtyById(specialtyId)?.name ?? 'Especialidade'
        const specialtySlots = slots.filter((s) => s.specialtyId === specialtyId)
        const doctorOptions = getDoctorsForEscalaSpecialty(specialtyId)

        return (
          <section key={specialtyId} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-bold text-gray-900">{specialtyName}</h4>
                <p className="text-xs text-gray-500">
                  Adicione um ou mais médicos — no mesmo horário ou em turnos diferentes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => addSlot(specialtyId)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                Adicionar médico
              </button>
            </div>

            {specialtySlots.length === 0 ? (
              <p className="rounded-xl bg-gray-50 px-4 py-5 text-center text-sm text-gray-500 ring-1 ring-gray-200/70">
                Nenhum médico programado — clique em &quot;Adicionar médico&quot;.
              </p>
            ) : null}

            {specialtySlots.map((slot, index) => {
              const slotDays = countScheduleDaysInRange(
                rangeStart,
                rangeEnd,
                slot.weekdays,
              )

              return (
                <article
                  key={slot.id}
                  className={[escalaComposeCardClass, 'space-y-5 p-5 sm:p-6'].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        Médico {index + 1}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-800">
                        {getAdminEscalaDoctorLabel(slot.primaryDoctorId)}
                        {slotDays > 0 ? (
                          <span className="ml-2 text-xs font-medium text-gray-400">
                            · {slotDays} plantão{slotDays === 1 ? '' : 's'}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSlot(slot.id)}
                      disabled={specialtySlots.length <= 1}
                      title={
                        specialtySlots.length <= 1
                          ? 'Cada especialidade precisa de ao menos um médico'
                          : 'Remover este bloco'
                      }
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Remover bloco"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className={escalaComposeLabelClass}>Início</label>
                      <input
                        type="time"
                        value={slot.dailyStart}
                        onChange={(e) => updateSlot(slot.id, { dailyStart: e.target.value })}
                        className={escalaComposeInputClass}
                      />
                    </div>
                    <div>
                      <label className={escalaComposeLabelClass}>Fim</label>
                      <input
                        type="time"
                        value={slot.dailyEnd}
                        onChange={(e) => updateSlot(slot.id, { dailyEnd: e.target.value })}
                        className={escalaComposeInputClass}
                      />
                    </div>
                    <div>
                      <label className={escalaComposeLabelClass}>Modalidade</label>
                      <CustomSelect
                        value={slot.modality}
                        onChange={(value) =>
                          updateSlot(slot.id, {
                            modality: value as AdminEscalaProgrammingSlot['modality'],
                          })
                        }
                        options={[
                          { value: 'tele', label: 'Telemedicina' },
                          { value: 'hibrido', label: 'Híbrido' },
                          { value: 'presencial_ubt', label: 'Presencial na UBT' },
                        ]}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <label className={escalaComposeLabelClass}>Dias da semana</label>
                      <button
                        type="button"
                        onClick={() => updateSlot(slot.id, { weekdays: defaultClosedWeekdays })}
                        className="text-xs font-bold text-[var(--brand-primary)] hover:underline"
                      >
                        Seg–Sex
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {adminEscalaWeekdayOptions.map((day) => {
                        const on = slot.weekdays.includes(day.value)
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleWeekday(slot.id, day.value)}
                            title={day.label}
                            className={[
                              'rounded-xl py-2.5 text-xs font-bold transition',
                              on
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-50 text-gray-600 ring-1 ring-gray-200/80 hover:bg-gray-100',
                            ].join(' ')}
                          >
                            {day.short}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className={escalaComposeLabelClass}>Médico titular</label>
                    <CustomSelect
                      value={slot.primaryDoctorId}
                      onChange={(value) => {
                        updateSlot(slot.id, {
                          primaryDoctorId: value,
                          backupDoctorIds: slot.backupDoctorIds.filter((id) => id !== value),
                        })
                      }}
                      options={doctorOptions.map((d) => ({
                        value: d.value,
                        label: d.label,
                      }))}
                    />
                  </div>

                  <AdminEscalaBackupQueueEditor
                    variant="premium"
                    specialtyId={specialtyId}
                    primaryDoctorId={slot.primaryDoctorId}
                    backupDoctorIds={slot.backupDoctorIds}
                    onBackupDoctorIdsChange={(backupDoctorIds) =>
                      updateSlot(slot.id, { backupDoctorIds })
                    }
                  />
                </article>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
