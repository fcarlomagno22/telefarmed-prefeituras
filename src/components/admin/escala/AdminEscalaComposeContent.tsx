import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { getAdminEscalaPrefeituras, getAdminEscalaSpecialties } from '../../../data/adminEscalaCatalog'
import { getSpecialtyById } from '../../../data/specialties'
import { verifyAdminAuthorizationPin } from '../../../lib/services/admin/auth'
import type { EscalaContratoOptionApi } from '../../../lib/services/admin/escala'
import type {
  AdminEscalaPrefeituraScope,
  AdminEscalaProgrammingSlot,
  AdminEscalaShift,
  AdminEscalaShiftStatus,
  AdminEscalaUbtScope,
} from '../../../types/adminEscala'
import { buildProgrammingSlotsShifts, countProgrammingSlotsShifts } from '../../../utils/adminEscala/buildProgrammingSlots'
import { escalaDateRangeError, isSingleDayEscalaPeriod, isValidEscalaDateRange } from '../../../utils/adminEscala/dateRange'
import { createDefaultProgrammingSlot } from '../../../utils/adminEscala/createDefaultProgrammingSlot'
import { getDoctorsForEscalaSpecialty } from '../../../utils/adminEscala/doctorsForSpecialty'
import { createProgrammingSlotId } from '../../../utils/adminEscala/programmingSlotId'
import {
  buildSpecialtyOptionsFromContratos,
  registerContratosById,
} from '../../../utils/adminEscala/specialtyOptionsFromContratos'
import { shiftsToProgrammingSlots } from '../../../utils/adminEscala/shiftsToProgrammingSlots'
import { resolveSingleScheduleWeekday } from '../../../utils/adminEscala/resolveSingleScheduleWeekday'
import { findPresencialShiftMissingAddress } from '../../../utils/escala/validateAdminEscalaShifts'
import { AdminEscalaComposeContratoColumn } from './AdminEscalaComposeContratoColumn'
import { AdminEscalaComposePeriodStep } from './AdminEscalaComposePeriodStep'
import { AdminEscalaComposePrefeituraList } from './AdminEscalaComposePrefeituraList'
import {
  AdminEscalaContratoField,
  validateAdminEscalaContratosPorPrefeitura,
  type AdminEscalaContratoLoadState,
} from './AdminEscalaContratoField'
import { AdminEscalaComposeScopeCompact } from './AdminEscalaComposeScopeCompact'
import {
  AdminEscalaComposeSteps,
  type AdminEscalaComposeStepId,
} from './AdminEscalaComposeSteps'
import { AdminEscalaPlantaoBlockCard } from './AdminEscalaPlantaoBlockCard'
import { AdminEscalaPlantaoSummaryList } from './AdminEscalaPlantaoSummaryList'
import { findDoctorScheduleConflictsForShifts } from './adminEscalaUi'
import { validateProgrammingSlot } from '../../../utils/adminEscala/validateProgrammingSlot'
import { PinUnlockModal } from '../../users/PinUnlockModal'

function emptyScope(): { prefeituraScope: AdminEscalaPrefeituraScope; ubtScope: AdminEscalaUbtScope } {
  return {
    prefeituraScope: { mode: 'selected', prefeituraIds: [] },
    ubtScope: { mode: 'tele_only', ubtIds: [] },
  }
}

function getSelectedPrefeituraIds(scope: AdminEscalaPrefeituraScope): string[] {
  if (scope.mode === 'all') {
    return getAdminEscalaPrefeituras().map((p) => p.id)
  }
  return scope.prefeituraIds
}

function buildInitialContratosPorPrefeitura(
  scope: AdminEscalaPrefeituraScope,
  contratoEntidadeId?: string | null,
): Record<string, string> {
  if (scope.contratosPorPrefeitura && Object.keys(scope.contratosPorPrefeitura).length > 0) {
    return scope.contratosPorPrefeitura
  }
  const ids = getSelectedPrefeituraIds(scope)
  if (contratoEntidadeId && ids.length === 1) {
    return { [ids[0]!]: contratoEntidadeId }
  }
  return {}
}

function buildPrefeituraScopeWithContratos(
  scope: AdminEscalaPrefeituraScope,
  contratosPorPrefeitura: Record<string, string>,
): AdminEscalaPrefeituraScope {
  return { ...scope, contratosPorPrefeitura }
}

