import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { adminEscalaPrefeituras } from '../../../data/adminEscalaRecipients'
import { specialties } from '../../../data/specialties'
import { adminEscalaDoctorOptions } from '../../../data/adminEscalaMock'
import { PROFISSIONAL_SHIFT_AMOUNT_CENTS } from '../../../config/profissionalShiftRates'
import { getUbtById } from '../../../data/adminEscalaRecipients'
import type {
  AdminEscalaAssignmentMode,
  AdminEscalaModality,
  AdminEscalaPrefeituraScope,
  AdminEscalaShift,
  AdminEscalaShiftStatus,
  AdminEscalaUbtScope,
} from '../../../types/adminEscala'
import { normalizeAdminEscalaShift } from '../../../utils/escala/normalizeAdminEscalaShift'
import { CustomSelect } from '../../ui/CustomSelect'
import { AdminEscalaScopeFields } from './AdminEscalaScopeFields'
import { AdminEscalaBackupQueueEditor } from './AdminEscalaBackupQueueEditor'
import {
  AdminEscalaPresencialLocationFields,
  applyPresencialLocationFromUbtScope,
} from './AdminEscalaPresencialLocationFields'
import { findDoctorScheduleConflictsForShifts } from './adminEscalaUi'
import { findPresencialShiftMissingAddress } from '../../../utils/escala/validateAdminEscalaShifts'

type ComposeStepId = 1 | 2

type DaySpecialtyAssignment = {
  specialtyId: string
  assignmentMode: AdminEscalaAssignmentMode
  primaryDoctorId: string
  backupDoctorIds: string[]
  dailyStart: string
  dailyEnd: string
  modality: AdminEscalaModality
  vacancies: number
  amountCents: number
  unitName: string
  city: string
  cityUf: string
  fullAddress: string | null
}

type DayPlan = {
  dateKey: string
  specialtyIds: string[]
  assignments: DaySpecialtyAssignment[]
}

const stepTitles: Record<ComposeStepId, { title: string; hint: string }> = {
  1: {
    title: 'Prefeitura e UBT',
    hint: 'Escolha onde a escala vai rodar.',
  },
  2: {
    title: 'Próximos 30 dias',
    hint: 'Defina especialidades por dia e escolha os médicos. Depois copie para próximos dias quando fizer sentido.',
  },
}

const inputClass =
  'w-full rounded-xl border border-gray-200/80 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'
const timeInputClass = `${inputClass} h-[46px]`

function emptyScope(): { prefeituraScope: AdminEscalaPrefeituraScope; ubtScope: AdminEscalaUbtScope } {
  return {
    prefeituraScope: { mode: 'selected', prefeituraIds: ['cli-bsb'] },
    ubtScope: { mode: 'all', ubtIds: [] },
  }
}

function formatDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })
}

function toDateKey(iso: string) {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function dateKeyToIso(dateKey: string, time: string) {
  return `${dateKey}T${time}:00`
}

function generateNext30DayKeys(startDate: Date) {
  const days: string[] = []
  const pad = (n: number) => String(n).padStart(2, '0')
  const base = new Date(startDate)
  base.setHours(0, 0, 0, 0)
  for (let i = 0; i < 30; i += 1) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    days.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
  }
  return days
}

function defaultDoctorForSpecialty(specialtyName: string) {
  const bySpecialty = adminEscalaDoctorOptions.find(
    (d) => d.specialty.toLowerCase() === specialtyName.toLowerCase(),
  )
  return bySpecialty?.value ?? adminEscalaDoctorOptions[0]?.value ?? '1'
}

function defaultLocationFromScope(scope: AdminEscalaUbtScope) {
  const ubtId = scope.mode === 'selected' ? scope.ubtIds[0] : undefined
  const ubt = ubtId ? getUbtById(ubtId) : undefined
  const city = ubt?.municipalityName ?? 'Brasília'
  return {
    unitName: ubt?.name ?? 'UBT',
    city,
    cityUf: `${city} / DF`,
    fullAddress: ubt ? `${ubt.name}, ${city}` : null,
  }
}

