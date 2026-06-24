import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { emptyMyRoutineOnboardingRecord } from '../types/myRoutine'
import {
  applyWeeklyReviewAdjustments,
  computeMinimalRoutineProgress,
  generateWeekPlanFromOnboarding,
  getTodayPlan,
  pickNextTask,
  shouldSuggestSimplify,
  suggestLightDayPlan,
} from './myRoutinePlanEngine'
import { toLocalDateIso } from './runWalkWeeklyChart'

describe('generateWeekPlanFromOnboarding', () => {
  it('gera 7 dias com essenciais na rotina mínima', () => {
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
    assert.equal(Object.keys(plan.days).length, 7)
    assert.ok(plan.weekStartIso)

    const monday = plan.days[plan.weekStartIso]
    assert.ok(monday)
    assert.ok(monday.minimalRoutineTaskIds.length >= 1)
  })

  it('usa template selecionado no record', () => {
    const record = {
      ...emptyMyRoutineOnboardingRecord(),
      completed: true,
      selectedTemplateId: 'day-busy' as const,
      idealRoutine: {
        weekday: { essential: ['Alongar'], desirable: [], bonus: [] },
        weekend: { essential: [], desirable: [], bonus: [] },
      },
    }

    const plan = generateWeekPlanFromOnboarding(record, new Date('2026-06-23T10:00:00'))
    assert.equal(plan.templateId, 'day-busy')
    assert.ok(plan.recurringTemplates.length > 0)
  })

  it('marca fim de semana como leve no modo descanso', () => {
    const record = {
      ...emptyMyRoutineOnboardingRecord(),
      completed: true,
      weekendMode: 'rest' as const,
      idealRoutine: {
        weekday: { essential: ['Beber água'], desirable: ['Caminhar'], bonus: [] },
        weekend: { essential: ['Descansar'], desirable: [], bonus: [] },
      },
    }

    const plan = generateWeekPlanFromOnboarding(record, new Date('2026-06-23T10:00:00'))
    const saturdayIso = Object.keys(plan.days).find((iso) => {
      const day = new Date(`${iso}T12:00:00`).getDay()
      return day === 6
    })

    assert.ok(saturdayIso)
    assert.equal(plan.days[saturdayIso!]?.dayMode, 'light')
  })
})

describe('getTodayPlan', () => {
  it('retorna plano do dia ou vazio', () => {
    const record = emptyMyRoutineOnboardingRecord()
    const plan = generateWeekPlanFromOnboarding(record)
    const dateIso = plan.weekStartIso
    const day = getTodayPlan(plan, dateIso)
    assert.equal(day.dateIso, dateIso)
    assert.ok(day.tasks.length >= 0)
  })
})

describe('suggestLightDayPlan', () => {
  it('mantém só essenciais e marca dia leve', () => {
    const dateIso = toLocalDateIso(new Date())
    const dayPlan = {
      dateIso,
      dayMode: 'normal' as const,
      minimalRoutineTaskIds: ['e1'],
      tasks: [
        {
          id: 'e1',
          title: 'Essencial',
          category: 'health' as const,
          scheduleType: 'fixed' as const,
          time: '08:00',
          priority: 'essential' as const,
          block: 'morning' as const,
          status: 'pending' as const,
        },
        {
          id: 'd1',
          title: 'Desejável',
          category: 'other' as const,
          scheduleType: 'window' as const,
          windowStart: '12:00',
          windowEnd: '13:00',
          priority: 'desirable' as const,
          block: 'afternoon' as const,
          status: 'pending' as const,
        },
      ],
    }

    const light = suggestLightDayPlan(dayPlan)
    assert.equal(light.dayMode, 'light')
    assert.equal(light.tasks.length, 1)
    assert.equal(light.tasks[0]?.id, 'e1')
  })
})

describe('computeMinimalRoutineProgress', () => {
  it('calcula ratio da rotina mínima', () => {
    const progress = computeMinimalRoutineProgress({
      dateIso: '2026-06-23',
      dayMode: 'normal',
      minimalRoutineTaskIds: ['a', 'b'],
      tasks: [
        {
          id: 'a',
          title: 'A',
          category: 'health',
          scheduleType: 'fixed',
          time: '08:00',
          priority: 'essential',
          block: 'morning',
          status: 'done',
        },
        {
          id: 'b',
          title: 'B',
          category: 'health',
          scheduleType: 'fixed',
          time: '09:00',
          priority: 'essential',
          block: 'morning',
          status: 'pending',
        },
      ],
    })

    assert.equal(progress.done, 1)
    assert.equal(progress.total, 2)
    assert.equal(progress.ratio, 0.5)
  })
})

