import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadMyRoutineDayHistory } from '../data/myRoutineDailyStorage'
import {
  loadMyRoutineOnboardingRecord,
  patchMyRoutineOnboardingRecord,
  saveMyRoutineOnboardingRecord,
} from '../data/myRoutineOnboardingStorage'
import {
  loadMyRoutinePreferences,
  patchMyRoutinePreferences,
  saveMyRoutinePreferences,
} from '../data/myRoutinePreferencesStorage'
import { loadMyRoutineWeekPlan, saveMyRoutineWeekPlan } from '../data/myRoutinePlanStorage'
import type {
  MyRoutineIdealRoutine,
  MyRoutineOnboardingRecord,
  MyRoutinePreferences,
} from '../types/myRoutine'
import { generateWeekPlanFromOnboarding } from '../utils/myRoutinePlanEngine'
import {
  buildWeeklyHistorySeries,
  type MyRoutineWeeklyHistoryPoint,
} from '../utils/myRoutineHistoryStats'
import { mergeWeekPlanTaskStatuses } from '../utils/myRoutineWeekStats'
import { MY_ROUTINE_CURRENT_ACTIVITY_OPTIONS } from '../types/myRoutine'

type UseMyRoutineProfileOptions = {
  patientCpf: string
  record: MyRoutineOnboardingRecord
  refreshKey?: number
}

export function useMyRoutineProfile({
  patientCpf,
  record: initialRecord,
  refreshKey = 0,
}: UseMyRoutineProfileOptions) {
  const [onboardingRecord, setOnboardingRecord] = useState(initialRecord)
  const [preferences, setPreferences] = useState<MyRoutinePreferences | null>(null)
  const [historySeries, setHistorySeries] = useState<MyRoutineWeeklyHistoryPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const [storedRecord, prefs, history] = await Promise.all([
        loadMyRoutineOnboardingRecord(patientCpf),
        loadMyRoutinePreferences(patientCpf),
        loadMyRoutineDayHistory(patientCpf),
      ])

      setOnboardingRecord(storedRecord)
      setPreferences(prefs)
      setHistorySeries(buildWeeklyHistorySeries(history, 4))
    } finally {
      setIsLoading(false)
    }
  }, [patientCpf])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile, refreshKey])

  const currentActivityLabels = useMemo(() => {
    const ids = new Set(
      onboardingRecord.currentRoutineBlocks.flatMap((block) => block.activityIds),
    )
    return MY_ROUTINE_CURRENT_ACTIVITY_OPTIONS.filter((option) => ids.has(option.id)).map(
      (option) => option.label,
    )
  }, [onboardingRecord.currentRoutineBlocks])

  const essentials = useMemo(
    () => onboardingRecord.idealRoutine.weekday.essential,
    [onboardingRecord.idealRoutine.weekday.essential],
  )

  const saveEssentials = useCallback(
    async (nextEssentials: string[]) => {
      const idealRoutine: MyRoutineIdealRoutine = {
        ...onboardingRecord.idealRoutine,
        weekday: {
          ...onboardingRecord.idealRoutine.weekday,
          essential: nextEssentials,
        },
      }
      const nextRecord = { ...onboardingRecord, idealRoutine }
      await saveMyRoutineOnboardingRecord(patientCpf, nextRecord)
      setOnboardingRecord(nextRecord)

      const weekPlan = await loadMyRoutineWeekPlan(patientCpf)
      if (weekPlan) {
        const regenerated = generateWeekPlanFromOnboarding(nextRecord)
        const merged = mergeWeekPlanTaskStatuses(weekPlan, {
          ...regenerated,
          weekStartIso: weekPlan.weekStartIso,
          recurringTemplates: weekPlan.recurringTemplates,
        })
        await saveMyRoutineWeekPlan(patientCpf, merged)
      }

      return nextRecord
    },
    [onboardingRecord, patientCpf],
  )

  const savePreferences = useCallback(
    async (patch: Partial<MyRoutinePreferences>) => {
      const next = await patchMyRoutinePreferences(patientCpf, patch)
      setPreferences(next)
      return next
    },
    [patientCpf],
  )

  const requestPartialOnboardingRefresh = useCallback(async () => {
    const next = await patchMyRoutineOnboardingRecord(patientCpf, {
      completed: false,
      completedAt: null,
    })
    setOnboardingRecord(next)
    return next
  }, [patientCpf])

  return {
    onboardingRecord,
    preferences,
    historySeries,
    currentActivityLabels,
    essentials,
    isLoading,
    reload: loadProfile,
    saveEssentials,
    savePreferences,
    requestPartialOnboardingRefresh,
  }
}

export const MY_ROUTINE_MAX_ESSENTIALS = 5