function resolvePrimaryContratoEntidadeId(
  scope: AdminEscalaPrefeituraScope,
  contratosPorPrefeitura: Record<string, string>,
): string {
  for (const id of getSelectedPrefeituraIds(scope)) {
    const contratoId = contratosPorPrefeitura[id]
    if (contratoId) return contratoId
  }
  return ''
}

function toDateInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function defaultDateRange() {
  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + 13)
  return { rangeStart: toDateInputValue(start), rangeEnd: toDateInputValue(end) }
}

function createInitialSlot(specialtyId?: string): AdminEscalaProgrammingSlot {
  const fallbackId =
    specialtyId ??
    getAdminEscalaSpecialties().find((s) => s.active)?.id ??
    '4'
  return createDefaultProgrammingSlot(fallbackId)
}

function slotNeedsUbt(slot: AdminEscalaProgrammingSlot) {
  return slot.modality === 'presencial_ubt' || slot.modality === 'hibrido'
}

const stepHints: Record<AdminEscalaComposeStepId, { title: string; hint: string }> = {
  1: {
    title: 'Onde a escala será publicada',
    hint: 'Selecione a prefeitura e o contrato operacional.',
  },
  2: {
    title: 'Período da escala',
    hint: 'Defina o intervalo de datas em que os plantões serão gerados.',
  },
  3: {
    title: 'Configure os plantões',
    hint: 'Especialidade, dias da semana, horário, valor e modalidade de atendimento.',
  },
}

type AdminEscalaComposeContentProps = {
  editingBatch: AdminEscalaShift[] | null
  allShifts: AdminEscalaShift[]
  onActiveStepChange?: (step: 1 | 2) => void
  onSaved: (
    shifts: AdminEscalaShift[],
    options?: { replaceBatchId?: string; removeShiftIds?: string[] },
  ) => void | boolean | Promise<void | boolean>
  isSaving?: boolean
}

