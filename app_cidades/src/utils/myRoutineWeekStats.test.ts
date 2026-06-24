import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { MyRoutineDayPlan, MyRoutineWeekPlan } from '../types/myRoutine'
import { emptyMyRoutineOnboardingRecord } from '../types/myRoutine'
import { generateWeekPlanFromOnboarding } from './myRoutinePlanEngine'
import {
  buildWeekDayPreviews,
  computeWeekSummary,
  countWeekEssentials,
  countWeekTasks,
  formatWeekRangeLabel,
  mergeWeekPlanTaskStatuses,
  reorderTasks,
  shiftWeekStartIso,
  syncMinimalIdsForDay,
  toggleTaskPriority,
} from './myRoutineWeekStats'

describe('myRoutineWeekStats', () => {
  it('computeWeekSummary agrega dias', () => {
    const days: Record<string, MyRoutineDayPlan> = {
      '2026-06-23': {
        dateIso: '2026-06-23',
        dayMode: 'normal',
        minimalRoutineTaskIds: ['a'],
        tasks: [
          {
            id: 'a',
            title: 'Essencial',
            category: 'other',
            scheduleType: 'fixed',
            priority: 'essential',
            block: 'morning',
            status: 'done',
          },
        ],
      },
      '2026-06-24': {
        dateIso: '2026-06-24',
        dayMode: 'light',
        minimalRoutineTaskIds: ['b'],
        tasks: [
          {
            id: 'b',
            title: 'Outro',
            category: 'other',
            scheduleType: 'fixed',
            priority: 'essential',
            block: 'morning',
            status: 'pending',
          },
        ],
      },
    }

    const summary = computeWeekSummary(days)
    assert.equal(summary.minimalOkDays, 1)
    assert.equal(summary.tasksDone, 1)
    assert.equal(summary.lightDays, 1)
  })

  it('shiftWeekStartIso move 1 semana', () => {
    assert.equal(shiftWeekStartIso('2026-06-23', -1), '2026-06-16')
    assert.equal(shiftWeekStartIso('2026-06-23', 1), '2026-06-30')
  })

  it('formatWeekRangeLabel', () => {
    const label = formatWeekRangeLabel('2026-06-23')
    assert.match(label, /23/)
  })

  it('reorderTasks e toggleTaskPriority', () => {
    const tasks = [
      { id: '1', title: 'A', priority: 'essential' as const },
      { id: '2', title: 'B', priority: 'desirable' as const },
    ] as MyRoutineDayPlan['tasks']

    const reordered = reorderTasks(tasks, 0, 1)
    assert.equal(reordered[0]?.id, '2')
    assert.equal(toggleTaskPriority(tasks[0]!).priority, 'desirable')
  })

  it('syncMinimalIdsForDay', () => {
    const day: MyRoutineDayPlan = {
      dateIso: '2026-06-23',
      dayMode: 'normal',
      minimalRoutineTaskIds: [],
      tasks: [
        {
          id: '1',
          title: 'A',
          category: 'other',
          scheduleType: 'fixed',
          priority: 'essential',
          block: 'morning',
          status: 'pending',
        },
        {
          id: '2',
          title: 'B',
          category: 'other',
          scheduleType: 'fixed',
          priority: 'bonus',
          block: 'morning',
          status: 'pending',
        },
      ],
    }

    const synced = syncMinimalIdsForDay(day)
    assert.deepEqual(synced.minimalRoutineTaskIds, ['1'])
  })

  it('mergeWeekPlanTaskStatuses preserva status', () => {
    const previous: MyRoutineWeekPlan = {
      weekStartIso: '2026-06-23',
      days: {
        '2026-06-23': {
          dateIso: '2026-06-23',
          dayMode: 'normal',
          minimalRoutineTaskIds: ['t1'],
          tasks: [
            {
              id: 't1',
              title: 'Tomar remédios',
              category: 'medicine',
              scheduleType: 'fixed',
              priority: 'essential',
              block: 'morning',
              status: 'done',
            },
          ],
        },
      },
      recurringTemplates: [],
      templateId: 'day-busy',
      updatedAt: '2026-06-23T00:00:00.000Z',
    }

    const next: MyRoutineWeekPlan = {
      ...previous,
      days: {
        '2026-06-23': {
          ...previous.days['2026-06-23'],
          tasks: [
            {
              id: 'new-id',
              title: 'Tomar remédios',
              category: 'medicine',
              scheduleType: 'fixed',
              priority: 'essential',
              block: 'morning',
              status: 'pending',
            },
          ],
        },
      },
    }

    const merged = mergeWeekPlanTaskStatuses(previous, next)
    assert.equal(merged.days['2026-06-23']?.tasks[0]?.status, 'done')
    assert.equal(countWeekTasks(merged), 1)
  })

  it('buildWeekDayPreviews monta 7 dias com flags', () => {
    const record = {
      ...emptyMyRoutineOnboardingRecord(),
      completed: true,
      selectedTemplateId: 'health-focus' as const,
      idealRoutine: {
        weekday: { essential: ['Beber água'], desirable: [], bonus: [] },
        weekend: { essential: [], desirable: [], bonus: [] },
      },
    }
    const plan = generateWeekPlanFromOnboarding(record, new Date('2026-06-23T10:00:00'))
    const previews = buildWeekDayPreviews(plan, plan.days, '2026-06-23')

    assert.equal(previews.length, 7)
    assert.ok(previews.some((day) => day.isToday))
    assert.ok(previews.every((day) => day.dateIso.length === 10))
  })

  it('countWeekEssentials soma essenciais da semana', () => {
    const plan: MyRoutineWeekPlan = {
      weekStartIso: '2026-06-23',
      days: {
        '2026-06-23': {
          dateIso: '2026-06-23',
          dayMode: 'normal',
          minimalRoutineTaskIds: ['a', 'b'],
          tasks: [],
        },
        '2026-06-24': {
          dateIso: '2026-06-24',
          dayMode: 'normal',
          minimalRoutineTaskIds: ['c'],
          tasks: [],
        },
      },
      recurringTemplates: [],
      templateId: 'day-busy',
      updatedAt: '2026-06-23T00:00:00.000Z',
    }

    assert.equal(countWeekEssentials(plan), 3)
    assert.equal(countWeekTasks(plan), 0)
  })
})