function createDefaultAssignment(specialtyId: string, ubtScope: AdminEscalaUbtScope) {
  const specialtyName = specialties.find((s) => s.id === specialtyId)?.name ?? ''
  const loc = defaultLocationFromScope(ubtScope)
  return {
    specialtyId,
    assignmentMode: 'assigned' as const,
    primaryDoctorId: defaultDoctorForSpecialty(specialtyName),
    backupDoctorIds: [],
    dailyStart: '08:00',
    dailyEnd: '14:00',
    modality: 'tele' as const,
    vacancies: 2,
    amountCents: PROFISSIONAL_SHIFT_AMOUNT_CENTS,
    unitName: loc.unitName,
    city: loc.city,
    cityUf: loc.cityUf,
    fullAddress: loc.fullAddress,
  }
}

function getAssignment(plan: DayPlan, specialtyId: string) {
  return plan.assignments.find((a) => a.specialtyId === specialtyId)
}

function dayPlanSummary(plan: DayPlan) {
  if (plan.specialtyIds.length === 0) return 'Sem especialidades configuradas'
  return plan.specialtyIds
    .map((specialtyId) => {
      const spec = specialties.find((s) => s.id === specialtyId)?.name ?? 'Especialidade'
      const assignment = getAssignment(plan, specialtyId)
      if (!assignment) return spec
      return `${spec} · ${assignment.dailyStart}-${assignment.dailyEnd}`
    })
    .join(' | ')
}

const specialtyCatalogByPrefeituraId: Record<string, string[]> = {
  'cli-bsb': ['4', '3', '7', '19', '26', '132', '38'],
  'cli-campinas': ['4', '3', '14', '16', '18', '29', '33'],
}

function getEligibleSpecialtiesForScope(prefeituraScope: AdminEscalaPrefeituraScope) {
  const available = specialties.filter((s) => s.available)
  if (prefeituraScope.prefeituraIds.length === 0) return available
  const idSet = new Set<string>()
  for (const prefeituraId of prefeituraScope.prefeituraIds) {
    const mapped = specialtyCatalogByPrefeituraId[prefeituraId]
    if (!mapped) {
      for (const spec of available) idSet.add(spec.id)
      continue
    }
    for (const specId of mapped) idSet.add(specId)
  }
  return available.filter((spec) => idSet.has(spec.id))
}

type AdminEscalaComposeContentProps = {
  editingBatch: AdminEscalaShift[] | null
  allShifts: AdminEscalaShift[]
  onActiveStepChange?: (step: ComposeStepId) => void
  onSaved: (
    shifts: AdminEscalaShift[],
    options?: { replaceBatchId?: string; removeShiftIds?: string[] },
  ) => void
}