export function AdminEscalaComposeContent({
  editingBatch,
  allShifts,
  onActiveStepChange,
  onSaved,
  isSaving = false,
}: AdminEscalaComposeContentProps) {
  const { getAccessToken } = useAdminAuth()
  const isEdit = editingBatch !== null && editingBatch.length > 0
  const batchId = editingBatch?.[0]?.batchId ?? `esc-batch-${Date.now()}`
  const batchRepasseReadOnly = useMemo(
    () => Boolean(editingBatch?.some((shift) => shift.status === 'publicada')),
    [editingBatch],
  )

  const initial = useMemo(() => {
    const defaultRange = defaultDateRange()
    if (!editingBatch?.length) {
      return {
        ...emptyScope(),
        contratosPorPrefeitura: {} as Record<string, string>,
        rangeStart: defaultRange.rangeStart,
        rangeEnd: defaultRange.rangeEnd,
        slots: [] as AdminEscalaProgrammingSlot[],
        draftSlot: createInitialSlot(),
      }
    }

    const reconstructed = shiftsToProgrammingSlots(editingBatch)
    const editScope =
      editingBatch[0].prefeituraScope.mode === 'all'
        ? {
            mode: 'selected' as const,
            prefeituraIds: getAdminEscalaPrefeituras().map((p) => p.id),
          }
        : editingBatch[0].prefeituraScope

    return {
      prefeituraScope: editScope,
      ubtScope: editingBatch[0].ubtScope,
      contratosPorPrefeitura: buildInitialContratosPorPrefeitura(
        editScope,
        editingBatch[0].contratoEntidadeId,
      ),
      rangeStart: reconstructed.rangeStart || defaultRange.rangeStart,
      rangeEnd: reconstructed.rangeEnd || defaultRange.rangeEnd,
      slots: reconstructed.slots,
      draftSlot: createInitialSlot(),
    }
  }, [editingBatch])

  const [activeStep, setActiveStep] = useState<AdminEscalaComposeStepId>(1)
  const [prefeituraScope, setPrefeituraScope] = useState(initial.prefeituraScope)
  const [ubtScope, setUbtScope] = useState(initial.ubtScope)
  const [contratosPorPrefeitura, setContratosPorPrefeitura] = useState(initial.contratosPorPrefeitura)
  const [contratoLoadStateByPrefeitura, setContratoLoadStateByPrefeitura] = useState<
    Record<string, AdminEscalaContratoLoadState>
  >({})
  const [contratosById, setContratosById] = useState<Record<string, EscalaContratoOptionApi>>({})
  const [rangeStart, setRangeStart] = useState(initial.rangeStart)
  const [rangeEnd, setRangeEnd] = useState(initial.rangeEnd)
  const [slots, setSlots] = useState<AdminEscalaProgrammingSlot[]>(initial.slots)
  const [draftSlot, setDraftSlot] = useState<AdminEscalaProgrammingSlot>(initial.draftSlot)
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [editingOriginalSlot, setEditingOriginalSlot] = useState<AdminEscalaProgrammingSlot | null>(
    null,
  )
  const [deletePlantaoTarget, setDeletePlantaoTarget] = useState<{
    slotId: string
    label: string
  } | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [activePrefeituraId, setActivePrefeituraId] = useState<string | null>(
    initial.prefeituraScope.prefeituraIds[0] ?? null,
  )

  useEffect(() => {
    onActiveStepChange?.(activeStep === 1 ? 1 : 2)
  }, [activeStep, onActiveStepChange])

  const hasPresencialSlot = useMemo(() => slots.some(slotNeedsUbt), [slots])
  const hasPresencialInForm = useMemo(
    () => slots.some(slotNeedsUbt) || slotNeedsUbt(draftSlot),
    [slots, draftSlot],
  )

  useEffect(() => {
    if (!hasPresencialSlot) {
      setUbtScope({ mode: 'tele_only', ubtIds: [] })
    } else if (ubtScope.mode === 'tele_only') {
      setUbtScope({ mode: 'all', ubtIds: [] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPresencialSlot])

  const selectedPrefeituraIds = useMemo(
    () => getSelectedPrefeituraIds(prefeituraScope),
    [prefeituraScope],
  )

  const prefeituraScopeWithContratos = useMemo(
    () => buildPrefeituraScopeWithContratos(prefeituraScope, contratosPorPrefeitura),
    [prefeituraScope, contratosPorPrefeitura],
  )

  const primaryContratoEntidadeId = useMemo(
    () => resolvePrimaryContratoEntidadeId(prefeituraScope, contratosPorPrefeitura),
    [prefeituraScope, contratosPorPrefeitura],
  )

  const selectedContratoIds = useMemo(
    () =>
      [
        ...new Set(
          selectedPrefeituraIds
            .map((prefeituraId) => contratosPorPrefeitura[prefeituraId])
            .filter(Boolean),
        ),
      ] as string[],
    [selectedPrefeituraIds, contratosPorPrefeitura],
  )

  const singleDayPeriod = useMemo(
    () => isSingleDayEscalaPeriod(rangeStart, rangeEnd),
    [rangeStart, rangeEnd],
  )

  const slotValidationOptions = useMemo(
    () => ({ singleDayPeriod }),
    [singleDayPeriod],
  )

  const specialtyOptions = useMemo(
    () => buildSpecialtyOptionsFromContratos(selectedContratoIds, contratosById),
    [selectedContratoIds, contratosById],
  )

  useEffect(() => {
    if (specialtyOptions.length === 0) return
    const allowed = new Set(specialtyOptions.map((option) => option.value))
    setDraftSlot((current) => {
      if (allowed.has(current.specialtyId)) return current
      const nextSpecialtyId = specialtyOptions[0]!.value
      const doctors = getDoctorsForEscalaSpecialty(nextSpecialtyId)
      return {
        ...current,
        specialtyId: nextSpecialtyId,
        primaryDoctorId: doctors[0]?.value ?? '',
        backupDoctorIds: [],
      }
    })
  }, [specialtyOptions])

  const programmingSlotsForPreview = useMemo(
    () =>
      slots.length > 0
        ? slots
        : [{ ...draftSlot, id: draftSlot.id || 'preview-draft' }],
    [slots, draftSlot],
  )

  const singleScheduleWeekday = useMemo(
    () => resolveSingleScheduleWeekday(slots, slots.length > 0 ? null : draftSlot),
    [slots, draftSlot],
  )

  const previewShiftCount = useMemo(
    () =>
      countProgrammingSlotsShifts({
        batchId,
        rangeStart,
        rangeEnd,
        slots: programmingSlotsForPreview,
        prefeituraScope: prefeituraScopeWithContratos,
        ubtScope,
        status: 'rascunho',
      }),
    [
      batchId,
      rangeStart,
      rangeEnd,
      programmingSlotsForPreview,
      prefeituraScopeWithContratos,
      ubtScope,
    ],
  )

  const previewShifts = useMemo(() => {
    if (!isValidEscalaDateRange(rangeStart, rangeEnd) || activeStep < 3) {
      return []
    }
    return buildProgrammingSlotsShifts({
      batchId,
      rangeStart,
      rangeEnd,
      slots,
      prefeituraScope: prefeituraScopeWithContratos,
      ubtScope,
      status: 'rascunho',
    })
  }, [
    activeStep,
    batchId,
    rangeStart,
    rangeEnd,
    slots,
    prefeituraScopeWithContratos,
    ubtScope,
  ])

  const previewShiftsWithContrato = useMemo(
    () =>
      previewShifts.map((shift) => ({
        ...shift,
        contratoEntidadeId: primaryContratoEntidadeId || null,
      })),
    [previewShifts, primaryContratoEntidadeId],
  )

  const handleContratosResolved = useCallback((contratos: EscalaContratoOptionApi[]) => {
    setContratosById((current) => registerContratosById(current, contratos))
  }, [])

  const handleContratoChange = useCallback(
    (prefeituraId: string, contratoId: string, contrato?: EscalaContratoOptionApi | null) => {
      setContratosPorPrefeitura((current) => ({ ...current, [prefeituraId]: contratoId }))
      if (contrato) {
        setContratosById((current) => registerContratosById(current, [contrato]))
      }
    setPrefeituraScope((current) => {
      if (current.prefeituraIds.includes(prefeituraId)) return current
      return { mode: 'selected', prefeituraIds: [...current.prefeituraIds, prefeituraId] }
    })
    setActivePrefeituraId(prefeituraId)
    },
    [],
  )

  const handleContratoLoadStateChange = useCallback(
    (prefeituraId: string, state: AdminEscalaContratoLoadState) => {
      setContratoLoadStateByPrefeitura((current) => ({ ...current, [prefeituraId]: state }))
    },
    [],
  )

  function handlePrefeituraScopeChange(scope: AdminEscalaPrefeituraScope) {
    setPrefeituraScope(scope)
    const nextIds = getSelectedPrefeituraIds(scope)
    setContratosPorPrefeitura((current) =>
      Object.fromEntries(Object.entries(current).filter(([id]) => nextIds.includes(id))),
    )
    setContratoLoadStateByPrefeitura((current) =>
      Object.fromEntries(Object.entries(current).filter(([id]) => nextIds.includes(id))),
    )
    if (activePrefeituraId && !nextIds.includes(activePrefeituraId)) {
      setActivePrefeituraId(nextIds[0] ?? null)
    }
  }

  function focusPrefeitura(id: string) {
    setActivePrefeituraId(id)
    if (!prefeituraScope.prefeituraIds.includes(id)) {
      handlePrefeituraScopeChange({
        mode: 'selected',
        prefeituraIds: [...prefeituraScope.prefeituraIds, id],
      })
    }
  }

  function togglePrefeituraSelection(id: string) {
    const isSelected = prefeituraScope.prefeituraIds.includes(id)
    const prefeituraIds = isSelected
      ? prefeituraScope.prefeituraIds.filter((pid) => pid !== id)
      : [...prefeituraScope.prefeituraIds, id]
    handlePrefeituraScopeChange({ mode: 'selected', prefeituraIds })
    if (!isSelected) {
      setActivePrefeituraId(id)
    } else if (activePrefeituraId === id) {
      setActivePrefeituraId(prefeituraIds[0] ?? null)
    }
  }

  function updateDraftSlot(patch: Partial<AdminEscalaProgrammingSlot>) {
    setDraftSlot((current) => ({ ...current, ...patch }))
  }

  function resetDraftSlot() {
    setDraftSlot(createInitialSlot())
    setEditingSlotId(null)
    setEditingOriginalSlot(null)
  }

  function cancelDraftEdit() {
    if (editingSlotId && editingOriginalSlot) {
      setSlots((current) => [...current, editingOriginalSlot])
    }
    resetDraftSlot()
    setValidationError(null)
  }

  function commitDraftSlot() {
    const err = validateProgrammingSlot(draftSlot, slotValidationOptions)
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError(null)
    const committed: AdminEscalaProgrammingSlot = {
      ...draftSlot,
      id: editingSlotId ?? createProgrammingSlotId(),
    }
    setSlots((current) => [...current, committed])
    resetDraftSlot()
  }

  function editCommittedSlot(slotId: string) {
    const slot = slots.find((item) => item.id === slotId)
    if (!slot) return
    if (editingSlotId) {
      setValidationError('Salve ou cancele a edição em andamento antes de editar outro plantão.')
      return
    }
    setValidationError(null)
    setDraftSlot({ ...slot })
    setEditingOriginalSlot({ ...slot })
    setEditingSlotId(slotId)
    setSlots((current) => current.filter((item) => item.id !== slotId))
  }

  function removeCommittedSlot(slotId: string) {
    if (editingSlotId === slotId) {
      resetDraftSlot()
    }
    setSlots((current) => current.filter((item) => item.id !== slotId))
    setValidationError(null)
  }

  function requestDeleteCommittedSlot(slotId: string) {
    const slot = slots.find((item) => item.id === slotId)
    if (!slot) return
    if (editingSlotId) {
      setValidationError('Salve ou cancele a edição em andamento antes de excluir um plantão.')
      return
    }
    const label = getSpecialtyById(slot.specialtyId)?.name ?? 'Plantão'
    setValidationError(null)
    setDeletePlantaoTarget({ slotId, label })
  }

  const verifyAdminPin = useCallback(
    async (pin: string) => {
      const token = getAccessToken()
      if (!token) return false
      try {
        await verifyAdminAuthorizationPin(token, pin)
        return true
      } catch {
        return false
      }
    },
    [getAccessToken],
  )

  function stepError(step: AdminEscalaComposeStepId): string | null {
    if (step === 1) {
      if (prefeituraScope.mode === 'selected' && prefeituraScope.prefeituraIds.length === 0) {
        return 'Selecione ao menos uma prefeitura.'
      }
      return validateAdminEscalaContratosPorPrefeitura({
        prefeituraIds: selectedPrefeituraIds,
        contratosPorPrefeitura,
        loadStateByPrefeitura: contratoLoadStateByPrefeitura,
      })
    }
    if (step === 2) {
      return escalaDateRangeError(rangeStart, rangeEnd)
    }
    if (step === 3) {
      if (specialtyOptions.length === 0) {
        return 'O contrato selecionado não possui especialidades autorizadas.'
      }
      if (hasPresencialSlot && ubtScope.mode === 'selected' && ubtScope.ubtIds.length === 0) {
        return 'Selecione ao menos uma UBT para plantão presencial.'
      }
      const slotsToCheck = slots.length > 0 ? slots : [draftSlot]
      if (slots.length === 0) {
        const draftError = validateProgrammingSlot(draftSlot, slotValidationOptions)
        if (draftError) return draftError
      } else {
        const allowedSpecialtyIds = new Set(specialtyOptions.map((option) => option.value))
        for (const slot of slotsToCheck) {
          if (!allowedSpecialtyIds.has(slot.specialtyId)) {
            return 'Uma ou mais especialidades não estão autorizadas no contrato selecionado.'
          }
          const slotError = validateProgrammingSlot(slot, slotValidationOptions)
          if (slotError) return slotError
        }
      }
      return null
    }
    return null
  }

  const maxReachableStep = useMemo(() => {
    if (stepError(1)) return 1
    if (stepError(2)) return 2
    return 3
  }, [
    prefeituraScope,
    selectedPrefeituraIds,
    contratosPorPrefeitura,
    contratoLoadStateByPrefeitura,
    rangeStart,
    rangeEnd,
    specialtyOptions,
    hasPresencialSlot,
    ubtScope,
    slots,
    draftSlot,
  ])

  function validateProgrammingSlotsList(slotsToValidate: AdminEscalaProgrammingSlot[]): string | null {
    if (specialtyOptions.length === 0) {
      return 'O contrato selecionado não possui especialidades autorizadas.'
    }
    if (
      slotsToValidate.some(
        (slot) => slot.modality === 'presencial_ubt' || slot.modality === 'hibrido',
      ) &&
      ubtScope.mode === 'selected' &&
      ubtScope.ubtIds.length === 0
    ) {
      return 'Selecione ao menos uma UBT para plantão presencial.'
    }
    if (slotsToValidate.length === 0) {
      return 'Adicione ao menos um plantão à lista.'
    }
    const allowedSpecialtyIds = new Set(specialtyOptions.map((option) => option.value))
    for (const slot of slotsToValidate) {
      if (!allowedSpecialtyIds.has(slot.specialtyId)) {
        return 'Uma ou mais especialidades não estão autorizadas no contrato selecionado.'
      }
      const slotError = validateProgrammingSlot(slot, slotValidationOptions)
      if (slotError) return slotError
    }
    const shiftCount = countProgrammingSlotsShifts({
      batchId,
      rangeStart,
      rangeEnd,
      slots: slotsToValidate,
      prefeituraScope: prefeituraScopeWithContratos,
      ubtScope,
      status: 'rascunho',
    })
    if (shiftCount === 0) {
      return singleDayPeriod
        ? 'Nenhum plantão será criado — revise o horário do plantão.'
        : 'Nenhum plantão será criado — revise dias da semana e o período.'
    }
    return null
  }

  function validateAll(publish: boolean, slotsToValidate = slots): string | null {
    for (const step of [1, 2, 3] as const) {
      const err = stepError(step)
      if (err) return err
    }
    const slotsErr = validateProgrammingSlotsList(slotsToValidate)
    if (slotsErr) return slotsErr

    const status: AdminEscalaShiftStatus = publish ? 'publicada' : 'rascunho'
    const generated = buildProgrammingSlotsShifts({
      batchId,
      rangeStart,
      rangeEnd,
      slots: slotsToValidate,
      prefeituraScope: prefeituraScopeWithContratos,
      ubtScope,
      status,
    }).map((shift) => ({
      ...shift,
      contratoEntidadeId: primaryContratoEntidadeId || null,
      status,
    }))
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
      return 'Plantões presenciais precisam de endereço completo.'
    }

    return null
  }

  function goNext() {
    const err = stepError(activeStep)
    if (err) {
      setValidationError(err)
      return
    }
    setValidationError(null)
    if (activeStep < 3) setActiveStep((activeStep + 1) as AdminEscalaComposeStepId)
  }

  function goBack() {
    setValidationError(null)
    if (activeStep > 1) setActiveStep((activeStep - 1) as AdminEscalaComposeStepId)
  }

  function handleRangeStartChange(value: string) {
    setRangeStart(value)
    if (rangeEnd && value > rangeEnd) {
      setRangeEnd(value)
    }
  }

  function handleRangeEndChange(value: string) {
    setRangeEnd(value)
  }

  async function handlePublish(status: AdminEscalaShiftStatus) {
    let slotsToSave = slots
    if (slotsToSave.length === 0 && !editingSlotId) {
      const draftError = validateProgrammingSlot(draftSlot, slotValidationOptions)
      if (draftError) {
        setValidationError(draftError)
        return
      }
      slotsToSave = [{ ...draftSlot, id: createProgrammingSlotId() }]
    }

    const error = validateAll(status === 'publicada', slotsToSave)
    if (error) {
      setValidationError(error)
      return
    }
    setValidationError(null)
    const generated = buildProgrammingSlotsShifts({
      batchId,
      rangeStart,
      rangeEnd,
      slots: slotsToSave,
      prefeituraScope: prefeituraScopeWithContratos,
      ubtScope,
      status,
    }).map((shift) => ({
      ...shift,
      contratoEntidadeId: primaryContratoEntidadeId || null,
      status,
      updatedAt: new Date().toISOString(),
    }))
    await onSaved(generated, {
      replaceBatchId: isEdit && editingBatch?.[0]?.batchId ? batchId : undefined,
      removeShiftIds:
        isEdit && editingBatch && !editingBatch[0]?.batchId
          ? editingBatch.map((s) => s.id)
          : undefined,
    })
  }

  const { title, hint } = stepHints[activeStep]

  const contentPadding =
    activeStep === 2
      ? 'px-5 py-5 sm:px-8 sm:py-6 lg:px-10'
      : 'px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10'

  const headerClass =
    activeStep === 1 || activeStep === 2 || activeStep === 3 ? 'mb-5 max-w-none' : 'mb-8 max-w-4xl'

  const stepBodyClass =
    activeStep === 1 || activeStep === 2 || activeStep === 3 ? 'w-full' : 'max-w-4xl'

  return (
    <>
    <div className="flex min-h-0 flex-1 flex-col bg-white lg:flex-row">
      <div className="shrink-0 border-b border-gray-100 bg-[#f8f9fb] px-4 py-3 lg:hidden">
        <AdminEscalaComposeSteps
          activeStep={activeStep}
          maxReachableStep={maxReachableStep}
          onStepChange={(step) => {
            setValidationError(null)
            setActiveStep(step)
          }}
          layout="horizontal"
        />
      </div>

      <aside className="hidden w-72 shrink-0 flex-col border-r border-gray-100 bg-[#f8f9fb] px-5 py-6 lg:flex xl:w-80">
        <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
          Nova escala
        </p>
        <AdminEscalaComposeSteps
          activeStep={activeStep}
          maxReachableStep={maxReachableStep}
          onStepChange={(step) => {
            setValidationError(null)
            setActiveStep(step)
          }}
          layout="vertical"
        />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className={`min-h-0 flex-1 overflow-y-auto ${contentPadding}`}>
          <header className={headerClass}>
            <h3 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
              {title}
            </h3>
            <p className="mt-1.5 text-sm text-gray-500 sm:text-base">{hint}</p>
          </header>

          <div className={stepBodyClass}>
            {activeStep === 1 ? (
              <div className="grid min-h-[min(32rem,55vh)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-0">
                <div className="min-w-0 lg:border-r lg:border-gray-100 lg:pr-8">
                  <p className="mb-4 text-sm font-bold text-gray-900">Prefeituras</p>
                  <AdminEscalaComposePrefeituraList
                    prefeituraScope={prefeituraScope}
                    activePrefeituraId={activePrefeituraId}
                    onTogglePrefeitura={togglePrefeituraSelection}
                    onActivePrefeituraChange={focusPrefeitura}
                  />
                </div>
                <div className="min-w-0 lg:pl-8">
                  <AdminEscalaComposeContratoColumn
                    prefeituraId={activePrefeituraId}
                    contratoId={
                      activePrefeituraId
                        ? (contratosPorPrefeitura[activePrefeituraId] ?? '')
                        : ''
                    }
                    specialtyIds={[...new Set(slots.map((s) => s.specialtyId))]}
                    onContratoChange={(contratoId, contrato) => {
                      if (!activePrefeituraId) return
                      handleContratoChange(activePrefeituraId, contratoId, contrato)
                    }}
                    onLoadStateChange={(state) => {
                      if (!activePrefeituraId) return
                      handleContratoLoadStateChange(activePrefeituraId, state)
                    }}
                    onContractsResolved={handleContratosResolved}
                  />
                  {selectedPrefeituraIds
                    .filter((id) => id !== activePrefeituraId)
                    .map((prefeituraId) => (
                      <div key={`contrato-loader-${prefeituraId}`} className="hidden" aria-hidden>
                        <AdminEscalaContratoField
                          variant="flat"
                          prefeituraScope={{ mode: 'selected', prefeituraIds: [prefeituraId] }}
                          specialtyIds={[...new Set(slots.map((s) => s.specialtyId))]}
                          value={contratosPorPrefeitura[prefeituraId] ?? ''}
                          onChange={(contratoId, contrato) =>
                            handleContratoChange(prefeituraId, contratoId, contrato)
                          }
                          onContractsLoaded={(count, contratos) => {
                            handleContratoLoadStateChange(prefeituraId, { count, resolved: true })
                            if (contratos?.length) handleContratosResolved(contratos)
                          }}
                        />
                      </div>
                    ))}
                  {selectedPrefeituraIds.length > 1 ? (
                    <p className="mt-4 text-xs text-gray-500">
                      {selectedPrefeituraIds.length} prefeituras selecionadas — clique em cada uma
                      à esquerda para definir o contrato.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {activeStep === 2 ? (
              <AdminEscalaComposePeriodStep
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onRangeStartChange={handleRangeStartChange}
                onRangeEndChange={handleRangeEndChange}
                previewShiftCount={previewShiftCount}
                singleWeekday={singleScheduleWeekday}
              />
            ) : null}

            {activeStep === 3 ? (
              <div className="space-y-6">
                {hasPresencialInForm ? (
                  <div className="rounded-2xl bg-sky-50/80 p-5 ring-1 ring-sky-100 sm:p-6">
                    <p className="mb-4 text-sm font-bold text-gray-900">Unidade presencial (UBT)</p>
                    <AdminEscalaComposeScopeCompact
                      prefeituraScope={prefeituraScope}
                      ubtScope={ubtScope}
                      showUbtFields
                      ubtOnly
                      onPrefeituraScopeChange={handlePrefeituraScopeChange}
                      onUbtScopeChange={setUbtScope}
                    />
                  </div>
                ) : null}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8 xl:gap-10">
                  <div className="min-w-0 space-y-4">
                    {specialtyOptions.length === 0 ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                        O contrato selecionado não possui especialidades autorizadas. Cadastre as
                        especialidades em Admin → Clientes → contrato da entidade.
                      </div>
                    ) : (
                    <AdminEscalaPlantaoBlockCard
                      slot={draftSlot}
                      title={editingSlotId ? 'Editando plantão' : 'Novo plantão'}
                      rangeStart={rangeStart}
                      rangeEnd={rangeEnd}
                      specialtyOptions={specialtyOptions}
                      ubtScope={ubtScope}
                      repasseReadOnly={batchRepasseReadOnly}
                      onChange={updateDraftSlot}
                    />
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={commitDraftSlot}
                        disabled={specialtyOptions.length === 0}
                        className="btn-brand-gradient inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-[0_6px_20px_rgba(255,107,0,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                        {editingSlotId
                          ? 'Salvar alterações na lista'
                          : 'Adicionar outro horário ou especialidade'}
                      </button>
                      {editingSlotId ? (
                        <button
                          type="button"
                          onClick={cancelDraftEdit}
                          className="rounded-xl px-5 py-3 text-sm font-semibold text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
                        >
                          Cancelar edição
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <AdminEscalaPlantaoSummaryList
                      slots={slots}
                      rangeStart={rangeStart}
                      rangeEnd={rangeEnd}
                      onEdit={editCommittedSlot}
                      onRemove={requestDeleteCommittedSlot}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {validationError && activeStep !== 1 ? (
              <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {validationError}
              </p>
            ) : null}
          </div>
        </div>

        <footer className="shrink-0 border-t border-gray-100 bg-white px-5 py-4 sm:px-8 lg:px-10">
          {validationError ? (
            <p
              role="alert"
              className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700"
            >
              {validationError}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={activeStep === 1}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>

            <p className="order-last w-full text-center text-sm text-gray-500 lg:hidden">
              <span className="font-bold text-gray-900">{previewShiftCount}</span> plantões
            </p>

            {activeStep < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="btn-brand-gradient inline-flex items-center gap-1.5 rounded-xl px-7 py-2.5 text-sm font-bold shadow-[0_6px_20px_rgba(255,107,0,0.28)]"
              >
                Continuar
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePublish('rascunho')}
                  disabled={previewShiftCount === 0 || isSaving}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  Salvar rascunho
                </button>
                <button
                  type="button"
                  onClick={() => handlePublish('publicada')}
                  disabled={previewShiftCount === 0 || isSaving}
                  className="btn-brand-gradient rounded-xl px-6 py-2.5 text-sm font-bold shadow-[0_6px_20px_rgba(255,107,0,0.28)] disabled:opacity-40"
                >
                  Publicar escala
                </button>
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>

    <PinUnlockModal
      open={deletePlantaoTarget !== null}
      onClose={() => setDeletePlantaoTarget(null)}
      onSuccess={() => {
        if (!deletePlantaoTarget) return
        removeCommittedSlot(deletePlantaoTarget.slotId)
        setDeletePlantaoTarget(null)
      }}
      verifyPin={verifyAdminPin}
      title="Excluir plantão"
      titleId="escala-delete-plantao-pin-title"
      description={
        deletePlantaoTarget
          ? `Para remover ${deletePlantaoTarget.label} da escala, informe sua senha de autorização de 6 dígitos.`
          : 'Informe sua senha de autorização de 6 dígitos para confirmar a exclusão.'
      }
      submitLabel="Confirmar exclusão"
      pinCompleteHint="Senha completa. Toque em confirmar exclusão."
      icon={Trash2}
    />
    </>
  )
}
