import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildMetasSemanaisProgresso,
  mapModalityToWeeklyCalendarType,
  resolveWeekDateKeys,
} from './progresso-semanal.formatters.js'

const NOW = new Date('2026-07-08T15:00:00.000-03:00')
const WEEK_START = '2026-07-06'

describe('progresso-semanal.formatters', () => {
  it('mapeia modalidade para tipo do calendário semanal', () => {
    assert.equal(mapModalityToWeeklyCalendarType('walk'), 'walk')
    assert.equal(mapModalityToWeeklyCalendarType('run'), 'run')
    assert.equal(mapModalityToWeeklyCalendarType('run-walk'), 'run-walk')
    assert.equal(mapModalityToWeeklyCalendarType('free'), 'free')
  })

  it('gera 7 dias da semana a partir da segunda-feira', () => {
    assert.deepEqual(resolveWeekDateKeys(WEEK_START), [
      '2026-07-06',
      '2026-07-07',
      '2026-07-08',
      '2026-07-09',
      '2026-07-10',
      '2026-07-11',
      '2026-07-12',
    ])
  })

  it('monta WeeklyGoalStats e calendário a partir de atividades reais', () => {
    const result = buildMetasSemanaisProgresso({
      weekStartDate: WEEK_START,
      targets: {
        targetActivities: 4,
        targetActiveMinutes: 150,
        targetMovementDays: 5,
      },
      dailyExtraMinutes: {},
      extraCompletedActivities: 0,
      now: NOW,
      activities: [
        {
          id: 'a1',
          modality: 'walk',
          activityName: 'Caminhada leve',
          activeMinutes: 30,
          completedAt: '2026-07-07T08:00:00.000-03:00',
        },
        {
          id: 'a2',
          modality: 'run',
          activityName: 'Corrida moderada',
          activeMinutes: 40,
          completedAt: '2026-07-08T10:00:00.000-03:00',
        },
      ],
    })

    assert.equal(result.weekStartDate, WEEK_START)
    assert.deepEqual(result.weeklyGoal, {
      completedActivities: 2,
      targetActivities: 4,
      activeMinutes: 70,
      targetActiveMinutes: 150,
      movementDays: 2,
      targetMovementDays: 5,
    })
    assert.equal(result.weeklyCalendar.length, 7)

    const tuesday = result.weeklyCalendar.find((day) => day.dateIso === '2026-07-07')
    assert.equal(tuesday?.activeMinutes, 30)
    assert.equal(tuesday?.activities[0]?.type, 'walk')
    assert.equal(tuesday?.activities[0]?.completed, true)

    const wednesday = result.weeklyCalendar.find((day) => day.dateIso === '2026-07-08')
    assert.equal(wednesday?.isToday, true)
    assert.equal(wednesday?.activeMinutes, 40)

    const thursday = result.weeklyCalendar.find((day) => day.dateIso === '2026-07-09')
    assert.equal(thursday?.isFuture, true)
    assert.equal(thursday?.activeMinutes, 0)
    assert.equal(thursday?.activities[0]?.type, 'rest')
  })

  it('inclui dailyExtraMinutes em dias sem atividade registrada', () => {
    const result = buildMetasSemanaisProgresso({
      weekStartDate: WEEK_START,
      targets: null,
      dailyExtraMinutes: {
        '2026-07-06': 20,
      },
      extraCompletedActivities: 1,
      now: NOW,
      activities: [],
    })

    assert.deepEqual(result.dailyExtraMinutes, { '2026-07-06': 20 })
    assert.equal(result.weeklyGoal.completedActivities, 1)
    assert.equal(result.weeklyGoal.activeMinutes, 20)
    assert.equal(result.weeklyGoal.movementDays, 1)

    const monday = result.weeklyCalendar.find((day) => day.dateIso === '2026-07-06')
    assert.equal(monday?.activeMinutes, 20)
    assert.equal(monday?.activities[0]?.type, 'run-walk')
    assert.equal(monday?.activities[0]?.completed, true)
  })

  it('soma minutos extras sem duplicar no calendário quando há atividade no dia', () => {
    const result = buildMetasSemanaisProgresso({
      weekStartDate: WEEK_START,
      targets: {
        targetActivities: 3,
        targetActiveMinutes: 90,
        targetMovementDays: 3,
      },
      dailyExtraMinutes: {
        '2026-07-08': 10,
      },
      extraCompletedActivities: 0,
      now: NOW,
      activities: [
        {
          id: 'a1',
          modality: 'run-walk',
          activityName: 'Corrida e caminhada',
          activeMinutes: 35,
          completedAt: '2026-07-08T18:00:00.000-03:00',
        },
      ],
    })

    const wednesday = result.weeklyCalendar.find((day) => day.dateIso === '2026-07-08')
    assert.equal(wednesday?.activeMinutes, 45)
    assert.equal(result.weeklyGoal.activeMinutes, 45)
    assert.equal(result.weeklyGoal.completedActivities, 1)
  })
})
