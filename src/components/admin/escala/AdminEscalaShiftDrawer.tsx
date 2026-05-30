import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { adminEscalaDoctorOptions } from '../../../data/adminEscalaMock'
import type { AdminEscalaScheduleMode, AdminEscalaShift, AdminEscalaShiftStatus } from '../../../types/adminEscala'
import {
  adminEscalaWeekdayOptions,
  buildClosedScheduleShifts,
  countClosedScheduleDays,
  defaultClosedWeekdays,
  type AdminEscalaWeekday,
} from '../../../utils/adminEscala/buildClosedSchedule'
import { CustomSelect } from '../../ui/CustomSelect'
import { AdminEscalaScopeFields } from './AdminEscalaScopeFields'
import {
  findDoctorScheduleConflicts,
  findDoctorScheduleConflictsForShifts,
  formatAdminEscalaScopeSummary,
  getAdminEscalaDoctorLabel,
} from './adminEscalaUi'

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

function toDatetimeLocalValue(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromDatetimeLocalValue(value: string) {
  if (!value) return new Date().toISOString()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function toDateInputValue(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function toTimeInputValue(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '08:00'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function defaultClosedRange() {
  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + 6)
  return { start: toDateInputValue(start.toISOString()), end: toDateInputValue(end.toISOString()) }
}

function createEmptyShift(): AdminEscalaShift {
  const now = new Date()
  const start = new Date(now)
  start.setHours(8, 0, 0, 0)
  const end = new Date(now)
  end.setHours(14, 0, 0, 0)
  const stamp = now.toISOString()
  return {
    id: `esc-${Date.now()}`,
    primaryDoctorId: adminEscalaDoctorOptions[0]?.value ?? '1',
    backupDoctorIds: [],
    specialty: adminEscalaDoctorOptions[0]?.specialty ?? 'Clínico Geral',
    modality: 'tele',
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    prefeituraScope: { mode: 'selected', prefeituraIds: ['cli-bsb'] },
    ubtScope: { mode: 'all', ubtIds: [] },
    status: 'rascunho',
    notes: '',
    createdAt: stamp,
    updatedAt: stamp,
  }
}

type AdminEscalaShiftDrawerProps = {
  open: boolean
  closing: boolean
  editingShift: AdminEscalaShift | null
  editingBatch: AdminEscalaShift[] | null
  allShifts: AdminEscalaShift[]
  onClose: () => void
  onTransitionEnd: () => void
  onSave: (shift: AdminEscalaShift) => void
  onSaveMany: (shifts: AdminEscalaShift[], options?: { replaceBatchId?: string }) => void
}

export function AdminEscalaShiftDrawer({
  open,
  closing,
  editingShift,
  editingBatch,
  allShifts,
  onClose,
  onTransitionEnd,
  onSave,
  onSaveMany,
}: AdminEscalaShiftDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [draft, setDraft] = useState<AdminEscalaShift>(() => createEmptyShift())
  const [scheduleMode, setScheduleMode] = useState<AdminEscalaScheduleMode>('single')
  const [closedRangeStart, setClosedRangeStart] = useState(() => defaultClosedRange().start)
  const [closedRangeEnd, setClosedRangeEnd] = useState(() => defaultClosedRange().end)
  const [dailyStart, setDailyStart] = useState('08:00')
  const [dailyEnd, setDailyEnd] = useState('14:00')
  const [weekdays, setWeekdays] = useState<AdminEscalaWeekday[]>(defaultClosedWeekdays)
  const [addBackupId, setAddBackupId] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const isActive = open || closing
  const panelVisible = isActive && entered && !closing
  const isEdit = editingShift !== null
  const isBatchEdit = editingBatch !== null && editingBatch.length > 0
  const lockedClosedMode = isBatchEdit

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    const base = editingShift ? { ...editingShift } : createEmptyShift()
    setDraft(base)
    setAddBackupId('')
    setValidationError(null)

    if (editingBatch && editingBatch.length > 0) {
      const sorted = [...editingBatch].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      )
      setScheduleMode('closed')
      setClosedRangeStart(toDateInputValue(sorted[0].startAt))
      setClosedRangeEnd(toDateInputValue(sorted[sorted.length - 1].startAt))
      setDailyStart(toTimeInputValue(sorted[0].startAt))
      setDailyEnd(toTimeInputValue(sorted[0].endAt))
      const days = new Set(sorted.map((s) => new Date(s.startAt).getDay() as AdminEscalaWeekday))
      setWeekdays([...days].sort((a, b) => a - b))
    } else {
      setScheduleMode('single')
      const range = defaultClosedRange()
      setClosedRangeStart(range.start)
      setClosedRangeEnd(range.end)
      setDailyStart('08:00')
      setDailyEnd('14:00')
      setWeekdays(defaultClosedWeekdays)
    }
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [open, editingShift, editingBatch])

  useEffect(() => {
    if (!isActive) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  const backupOptions = useMemo(() => {
    const used = new Set([draft.primaryDoctorId, ...draft.backupDoctorIds])
    return adminEscalaDoctorOptions.filter((d) => !used.has(d.value))
  }, [draft.primaryDoctorId, draft.backupDoctorIds])

  const scopePreview = formatAdminEscalaScopeSummary(draft)

  const closedPreviewCount = useMemo(() => {
    if (scheduleMode !== 'closed') return 0
    return countClosedScheduleDays({
      template: {
        primaryDoctorId: draft.primaryDoctorId,
        backupDoctorIds: draft.backupDoctorIds,
        specialty: draft.specialty,
        modality: draft.modality,
        prefeituraScope: draft.prefeituraScope,
        ubtScope: draft.ubtScope,
        notes: draft.notes,
        status: draft.status,
      },
      rangeStart: closedRangeStart,
      rangeEnd: closedRangeEnd,
      dailyStart,
      dailyEnd,
      weekdays,
      batchId: editingBatch?.[0]?.batchId ?? `esc-batch-${Date.now()}`,
      status: 'rascunho',
    })
  }, [
    scheduleMode,
    draft,
    closedRangeStart,
    closedRangeEnd,
    dailyStart,
    dailyEnd,
    weekdays,
    editingBatch,
  ])

  function toggleWeekday(day: AdminEscalaWeekday) {
    setWeekdays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort(),
    )
  }

  function buildTemplateFromDraft() {
    return {
      primaryDoctorId: draft.primaryDoctorId,
      backupDoctorIds: draft.backupDoctorIds,
      specialty: draft.specialty,
      modality: draft.modality,
      prefeituraScope: draft.prefeituraScope,
      ubtScope: draft.ubtScope,
      notes: draft.notes,
      status: draft.status,
    }
  }

  function validateShared(publish: boolean): string | null {
    if (
      draft.prefeituraScope.mode === 'selected' &&
      draft.prefeituraScope.prefeituraIds.length === 0
    ) {
      return 'Selecione ao menos uma prefeitura ou marque "Todas".'
    }
    if (draft.ubtScope.mode === 'selected' && draft.ubtScope.ubtIds.length === 0) {
      return 'Selecione ao menos uma UBT ou altere o modo de cobertura.'
    }
    const doctorIds = [draft.primaryDoctorId, ...draft.backupDoctorIds]
    if (new Set(doctorIds).size !== doctorIds.length) {
      return 'O titular não pode repetir na fila de reserva.'
    }
    if (!publish) return null
    return null
  }

  function validateSingle(publish: boolean): string | null {
    const shared = validateShared(publish)
    if (shared) return shared
    if (new Date(draft.endAt).getTime() <= new Date(draft.startAt).getTime()) {
      return 'O horário de término deve ser posterior ao início.'
    }
    const conflicts = findDoctorScheduleConflicts(allShifts, draft, [
      draft.primaryDoctorId,
      ...draft.backupDoctorIds,
    ], { excludeBatchId: draft.batchId })
    if (conflicts.length > 0) return conflicts[0]
    return null
  }

  function validateClosed(publish: boolean): string | null {
    const shared = validateShared(publish)
    if (shared) return shared
    if (closedRangeEnd < closedRangeStart) {
      return 'A data final deve ser igual ou posterior à inicial.'
    }
    if (dailyEnd <= dailyStart) {
      return 'O horário diário de término deve ser posterior ao início.'
    }
    if (weekdays.length === 0) {
      return 'Selecione ao menos um dia da semana.'
    }
    const batchId = editingBatch?.[0]?.batchId ?? `esc-batch-${Date.now()}`
    const generated = buildClosedScheduleShifts({
      template: buildTemplateFromDraft(),
      rangeStart: closedRangeStart,
      rangeEnd: closedRangeEnd,
      dailyStart,
      dailyEnd,
      weekdays,
      batchId,
      status: 'rascunho',
    })
    if (generated.length === 0) {
      return 'Nenhum plantão seria gerado — revise datas e dias da semana.'
    }
    const conflicts = findDoctorScheduleConflictsForShifts(
      allShifts,
      generated,
      [draft.primaryDoctorId, ...draft.backupDoctorIds],
      { excludeBatchId: batchId },
    )
    if (conflicts.length > 0) return conflicts[0]
    return null
  }

  function moveBackup(index: number, direction: -1 | 1) {
    const next = [...draft.backupDoctorIds]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setDraft({ ...draft, backupDoctorIds: next })
  }

  function removeBackup(index: number) {
    setDraft({
      ...draft,
      backupDoctorIds: draft.backupDoctorIds.filter((_, i) => i !== index),
    })
  }

  function addBackup() {
    if (!addBackupId) return
    setDraft({
      ...draft,
      backupDoctorIds: [...draft.backupDoctorIds, addBackupId],
    })
    setAddBackupId('')
  }

  function handleSave(status: AdminEscalaShiftStatus) {
    const publish = status === 'publicada'
    const error =
      scheduleMode === 'closed' ? validateClosed(publish) : validateSingle(publish)
    if (error) {
      setValidationError(error)
      return
    }
    setValidationError(null)

    if (scheduleMode === 'closed') {
      const batchId = editingBatch?.[0]?.batchId ?? `esc-batch-${Date.now()}`
      const generated = buildClosedScheduleShifts({
        template: buildTemplateFromDraft(),
        rangeStart: closedRangeStart,
        rangeEnd: closedRangeEnd,
        dailyStart,
        dailyEnd,
        weekdays,
        batchId,
        status,
      }).map((shift) => ({
        ...shift,
        status,
        updatedAt: new Date().toISOString(),
      }))
      onSaveMany(generated, { replaceBatchId: editingBatch?.[0]?.batchId })
      onClose()
      return
    }

    onSave({
      ...draft,
      status,
      updatedAt: new Date().toISOString(),
    })
    onClose()
  }

  if (!isActive) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[9997] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar plantão"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-escala-shift-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col overflow-hidden border-l border-gray-200 bg-white shadow-[-16px_0_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${
          panelVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/35 to-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white shadow-sm">
                <CalendarClock className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <h2 id="admin-escala-shift-title" className="text-lg font-bold text-gray-900">
                  {isBatchEdit
                    ? 'Editar agenda fechada'
                    : isEdit
                      ? 'Editar plantão'
                      : 'Novo plantão'}
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Um dia ou agenda fechada em vários dias — titular, reserva e cobertura.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
          <AdminEscalaScopeFields
            prefeituraScope={draft.prefeituraScope}
            ubtScope={draft.ubtScope}
            onPrefeituraScopeChange={(prefeituraScope) => setDraft({ ...draft, prefeituraScope })}
            onUbtScopeChange={(ubtScope) => setDraft({ ...draft, ubtScope })}
          />

          <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <span className="font-semibold text-gray-700">Cobertura:</span> {scopePreview}
          </p>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Período
              </p>
              {!lockedClosedMode ? (
                <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
                  {(
                    [
                      { value: 'single' as const, label: 'Um dia' },
                      { value: 'closed' as const, label: 'Agenda fechada' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setScheduleMode(opt.value)}
                      className={[
                        'rounded-md px-2.5 py-1.5 text-xs font-semibold',
                        scheduleMode === opt.value
                          ? 'bg-[var(--brand-primary)] text-white'
                          : 'text-gray-600',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {scheduleMode === 'single' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Início
                  </label>
                  <input
                    type="datetime-local"
                    value={toDatetimeLocalValue(draft.startAt)}
                    onChange={(e) =>
                      setDraft({ ...draft, startAt: fromDatetimeLocalValue(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Término
                  </label>
                  <input
                    type="datetime-local"
                    value={toDatetimeLocalValue(draft.endAt)}
                    onChange={(e) =>
                      setDraft({ ...draft, endAt: fromDatetimeLocalValue(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Data inicial
                    </label>
                    <input
                      type="date"
                      value={closedRangeStart}
                      onChange={(e) => setClosedRangeStart(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Data final
                    </label>
                    <input
                      type="date"
                      value={closedRangeEnd}
                      onChange={(e) => setClosedRangeEnd(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Horário início (cada dia)
                    </label>
                    <input
                      type="time"
                      value={dailyStart}
                      onChange={(e) => setDailyStart(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Horário fim (cada dia)
                    </label>
                    <input
                      type="time"
                      value={dailyEnd}
                      onChange={(e) => setDailyEnd(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-gray-600">Dias da semana</p>
                  <div className="flex flex-wrap gap-1.5">
                    {adminEscalaWeekdayOptions.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWeekday(day.value)}
                        className={[
                          'rounded-lg px-2.5 py-1.5 text-xs font-semibold',
                          weekdays.includes(day.value)
                            ? 'bg-indigo-600 text-white'
                            : 'border border-gray-200 bg-white text-gray-600',
                        ].join(' ')}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs font-medium text-indigo-900">
                  Serão gerados{' '}
                  <span className="font-bold">{closedPreviewCount}</span> plantão
                  {closedPreviewCount === 1 ? '' : 's'} para este profissional.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              Médico titular
            </label>
            <CustomSelect
              value={draft.primaryDoctorId}
              onChange={(value) => {
                const doctor = adminEscalaDoctorOptions.find((d) => d.value === value)
                setDraft({
                  ...draft,
                  primaryDoctorId: value,
                  specialty: doctor?.specialty ?? draft.specialty,
                  backupDoctorIds: draft.backupDoctorIds.filter((id) => id !== value),
                })
              }}
              options={adminEscalaDoctorOptions.map((d) => ({
                value: d.value,
                label: `${d.label} · ${d.specialty}`,
              }))}
            />
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              Especialidade no plantão
            </label>
            <input
              type="text"
              value={draft.specialty}
              onChange={(e) => setDraft({ ...draft, specialty: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Modalidade</label>
            <CustomSelect
              value={draft.modality}
              onChange={(value) =>
                setDraft({ ...draft, modality: value as AdminEscalaShift['modality'] })
              }
              options={[
                { value: 'tele', label: 'Telemedicina' },
                { value: 'hibrido', label: 'Híbrido' },
                { value: 'presencial_ubt', label: 'Presencial na UBT' },
              ]}
            />
          </div>

          <div className="mt-5 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-gray-900">Fila de reserva</p>
                <p className="mt-0.5 text-xs text-gray-600">
                  Se o titular não comparecer, o sistema aciona os substitutos nesta ordem.
                </p>
              </div>
            </div>

            {draft.backupDoctorIds.length === 0 ? (
              <p className="mt-3 text-xs text-amber-800">
                Nenhum reserva cadastrado — adicione médicos abaixo.
              </p>
            ) : (
              <ol className="mt-3 space-y-2">
                {draft.backupDoctorIds.map((doctorId, index) => (
                  <li
                    key={`${doctorId}-${index}`}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-gray-300" />
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-900">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium text-gray-800">
                      {getAdminEscalaDoctorLabel(doctorId)}
                    </span>
                    <div className="flex shrink-0 gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveBackup(index, -1)}
                        disabled={index === 0}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                        aria-label="Subir na fila"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBackup(index, 1)}
                        disabled={index === draft.backupDoctorIds.length - 1}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                        aria-label="Descer na fila"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBackup(index)}
                        className="rounded p-1 text-red-500 hover:bg-red-50"
                        aria-label="Remover da fila"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-3 flex gap-2">
              <div className="min-w-0 flex-1">
                <CustomSelect
                  value={addBackupId}
                  onChange={setAddBackupId}
                  options={[
                    { value: '', label: 'Adicionar substituto…' },
                    ...backupOptions.map((d) => ({
                      value: d.value,
                      label: `${d.label} · ${d.specialty}`,
                    })),
                  ]}
                />
              </div>
              <button
                type="button"
                onClick={addBackup}
                disabled={!addBackupId}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                Incluir
              </button>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">
              Observações internas
            </label>
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Ex.: cobre falta do Dr. X, reforço de feriado…"
            />
          </div>

          {validationError ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {validationError}
            </p>
          ) : null}
        </div>

        <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => handleSave('rascunho')}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Salvar rascunho
            </button>
            <button
              type="button"
              onClick={() => handleSave('publicada')}
              className="btn-brand-gradient rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              {scheduleMode === 'closed' ? 'Publicar agenda' : 'Publicar plantão'}
            </button>
          </div>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
