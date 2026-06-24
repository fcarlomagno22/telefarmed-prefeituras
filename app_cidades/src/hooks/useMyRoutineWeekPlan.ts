import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadMyRoutineDayPlan, saveMyRoutineDayPlan } from '../data/myRoutineDailyStorage'
import {
  loadMyRoutineOnboardingRecord,
  patchMyRoutineOnboardingRecord,
  saveMyRoutineOnboardingRecord,
} from '../data/myRoutineOnboardingStorage'
import {
  loadMyRoutineWeekPlan,
  saveMyRoutineWeekPlan,
} from '../data/myRoutinePlanStorage'
import {
  loadMyRoutineWeeklyReviewForWeek,
  markMyRoutineWeeklyReviewApplied,
  saveMyRoutineWeeklyReview,
} from '../data/myRoutineWeeklyReviewStorage'
import type {
  MyRoutineDayPlan,
  MyRoutineOnboardingRecord,
  MyRoutineTask,
  MyRoutineWeekendMode,
  MyRoutineWeeklyReview,
  MyRoutineWeekPlan,
} from '../types/myRoutine'
import {
  applyWeeklyReviewAdjustments,
  buildWeekDateIsos,
  generateWeekPlanFromOnboarding,
  getWeekStartIso,
} from '../utils/myRoutinePlanEngine'
import {
  applyTemplateToWeekPlan,
  buildWeekDayPreviews,
  cloneTaskWithId,
  computeWeekSummary,
  countWeekEssentials,
  countWeekTasks,
  createRecurringTaskSeed,
  formatWeekRangeLabel,
  mergeWeekPlanTaskStatuses,
  shiftWeekStartIso,
  syncMinimalIdsForDay,
} from '../utils/myRoutineWeekStats'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'

type UseMyRoutineWeekPlanOptions = {
  patientCpf: string
  record: MyRoutineOnboardingRecord
  refreshKey?: number
}