describe('pickNextTask', () => {
  it('prioriza tarefa pendente mais cedo', () => {
    const dayPlan = {
      dateIso: '2026-06-23',
      dayMode: 'normal' as const,
      minimalRoutineTaskIds: [],
      tasks: [
        {
          id: 'late',
          title: 'Tarde',
          category: 'other',
          scheduleType: 'fixed',
          time: '18:00',
          priority: 'desirable',
          block: 'evening',
          status: 'pending',
        },
        {
          id: 'early',
          title: 'Cedo',
          category: 'other',
          scheduleType: 'fixed',
          time: '07:30',
          priority: 'essential',
          block: 'morning',
          status: 'pending',
        },
      ],
    }

    const next = pickNextTask(dayPlan, new Date('2026-06-23T10:00:00'))
    assert.equal(next?.id, 'early')
  })

  it('ignora tarefa adiada enquanto snooze estiver ativo', () => {
    const dayPlan = {
      dateIso: '2026-06-23',
      dayMode: 'normal' as const,
      minimalRoutineTaskIds: [],
      tasks: [
        {
          id: 'snoozed',
          title: 'Adiada',
          category: 'other',
          scheduleType: 'fixed',
          time: '07:00',
          priority: 'essential',
          block: 'morning',
          status: 'snoozed',
          snoozedUntil: '2026-06-23T18:00:00.000Z',
        },
        {
          id: 'available',
          title: 'Disponível',
          category: 'other',
          scheduleType: 'fixed',
          time: '09:00',
          priority: 'desirable',
          block: 'morning',
          status: 'pending',
        },
      ],
    }

    const duringSnooze = pickNextTask(dayPlan, new Date('2026-06-23T10:00:00'))
    assert.equal(duringSnooze?.id, 'available')

    const afterSnooze = pickNextTask(dayPlan, new Date('2026-06-23T20:00:00'))
    assert.equal(afterSnooze?.id, 'snoozed')
  })
})

describe('shouldSuggestSimplify', () => {
  it('true quando 3 dias seguidos incompletos', () => {
    const result = shouldSuggestSimplify([
      { dateIso: '2026-06-21', minimalDone: 1, minimalTotal: 3, dayMode: 'normal' },
      { dateIso: '2026-06-22', minimalDone: 0, minimalTotal: 3, dayMode: 'normal' },
      { dateIso: '2026-06-23', minimalDone: 2, minimalTotal: 3, dayMode: 'normal' },
    ])
    assert.equal(result, true)
  })

  it('false quando há dia completo recente', () => {
    const result = shouldSuggestSimplify([
      { dateIso: '2026-06-21', minimalDone: 3, minimalTotal: 3, dayMode: 'normal' },
      { dateIso: '2026-06-22', minimalDone: 1, minimalTotal: 3, dayMode: 'normal' },
      { dateIso: '2026-06-23', minimalDone: 2, minimalTotal: 3, dayMode: 'normal' },
    ])
    assert.equal(result, false)
  })
})

describe('applyWeeklyReviewAdjustments', () => {
  it('simplifica plano quando ajuste pede menos', () => {
    const record = emptyMyRoutineOnboardingRecord()
    const plan = generateWeekPlanFromOnboarding(record)
    const firstDate = plan.weekStartIso
    const beforeCount = plan.days[firstDate]?.tasks.length ?? 0

    const adjusted = applyWeeklyReviewAdjustments(plan, {
      adjustment: 'Quero menos tarefas',
      blocked: 'cansado',
    })

    const afterCount = adjusted.days[firstDate]?.tasks.length ?? 0
    assert.ok(afterCount <= beforeCount)
    assert.equal(adjusted.days[firstDate]?.dayMode, 'light')
  })

  it('não altera plano quando revisão não pede simplificação', () => {
    const record = emptyMyRoutineOnboardingRecord()
    const plan = generateWeekPlanFromOnboarding(record)
    const firstDate = plan.weekStartIso
    const beforeCount = plan.days[firstDate]?.tasks.length ?? 0

    const adjusted = applyWeeklyReviewAdjustments(plan, {
      adjustment: 'Está bom assim',
      blocked: 'nada',
    })

    assert.equal(adjusted.days[firstDate]?.tasks.length, beforeCount)
    assert.equal(adjusted.days[firstDate]?.dayMode, plan.days[firstDate]?.dayMode)
  })
})
