import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  appendMyRoutineDayHistoryFromPlan,
  loadMyRoutineDayClosure,
  loadMyRoutineDayPlan,
  patchMyRoutineDayPlan,
  saveMyRoutineDayClosure,
  saveMyRoutineDayPlan,
} from '../data/myRoutineDailyStorage'
import { loadMyRoutineWeekPlan, saveMyRoutineWeekPlan } from '../data/myRoutinePlanStorage'
import type {
  MyRoutineDayClosure,
  MyRoutineDayPlan,
  MyRoutineOnboardingRecord,
  MyRoutineTask,
} from '../types/myRoutine'
import {
  generateWeekPlanFromOnboarding,
  getTodayPlan,
  pickNextTask,
  suggestLightDayPlan,
} from '../utils/myRoutinePlanEngine'
import {
  countEssentialSkips,
  createAdhocTaskId,
  resolveMyRoutineDayPhase,
} from '../utils/myRoutineTodayHelpers'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'

type UseMyRoutineTodayPlanOptions = {
  patientCpf: string
  record: MyRoutineOnboardingRecord
  refreshKey?: number
}

export function useMyRoutineTodayPlan({
  patientCpf,
  record,
  refreshKey = 0,
}: UseMyRoutineTodayPlanOptions) {
  const dateIso = useMemo(() => toLocalDateIso(new Date()), [refreshKey])
  const [dayPlan, setDayPlan] = useState<MyRoutineDayPlan | null>(null)
  const [dayClosure, setDayClosure] = useState<MyRoutineDayClosure | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadToday = useCallback(async () => {
    setIsLoading(true)
    try {
      const [storedPlan, closure] = await Promise.all([
        loadMyRoutineDayPlan(patientCpf, dateIso),
        loadMyRoutineDayClosure(patientCpf, dateIso),
      ])

      if (storedPlan) {
        setDayPlan(storedPlan)
        setDayClosure(closure)
        return
      }

      let weekPlan = await loadMyRoutineWeekPlan(patientCpf)
      if (!weekPlan) {
        weekPlan = generateWeekPlanFromOnboarding(record)
        await saveMyRoutineWeekPlan(patientCpf, weekPlan)
      }

      const seeded = getTodayPlan(weekPlan, dateIso)
      await saveMyRoutineDayPlan(patientCpf, seeded)
      setDayPlan(seeded)
      setDayClosure(closure)
    } finally {
      setIsLoading(false)
    }
  }, [dateIso, patientCpf, record])

  useEffect(() => {
    void loadToday()
  }, [loadToday])

  const persistPlan = useCallback(
    async (next: MyRoutineDayPlan) => {
      setDayPlan(next)
      await saveMyRoutineDayPlan(patientCpf, next)
      await appendMyRoutineDayHistoryFromPlan(patientCpf, next)
      return next
    },
    [patientCpf],
  )

  const updateTask = useCallback(
    async (taskId: string, patch: Partial<MyRoutineTask>) => {
      if (!dayPlan) return null
      const tasks = dayPlan.tasks.map((task) =>
        task.id === taskId ? { ...task, ...patch } : task,
      )
      return persistPlan({ ...dayPlan, tasks })
    },
    [dayPlan, persistPlan],
  )

  const markTaskDone = useCallback(
    async (taskId: string) => updateTask(taskId, { status: 'done', snoozedUntil: null }),
    [updateTask],
  )

  const snoozeTask = useCallback(
    async (taskId: string, minutes: number) => {
      const until = new Date(Date.now() + minutes * 60_000).toISOString()
      return updateTask(taskId, { status: 'snoozed', snoozedUntil: until })
    },
    [updateTask],
  )

  const skipTask = useCallback(
    async (taskId: string, reason?: string) =>
      updateTask(taskId, {
        status: 'skipped',
        skipReason: reason?.trim() || null,
        snoozedUntil: null,
      }),
    [updateTask],
  )

  const simplifyDay = useCallback(async () => {
    if (!dayPlan) return null
    const next = suggestLightDayPlan(dayPlan)
    return persistPlan(next)
  }, [dayPlan, persistPlan])

  const addQuickTask = useCallback(
    async (title: string, block: MyRoutineTask['block'] = 'anytime') => {
      if (!dayPlan || !title.trim()) return null
      const task: MyRoutineTask = {
        id: createAdhocTaskId(),
        title: title.trim(),
        category: 'other',
        scheduleType: 'trigger',
        triggerLabel: 'Só hoje',
        priority: 'desirable',
        block,
        status: 'pending',
        time: null,
        windowStart: null,
        windowEnd: null,
        recurrence: null,
        linkedModule: null,
      }
      return persistPlan({ ...dayPlan, tasks: [...dayPlan.tasks, task] })
    },
    [dayPlan, persistPlan],
  )

  const addReminderTask = useCallback(
    async (title: string, time: string | null) => {
      if (!dayPlan || !title.trim()) return null
      const task: MyRoutineTask = {
        id: createAdhocTaskId(),
        title: title.trim(),
        category: 'other',
        scheduleType: time ? 'fixed' : 'trigger',
        time,
        triggerLabel: time ? null : 'Lembrete',
        priority: 'desirable',
        block: 'anytime',
        status: 'pending',
        windowStart: null,
        windowEnd: null,
        recurrence: null,
        linkedModule: null,
      }
      return persistPlan({ ...dayPlan, tasks: [...dayPlan.tasks, task] })
    },
    [dayPlan, persistPlan],
  )

  const saveEditedTask = useCallback(
    async (taskId: string, patch: Partial<MyRoutineTask>) => {
      if (!dayPlan) return null
      const tasks = dayPlan.tasks.map((task) =>
        task.id === taskId ? { ...task, ...patch } : task,
      )
      let minimalRoutineTaskIds = [...dayPlan.minimalRoutineTaskIds]
      const updatedTask = tasks.find((task) => task.id === taskId)
      if (updatedTask?.priority === 'essential') {
        if (!minimalRoutineTaskIds.includes(taskId)) {
          minimalRoutineTaskIds.push(taskId)
        }
      } else {
        minimalRoutineTaskIds = minimalRoutineTaskIds.filter((id) => id !== taskId)
      }
      return persistPlan({ ...dayPlan, tasks, minimalRoutineTaskIds })
    },
    [dayPlan, persistPlan],
  )

  const saveDayClosure = useCallback(
    async (closure: Omit<MyRoutineDayClosure, 'dateIso' | 'createdAt'>) => {
      const payload: MyRoutineDayClosure = {
        ...closure,
        dateIso,
        createdAt: new Date().toISOString(),
      }
      await saveMyRoutineDayClosure(patientCpf, payload)
      setDayClosure(payload)
      return payload
    },
    [dateIso, patientCpf],
  )

  const nextTask = useMemo(
    () => (dayPlan ? pickNextTask(dayPlan) : null),
    [dayPlan],
  )

  const dayPhase = useMemo(
    () =>
      dayPlan ? resolveMyRoutineDayPhase(dayPlan, dayClosure != null) : 'planned',
    [dayClosure, dayPlan],
  )

  const essentialSkipCount = useMemo(
    () => (dayPlan ? countEssentialSkips(dayPlan) : 0),
    [dayPlan],
  )

  return {
    dateIso,
    dayPlan,
    dayClosure,
    dayPhase,
    nextTask,
    essentialSkipCount,
    isLoading,
    reload: loadToday,
    markTaskDone,
    snoozeTask,
    skipTask,
    simplifyDay,
    addQuickTask,
    addReminderTask,
    saveEditedTask,
    saveDayClosure,
    persistPlan,
  }
}