export function AdminEscalaComposeContent({
  editingBatch,
  allShifts,
  onActiveStepChange,
  onSaved,
}: AdminEscalaComposeContentProps) {
  const isEdit = editingBatch !== null && editingBatch.length > 0
  const batchId = editingBatch?.[0]?.batchId ?? `esc-batch-${Date.now()}`

  const initial = useMemo(() => {
    const baseDate = editingBatch?.[0] ? new Date(editingBatch[0].startAt) : new Date()
    const dayKeys = generateNext30DayKeys(baseDate)
    const blankPlans: DayPlan[] = dayKeys.map((dateKey) => ({
      dateKey,
      specialtyIds: [],
      assignments: [],
    }))
    if (!editingBatch?.length) {
      return { ...emptyScope(), plans: blankPlans }
    }
    const planMap = new Map(blankPlans.map((p) => [p.dateKey, p]))
    for (const shift of editingBatch) {
      const dateKey = toDateKey(shift.startAt)
      const plan = planMap.get(dateKey)
      if (!plan || !shift.specialtyId) continue
      if (!plan.specialtyIds.includes(shift.specialtyId)) {
        plan.specialtyIds.push(shift.specialtyId)
      }
      const start = new Date(shift.startAt)
      const end = new Date(shift.endAt)
      const pad = (n: number) => String(n).padStart(2, '0')
      plan.assignments.push({
        specialtyId: shift.specialtyId,
        assignmentMode: shift.assignmentMode,
        primaryDoctorId: shift.primaryDoctorId,
        backupDoctorIds: [...shift.backupDoctorIds],
        dailyStart: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
        dailyEnd: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
        modality: shift.modality,
        vacancies: shift.totalVacancies || shift.vacancies || 1,
        amountCents: shift.amountCents,
        unitName: shift.unitName,
        city: shift.city,
        cityUf: shift.cityUf,
        fullAddress: shift.fullAddress,
      })
    }
    return {
      prefeituraScope:
        editingBatch[0].prefeituraScope.mode === 'all'
          ? {
              mode: 'selected' as const,
              prefeituraIds: adminEscalaPrefeituras.map((p) => p.id),
            }
          : editingBatch[0].prefeituraScope,
      ubtScope: editingBatch[0].ubtScope,
      plans: blankPlans,
    }
  }, [editingBatch])

  const [activeStep, setActiveStep] = useState<ComposeStepId>(1)

  useEffect(() => {
    onActiveStepChange?.(activeStep)
  }, [activeStep, onActiveStepChange])
  const [prefeituraScope, setPrefeituraScope] = useState(initial.prefeituraScope)
  const [ubtScope, setUbtScope] = useState(initial.ubtScope)
  const [plans, setPlans] = useState<DayPlan[]>(initial.plans)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showOnlyConfiguredDays, setShowOnlyConfiguredDays] = useState(false)
  const [expandedDayKey, setExpandedDayKey] = useState<string | null>(initial.plans[0]?.dateKey ?? null)

  const eligibleSpecialties = useMemo(
    () => getEligibleSpecialtiesForScope(prefeituraScope),
    [prefeituraScope],
  )
  const eligibleSpecialtyIds = useMemo(
    () => new Set(eligibleSpecialties.map((s) => s.id)),
    [eligibleSpecialties],
  )

  const selectedSpecialtyIds = useMemo(
    () => [...new Set(plans.flatMap((p) => p.specialtyIds))],
    [plans],
  )
  const visiblePlans = useMemo(
    () =>
      showOnlyConfiguredDays ? plans.filter((plan) => plan.specialtyIds.length > 0) : plans,
    [plans, showOnlyConfiguredDays],
  )

  const previewShifts = useMemo(() => {
    const all: AdminEscalaShift[] = []
    for (const plan of plans) {
      for (const specialtyId of plan.specialtyIds) {
        const assignment = getAssignment(plan, specialtyId)
        if (!assignment || assignment.dailyEnd <= assignment.dailyStart) continue
        const specialty = specialties.find((s) => s.id === specialtyId)?.name ?? 'Especialidade'
        all.push(
          normalizeAdminEscalaShift({
            id: `${batchId}-${specialtyId}-${plan.dateKey}-${assignment.assignmentMode}`,
            batchId,
            assignmentMode: assignment.assignmentMode,
            primaryDoctorId:
              assignment.assignmentMode === 'open' ? '' : assignment.primaryDoctorId,
            backupDoctorIds:
              assignment.assignmentMode === 'open' ? [] : assignment.backupDoctorIds,
            specialtyId,
            specialty,
            modality: assignment.modality,
            startAt: dateKeyToIso(plan.dateKey, assignment.dailyStart),
            endAt: dateKeyToIso(plan.dateKey, assignment.dailyEnd),
            prefeituraScope,
            ubtScope,
            status: 'rascunho',
            vacancies: assignment.assignmentMode === 'open' ? assignment.vacancies : 0,
            totalVacancies: assignment.assignmentMode === 'open' ? assignment.vacancies : 0,
            amountCents: assignment.amountCents,
            unitName: assignment.unitName,
            city: assignment.city,
            cityUf: assignment.cityUf,
            fullAddress:
              assignment.modality === 'presencial_ubt' ? assignment.fullAddress : null,
            claimedCaptures: [],
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        )
      }
    }
    return all
  }, [plans, batchId, prefeituraScope, ubtScope])

  function stepError(step: ComposeStepId): string | null {
    if (step === 1) {
      if (prefeituraScope.mode === 'selected' && prefeituraScope.prefeituraIds.length === 0) {
        return 'Selecione ao menos uma prefeitura.'
      }
      if (ubtScope.mode === 'selected' && ubtScope.ubtIds.length === 0) {
        return 'Selecione UBTs ou altere para “Todas” / “Só tele”.'
      }
      return null
    }
    if (selectedSpecialtyIds.length === 0) {
      return 'Escolha ao menos uma especialidade em algum dia.'
    }
    if (previewShifts.length === 0) {
      return 'Defina horário válido e modo do plantão em pelo menos um dia.'
    }
    return null
  }

  const maxReachableStep = useMemo(() => {
    if (stepError(1)) return 1
    return 2
  }, [prefeituraScope, ubtScope])

  function validateAll(publish: boolean): string | null {
    for (const step of [1, 2] as const) {
      const err = stepError(step)
      if (err) return err
    }
    const status: AdminEscalaShiftStatus = publish ? 'publicada' : 'rascunho'
    const generated = previewShifts.map((shift) => ({ ...shift, status }))
    const doctorIds = [
      ...new Set(
        generated
          .filter((s) => s.assignmentMode === 'assigned')
          .flatMap((s) => [s.primaryDoctorId, ...s.backupDoctorIds].filter(Boolean)),
      ),
    ]
    const conflicts = findDoctorScheduleConflictsForShifts(
      allShifts,
      generated,
      doctorIds,
      { excludeBatchId: isEdit ? batchId : undefined },
    )
    if (conflicts.length > 0) return conflicts[0]

    const presencialSemEndereco = findPresencialShiftMissingAddress(generated)
    if (presencialSemEndereco) {
      return 'Plantões presenciais exigem nome do local, cidade e endereço completo.'
    }

    return null
  }

  function handlePublish(status: AdminEscalaShiftStatus) {
    const error = validateAll(status === 'publicada')
    if (error) {
      setValidationError(error)
      return
    }
    setValidationError(null)
    const generated = previewShifts.map((shift) => ({
      ...shift,
      status,
      updatedAt: new Date().toISOString(),
    }))
    onSaved(generated, {
      replaceBatchId: isEdit && editingBatch?.[0]?.batchId ? batchId : undefined,
      removeShiftIds:
        isEdit && editingBatch && !editingBatch[0]?.batchId
          ? editingBatch.map((s) => s.id)
          : undefined,
    })
  }

  function goNext() {
    const err = stepError(activeStep)
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError(null)
    if (activeStep < 2) setActiveStep((activeStep + 1) as ComposeStepId)
  }

  function goBack() {
    setValidationError(null)
    if (activeStep > 1) setActiveStep((activeStep - 1) as ComposeStepId)
  }

  const { title, hint } = stepTitles[activeStep]

  function toggleSpecialtyForDay(planIndex: number, specialtyId: string) {
    setPlans((current) =>
      current.map((plan, idx) => {
        if (idx !== planIndex) return plan
        const enabled = plan.specialtyIds.includes(specialtyId)
        if (enabled) {
          return {
            ...plan,
            specialtyIds: plan.specialtyIds.filter((id) => id !== specialtyId),
            assignments: plan.assignments.filter((a) => a.specialtyId !== specialtyId),
          }
        }
        return {
          ...plan,
          specialtyIds: [...plan.specialtyIds, specialtyId],
          assignments: [...plan.assignments, createDefaultAssignment(specialtyId, ubtScope)],
        }
      }),
    )
  }

  function handlePrefeituraScopeChange(scope: AdminEscalaPrefeituraScope) {
    setPrefeituraScope(scope)
    const allowedIds = new Set(getEligibleSpecialtiesForScope(scope).map((s) => s.id))
    setPlans((current) =>
      current.map((plan) => ({
        ...plan,
        specialtyIds: plan.specialtyIds.filter((id) => allowedIds.has(id)),
        assignments: plan.assignments.filter((assignment) => allowedIds.has(assignment.specialtyId)),
      })),
    )
  }

  function updateAssignment(
    planIndex: number,
    specialtyId: string,
    patch: Partial<DaySpecialtyAssignment>,
  ) {
    setPlans((current) =>
      current.map((plan, idx) => {
        if (idx !== planIndex) return plan
        return {
          ...plan,
          assignments: plan.assignments.map((assignment) =>
            assignment.specialtyId === specialtyId ? { ...assignment, ...patch } : assignment,
          ),
        }
      }),
    )
  }

  function copyDayForward(fromIndex: number, mode: 'next7' | 'all') {
    setPlans((current) => {
      const source = current[fromIndex]
      const end =
        mode === 'next7'
          ? Math.min(current.length - 1, fromIndex + 7)
          : current.length - 1
      return current.map((plan, index) => {
        if (index <= fromIndex || index > end) return plan
        return {
          ...plan,
          specialtyIds: [...source.specialtyIds],
          assignments: source.assignments.map((a) => ({ ...a })),
        }
      })
    })
  }

  const activeDaysCount = new Set(previewShifts.map((s) => toDateKey(s.startAt))).size

  const isScopeStep = activeStep === 1

  return (
    <div
      className={[
        'flex flex-col gap-3',
        isScopeStep ? 'shrink-0' : 'flex min-h-0 flex-1 flex-col',
      ].join(' ')}
    >
      <div
        className={[
          'flex overflow-hidden rounded-2xl',
          isScopeStep ? 'shrink-0 flex-col' : 'min-h-0 flex-1 flex-col',
          'bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_64px_rgba(15,23,42,0.08)]',
          'ring-1 ring-gray-200/80',
        ].join(' ')}
      >
        <main
          className={[
            'flex min-w-0 flex-col',
            isScopeStep ? 'shrink-0' : 'min-h-0 flex-1',
          ].join(' ')}
        >
          <header className="shrink-0 border-b border-gray-200/60 bg-white px-4 py-4 sm:px-6 lg:px-8">
            <div className="mb-3 flex items-center gap-2">
              {[1, 2].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => {
                    if (step <= maxReachableStep) {
                      setValidationError(null)
                      setActiveStep(step as ComposeStepId)
                    }
                  }}
                  className={[
                    'rounded-full px-3 py-1.5 text-xs font-bold',
                    activeStep === step
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'bg-gray-100 text-gray-600',
                  ].join(' ')}
                >
                  Etapa {step}
                </button>
              ))}
              <p className="ml-2 text-xs text-gray-500">
                {previewShifts.length} plantões em {activeDaysCount} dias
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
                {title}
              </h3>
              <p className="mt-0.5 text-sm text-gray-500">{hint}</p>
            </div>
          </header>

          <div
            className={[
              isScopeStep
                ? 'shrink-0 bg-slate-100/50 p-4 sm:p-6'
                : 'min-h-0 flex-1 overflow-y-auto bg-[#f8f9fb] p-4 sm:p-6 lg:p-8',
            ].join(' ')}
          >
            {isScopeStep ? (
              <div className="mx-auto w-full max-w-none">
                <AdminEscalaScopeFields
                  variant="premium"
                  prefeituraScope={prefeituraScope}
                  ubtScope={ubtScope}
                  onPrefeituraScopeChange={handlePrefeituraScopeChange}
                  onUbtScopeChange={setUbtScope}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Especialidades disponíveis por dia ({eligibleSpecialties.length})
                  </p>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-600">
                    <input
                      type="checkbox"
                      checked={showOnlyConfiguredDays}
                      onChange={(e) => setShowOnlyConfiguredDays(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
                    />
                    Mostrar só dias configurados
                  </label>
                </div>
                <div className="space-y-3">
                  {visiblePlans.map((plan) => {
                    const planIndex = plans.findIndex((p) => p.dateKey === plan.dateKey)
                    const isExpanded = expandedDayKey === plan.dateKey
                    return (
                    <article
                      key={plan.dateKey}
                      onClick={() => {
                        if (!isExpanded) setExpandedDayKey(plan.dateKey)
                      }}
                      className={[
                        'rounded-2xl border bg-white p-4 shadow-sm transition',
                        !isExpanded ? 'cursor-pointer' : '',
                        isExpanded ? 'border-[var(--brand-primary)]/30 ring-2 ring-[var(--brand-primary)]/10' : 'border-gray-200',
                      ].join(' ')}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setExpandedDayKey(isExpanded ? null : plan.dateKey)
                          }}
                          className="min-w-0 flex-1 rounded-lg px-1 py-0.5 text-left focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30"
                        >
                          <h4 className="text-sm font-bold text-gray-900">
                            {formatDateLabel(plan.dateKey)}
                          </h4>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {plan.specialtyIds.length} especialidade{plan.specialtyIds.length === 1 ? '' : 's'} ·{' '}
                            {plan.assignments.length} médico{plan.assignments.length === 1 ? '' : 's'}
                          </p>
                        </button>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              copyDayForward(planIndex, 'next7')
                            }}
                            className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Copiar +7 dias
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              copyDayForward(planIndex, 'all')
                            }}
                            className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Copiar até o fim
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setExpandedDayKey(isExpanded ? null : plan.dateKey)
                            }}
                            className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            {isExpanded ? 'Recolher' : 'Editar dia'}
                          </button>
                        </div>
                      </div>

                      {!isExpanded ? (
                        <p className="mt-2 line-clamp-2 text-xs text-gray-500">{dayPlanSummary(plan)}</p>
                      ) : (
                        <>
                          <div className="mb-3 mt-3 flex flex-wrap gap-2">
                            {eligibleSpecialties.map((spec) => {
                              const enabled = plan.specialtyIds.includes(spec.id)
                              return (
                                <button
                                  key={spec.id}
                                  type="button"
                                  onClick={() => toggleSpecialtyForDay(planIndex, spec.id)}
                                  className={[
                                    'rounded-full px-3 py-1.5 text-xs font-semibold',
                                    enabled
                                      ? 'bg-[var(--brand-primary)] text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                                  ].join(' ')}
                                >
                                  {spec.name}
                                </button>
                              )
                            })}
                          </div>

                          {plan.specialtyIds.length === 0 ? (
                            <p className="text-xs text-gray-500">
                              Nenhuma especialidade selecionada para este dia.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {plan.specialtyIds.map((specialtyId) => {
                            if (!eligibleSpecialtyIds.has(specialtyId)) return null
                            const spec = specialties.find((s) => s.id === specialtyId)
                            const assignment = getAssignment(plan, specialtyId)
                            if (!assignment) return null
                            const doctorChoices = adminEscalaDoctorOptions.filter(
                              (d) =>
                                !spec ||
                                d.specialty.toLowerCase() === spec.name.toLowerCase(),
                            )
                            const options =
                              doctorChoices.length > 0
                                ? doctorChoices
                                : adminEscalaDoctorOptions
                            return (
                              <div
                                key={`${plan.dateKey}-${specialtyId}`}
                                className="space-y-3 rounded-xl bg-gray-50 p-3"
                              >
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateAssignment(planIndex, specialtyId, {
                                        assignmentMode: 'assigned',
                                      })
                                    }
                                    className={[
                                      'rounded-full px-3 py-1 text-xs font-semibold',
                                      assignment.assignmentMode === 'assigned'
                                        ? 'bg-[var(--brand-primary)] text-white'
                                        : 'bg-gray-100 text-gray-700',
                                    ].join(' ')}
                                  >
                                    Médico definido
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateAssignment(planIndex, specialtyId, {
                                        assignmentMode: 'open',
                                        primaryDoctorId: '',
                                        backupDoctorIds: [],
                                      })
                                    }
                                    className={[
                                      'rounded-full px-3 py-1 text-xs font-semibold',
                                      assignment.assignmentMode === 'open'
                                        ? 'bg-[var(--brand-primary)] text-white'
                                        : 'bg-gray-100 text-gray-700',
                                    ].join(' ')}
                                  >
                                    Aberto (portal)
                                  </button>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_10rem_10rem]">
                                  <div>
                                    <p className="text-xs font-bold text-gray-700">{spec?.name}</p>
                                    {assignment.assignmentMode === 'assigned' ? (
                                      <CustomSelect
                                        value={assignment.primaryDoctorId}
                                        onChange={(value) =>
                                          updateAssignment(planIndex, specialtyId, {
                                            primaryDoctorId: value,
                                            backupDoctorIds: assignment.backupDoctorIds.filter(
                                              (id) => id !== value,
                                            ),
                                          })
                                        }
                                        options={options.map((d) => ({
                                          value: d.value,
                                          label: d.label,
                                        }))}
                                      />
                                    ) : (
                                      <p className="mt-2 text-xs text-gray-500">
                                        Sem titular — médicos reservam no portal.
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="mb-1 text-[11px] font-semibold text-gray-600">Início</p>
                                    <input
                                      type="time"
                                      value={assignment.dailyStart}
                                      onChange={(e) =>
                                        updateAssignment(planIndex, specialtyId, {
                                          dailyStart: e.target.value,
                                        })
                                      }
                                      className={timeInputClass}
                                    />
                                  </div>
                                  <div>
                                    <p className="mb-1 text-[11px] font-semibold text-gray-600">Fim</p>
                                    <input
                                      type="time"
                                      value={assignment.dailyEnd}
                                      onChange={(e) =>
                                        updateAssignment(planIndex, specialtyId, {
                                          dailyEnd: e.target.value,
                                        })
                                      }
                                      className={timeInputClass}
                                    />
                                  </div>
                                  <div>
                                    <p className="mb-1 text-[11px] font-semibold text-gray-600">Modalidade</p>
                                    <CustomSelect
                                      value={assignment.modality}
                                      onChange={(value) => {
                                        const modality = value as AdminEscalaModality
                                        const patch: Partial<DaySpecialtyAssignment> = {
                                          modality,
                                        }
                                        if (modality === 'presencial_ubt') {
                                          Object.assign(
                                            patch,
                                            applyPresencialLocationFromUbtScope(
                                              ubtScope,
                                              assignment,
                                            ),
                                          )
                                        } else {
                                          patch.fullAddress = null
                                        }
                                        updateAssignment(planIndex, specialtyId, patch)
                                      }}
                                      options={[
                                        { value: 'tele', label: 'Tele' },
                                        { value: 'hibrido', label: 'Híbrido' },
                                        { value: 'presencial_ubt', label: 'Presencial UBT' },
                                      ]}
                                    />
                                  </div>
                                </div>

                                {assignment.modality === 'presencial_ubt' ? (
                                  <AdminEscalaPresencialLocationFields
                                    values={assignment}
                                    onChange={(patch) =>
                                      updateAssignment(planIndex, specialtyId, patch)
                                    }
                                    inputClass={inputClass}
                                    ubtScope={ubtScope}
                                  />
                                ) : null}

                                {assignment.assignmentMode === 'open' ? (
                                  <div className="grid gap-2 sm:grid-cols-2">
                                    <div>
                                      <p className="mb-1 text-[11px] font-semibold text-gray-600">
                                        Vagas
                                      </p>
                                      <input
                                        type="number"
                                        min={1}
                                        value={assignment.vacancies}
                                        onChange={(e) =>
                                          updateAssignment(planIndex, specialtyId, {
                                            vacancies: Math.max(1, Number(e.target.value) || 1),
                                          })
                                        }
                                        className={inputClass}
                                      />
                                    </div>
                                    <div>
                                      <p className="mb-1 text-[11px] font-semibold text-gray-600">
                                        Valor (R$)
                                      </p>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        value={String(assignment.amountCents / 100)}
                                        onChange={(e) => {
                                          const reais = Number(
                                            e.target.value.replace(/[^\d]/g, ''),
                                          )
                                          updateAssignment(planIndex, specialtyId, {
                                            amountCents: Number.isFinite(reais)
                                              ? reais * 100
                                              : PROFISSIONAL_SHIFT_AMOUNT_CENTS,
                                          })
                                        }}
                                        className={inputClass}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <AdminEscalaBackupQueueEditor
                                    primaryDoctorId={assignment.primaryDoctorId}
                                    backupDoctorIds={assignment.backupDoctorIds}
                                    onBackupDoctorIdsChange={(ids) =>
                                      updateAssignment(planIndex, specialtyId, {
                                        backupDoctorIds: ids,
                                      })
                                    }
                                    variant="premium"
                                  />
                                )}
                              </div>
                            )
                          })}
                            </div>
                          )}
                        </>
                      )}
                    </article>
                    )
                  })}
                  {visiblePlans.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
                      Nenhum dia configurado ainda. Desative o filtro para editar os próximos 30 dias.
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <footer className="shrink-0 border-t border-gray-200/60 bg-white px-4 py-4 sm:px-6 lg:px-8">
            {validationError ? (
              <p className="mb-3 rounded-xl border border-red-200/80 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {validationError}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={activeStep === 1}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 ring-1 ring-gray-200/80 hover:bg-gray-50 disabled:opacity-35"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </button>

              {activeStep < 2 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="btn-brand-gradient inline-flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-bold shadow-[0_6px_20px_rgba(255,107,0,0.28)]"
                >
                  Continuar
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePublish('rascunho')}
                    disabled={previewShifts.length === 0}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Salvar rascunho
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePublish('publicada')}
                    disabled={previewShifts.length === 0}
                    className="btn-brand-gradient rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-40"
                  >
                    Publicar escala
                  </button>
                </div>
              )}
            </div>
          </footer>
        </main>
      </div>

      <div className="mt-3 shrink-0 rounded-2xl bg-gray-950 px-4 py-4 text-white lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Prévia</p>
            <p className="text-2xl font-bold tabular-nums">
              {previewShifts.length}{' '}
              <span className="text-sm font-medium text-gray-400">plantões</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePublish('rascunho')}
              disabled={previewShifts.length === 0}
              className="rounded-xl bg-white/10 px-3 py-2.5 text-xs font-bold ring-1 ring-white/15 disabled:opacity-40"
            >
              Rascunho
            </button>
            <button
              type="button"
              onClick={() => handlePublish('publicada')}
              disabled={previewShifts.length === 0 || activeStep < 2}
              className="rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-xs font-bold disabled:opacity-40"
            >
              Publicar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