function createReviewId() {
  return `review-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function useMyRoutineWeekPlan({
  patientCpf,
  record: initialRecord,
  refreshKey = 0,
}: UseMyRoutineWeekPlanOptions) {
  const [weekStartIso, setWeekStartIso] = useState(() => getWeekStartIso())
  const [weekPlan, setWeekPlan] = useState<MyRoutineWeekPlan | null>(null)
  const [mergedDays, setMergedDays] = useState<Record<string, MyRoutineDayPlan>>({})
  const [onboardingRecord, setOnboardingRecord] = useState(initialRecord)
  const [weeklyReview, setWeeklyReview] = useState<MyRoutineWeeklyReview | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadWeek = useCallback(async () => {
    setIsLoading(true)
    try {
      const storedRecord = await loadMyRoutineOnboardingRecord(patientCpf)
      setOnboardingRecord(storedRecord)

      let plan = await loadMyRoutineWeekPlan(patientCpf)
      if (!plan || plan.weekStartIso !== weekStartIso) {
        const reference = new Date(`${weekStartIso}T12:00:00`)
        const generated = generateWeekPlanFromOnboarding(storedRecord, reference)
        if (plan && plan.weekStartIso !== weekStartIso) {
          plan = { ...generated, weekStartIso }
        } else {
          plan = plan ?? generated
        }
        if (plan.weekStartIso !== weekStartIso) {
          plan = { ...plan, weekStartIso, days: generated.days }
        }
        await saveMyRoutineWeekPlan(patientCpf, plan)
      }

      const dateIsos = buildWeekDateIsos(plan.weekStartIso)
      const dailyEntries = await Promise.all(
        dateIsos.map(async (dateIso) => {
          const daily = await loadMyRoutineDayPlan(patientCpf, dateIso)
          return [dateIso, daily ?? plan!.days[dateIso]] as const
        }),
      )

      const merged = Object.fromEntries(dailyEntries.filter(([, value]) => value != null))
      const review = await loadMyRoutineWeeklyReviewForWeek(patientCpf, plan.weekStartIso)

      setWeekPlan(plan)
      setMergedDays(merged)
      setWeeklyReview(review)
    } finally {
      setIsLoading(false)
    }
  }, [patientCpf, weekStartIso])

  useEffect(() => {
    void loadWeek()
  }, [loadWeek, refreshKey])

  const summary = useMemo(() => computeWeekSummary(mergedDays), [mergedDays])
  const dayPreviews = useMemo(
    () => (weekPlan ? buildWeekDayPreviews(weekPlan, mergedDays) : []),
    [mergedDays, weekPlan],
  )
  const weekLabel = useMemo(() => formatWeekRangeLabel(weekStartIso), [weekStartIso])

  const navigateWeek = useCallback((deltaWeeks: number) => {
    setWeekStartIso((current) => shiftWeekStartIso(current, deltaWeeks))
  }, [])

  const selectWeek = useCallback((nextWeekStartIso: string) => {
    setWeekStartIso(nextWeekStartIso)
  }, [])

  const persistWeekPlan = useCallback(
    async (next: MyRoutineWeekPlan) => {
      setWeekPlan(next)
      await saveMyRoutineWeekPlan(patientCpf, next)
      const dateIsos = buildWeekDateIsos(next.weekStartIso)
      const merged: Record<string, MyRoutineDayPlan> = {}
      for (const dateIso of dateIsos) {
        merged[dateIso] = next.days[dateIso] ?? mergedDays[dateIso]
      }
      setMergedDays(merged)
      return next
    },
    [mergedDays, patientCpf],
  )

  const saveDayPlan = useCallback(
    async (dayPlan: MyRoutineDayPlan) => {
      if (!weekPlan) return null
      const synced = syncMinimalIdsForDay(dayPlan)
      await saveMyRoutineDayPlan(patientCpf, synced)
      const nextPlan: MyRoutineWeekPlan = {
        ...weekPlan,
        days: { ...weekPlan.days, [synced.dateIso]: synced },
        updatedAt: new Date().toISOString(),
      }
      await persistWeekPlan(nextPlan)
      setMergedDays((current) => ({ ...current, [synced.dateIso]: synced }))
      return synced
    },
    [patientCpf, persistWeekPlan, weekPlan],
  )

  const addRecurringHabit = useCallback(
    async (title: string, priority: MyRoutineTask['priority'] = 'desirable') => {
      if (!weekPlan || !title.trim()) return null
      const id = `recurring-${Date.now()}`
      const task = cloneTaskWithId({ ...createRecurringTaskSeed(title), priority }, id)
      const next: MyRoutineWeekPlan = {
        ...weekPlan,
        recurringTemplates: [...weekPlan.recurringTemplates, task],
        updatedAt: new Date().toISOString(),
      }
      return persistWeekPlan(next)
    },
    [persistWeekPlan, weekPlan],
  )

  const updateRecurringHabit = useCallback(
    async (taskId: string, patch: Partial<MyRoutineTask>) => {
      if (!weekPlan) return null
      const next: MyRoutineWeekPlan = {
        ...weekPlan,
        recurringTemplates: weekPlan.recurringTemplates.map((task) =>
          task.id === taskId ? { ...task, ...patch } : task,
        ),
        updatedAt: new Date().toISOString(),
      }
      return persistWeekPlan(next)
    },
    [persistWeekPlan, weekPlan],
  )

  const setWeekendMode = useCallback(
    async (weekendMode: MyRoutineWeekendMode) => {
      if (!weekPlan) return null
      const nextRecord = await patchMyRoutineOnboardingRecord(patientCpf, { weekendMode })
      setOnboardingRecord(nextRecord)
      const reference = new Date(`${weekPlan.weekStartIso}T12:00:00`)
      const regenerated = generateWeekPlanFromOnboarding(nextRecord, reference)
      const merged = mergeWeekPlanTaskStatuses(weekPlan, {
        ...regenerated,
        weekStartIso: weekPlan.weekStartIso,
        recurringTemplates: weekPlan.recurringTemplates,
      })
      return persistWeekPlan(merged)
    },
    [patientCpf, persistWeekPlan, weekPlan],
  )

  const applyTemplate = useCallback(
    async (templateId: NonNullable<MyRoutineOnboardingRecord['selectedTemplateId']>) => {
      if (!weekPlan) return null
      const nextRecord = { ...onboardingRecord, selectedTemplateId: templateId }
      await saveMyRoutineOnboardingRecord(patientCpf, nextRecord)
      setOnboardingRecord(nextRecord)
      const merged = applyTemplateToWeekPlan(
        weekPlan,
        nextRecord,
        templateId,
        generateWeekPlanFromOnboarding,
      )
      return persistWeekPlan({ ...merged, templateId, updatedAt: new Date().toISOString() })
    },
    [onboardingRecord, patientCpf, persistWeekPlan, weekPlan],
  )

  const previewReviewApplication = useCallback(
    (review: Pick<MyRoutineWeeklyReview, 'adjustment' | 'blocked'>) => {
      if (!weekPlan) {
        return { beforeTasks: 0, afterTasks: 0, beforeEssentials: 0, afterEssentials: 0 }
      }
      const after = applyWeeklyReviewAdjustments(weekPlan, review)
      return {
        beforeTasks: countWeekTasks(weekPlan),
        afterTasks: countWeekTasks(after),
        beforeEssentials: countWeekEssentials(weekPlan),
        afterEssentials: countWeekEssentials(after),
      }
    },
    [weekPlan],
  )

  const submitWeeklyReview = useCallback(
    async (payload: Pick<MyRoutineWeeklyReview, 'workedWell' | 'blocked' | 'adjustment'>) => {
      if (!weekPlan) return null
      const review: MyRoutineWeeklyReview = {
        id: createReviewId(),
        weekStartIso: weekPlan.weekStartIso,
        createdAt: new Date().toISOString(),
        workedWell: payload.workedWell,
        blocked: payload.blocked,
        adjustment: payload.adjustment,
        appliedAt: null,
      }
      await saveMyRoutineWeeklyReview(patientCpf, review)
      setWeeklyReview(review)
      return review
    },
    [patientCpf, weekPlan],
  )

  const applyWeeklyReview = useCallback(
    async (review: MyRoutineWeeklyReview) => {
      if (!weekPlan) return null
      const adjusted = applyWeeklyReviewAdjustments(weekPlan, review)
      await persistWeekPlan(adjusted)
      await markMyRoutineWeeklyReviewApplied(patientCpf, review.id)
      setWeeklyReview({ ...review, appliedAt: new Date().toISOString() })
      return adjusted
    },
    [patientCpf, persistWeekPlan, weekPlan],
  )

  const previewTemplateChange = useCallback(
    (templateId: NonNullable<MyRoutineOnboardingRecord['selectedTemplateId']>) => {
      if (!weekPlan) return { beforeTasks: 0, afterTasks: 0 }
      const merged = applyTemplateToWeekPlan(
        weekPlan,
        onboardingRecord,
        templateId,
        generateWeekPlanFromOnboarding,
      )
      return {
        beforeTasks: countWeekTasks(weekPlan),
        afterTasks: countWeekTasks(merged),
      }
    },
    [onboardingRecord, weekPlan],
  )

  return {
    weekStartIso,
    weekPlan,
    mergedDays,
    summary,
    dayPreviews,
    weekLabel,
    onboardingRecord,
    weeklyReview,
    isLoading,
    navigateWeek,
    selectWeek,
    saveDayPlan,
    addRecurringHabit,
    updateRecurringHabit,
    setWeekendMode,
    applyTemplate,
    previewTemplateChange,
    previewReviewApplication,
    submitWeeklyReview,
    applyWeeklyReview,
    reload: loadWeek,
    todayIso: toLocalDateIso(new Date()),
  }
}
