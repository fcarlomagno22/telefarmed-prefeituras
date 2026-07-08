import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildDefaultDispositionState,
  buildDispositionState,
  getDispositionRecommendationLabel,
  resolveDispositionRecommendation,
  resolveRecentActivitiesBounds,
  resolveTodayDateKeyInAppTz,
} from './disposicao.formatters.js'

const TODAY = '2026-07-08'

describe('disposicao.formatters', () => {
  it('resolve hoje e janela de 3 dias em America/Sao_Paulo', () => {
    assert.equal(
      resolveTodayDateKeyInAppTz(new Date('2026-07-08T15:00:00.000-03:00')),
      TODAY,
    )

    const bounds = resolveRecentActivitiesBounds(TODAY)
    assert.equal(bounds.startDateKey, '2026-07-06')
    assert.equal(bounds.startIso, '2026-07-06T00:00:00.000-03:00')
    assert.equal(bounds.endIso, '2026-07-08T23:59:59.999-03:00')
  })

  it('retorna fallback sensato sem dados', () => {
    const fallback = buildDefaultDispositionState()
    assert.equal(fallback.level, 'good')
    assert.equal(fallback.factors.length, 7)

    const weather = fallback.factors.find((factor) => factor.id === 'weather')
    assert.equal(weather?.considered, false)
  })

  it('prioriza check-in positivo com disposição boa', () => {
    const result = buildDispositionState({
      todayDateKey: TODAY,
      checkin: {
        mood: 'great',
        sleptWell: true,
        hasPain: false,
        lowEnergy: false,
      },
      recentActivities: [],
      hidratacaoMlHoje: 2200,
      frequenciaBpm: 72,
      frequenciaBpmAvg7d: 74,
    })

    assert.equal(result.level, 'good')
    assert.equal(result.message, 'Sua disposição está boa')
    assert.equal(result.factors.find((factor) => factor.id === 'sleep')?.value, 'Boa noite de descanso')
  })

  it('penaliza cansaço extremo e dor', () => {
    const result = buildDispositionState({
      todayDateKey: TODAY,
      checkin: {
        mood: 'very-tired',
        sleptWell: false,
        hasPain: true,
        lowEnergy: true,
      },
      recentActivities: [
        {
          dateKey: '2026-07-07',
          activeMinutes: 55,
          modality: 'run',
        },
      ],
      hidratacaoMlHoje: 400,
      frequenciaBpm: 105,
      frequenciaBpmAvg7d: 78,
    })

    assert.ok(['low', 'rest'].includes(result.level))
    assert.equal(
      result.factors.find((factor) => factor.id === 'pain')?.value,
      'Desconforto relatado no check-in',
    )
  })

  it('usa hidratação como proxy de sono sem check-in', () => {
    const result = buildDispositionState({
      todayDateKey: TODAY,
      checkin: null,
      recentActivities: [],
      hidratacaoMlHoje: 1800,
      frequenciaBpm: null,
      frequenciaBpmAvg7d: null,
    })

    assert.equal(
      result.factors.find((factor) => factor.id === 'sleep')?.value,
      'Rotina de hidratação favorável (estimativa)',
    )
    assert.ok(['good', 'moderate'].includes(result.level))
  })

  it('marca clima como não considerado (fase futura)', () => {
    const result = buildDispositionState({
      todayDateKey: TODAY,
      checkin: null,
      recentActivities: [],
      hidratacaoMlHoje: null,
      frequenciaBpm: null,
      frequenciaBpmAvg7d: null,
    })

    const weather = result.factors.find((factor) => factor.id === 'weather')
    assert.equal(weather?.considered, false)
    assert.match(weather?.value ?? '', /Indisponível/)
  })

  it('calcula recomendação com mesma prioridade do drawer', () => {
    assert.equal(
      resolveDispositionRecommendation({ mood: 'very-tired' }),
      'rest',
    )
    assert.equal(
      resolveDispositionRecommendation({ mood: 'good', lowEnergy: true }),
      'rest',
    )
    assert.equal(
      resolveDispositionRecommendation({ mood: 'discomfort', hasPain: true }),
      'recovery',
    )
    assert.equal(
      resolveDispositionRecommendation({ mood: 'great', preferWalkOverRun: true }),
      'swap-walk',
    )
    assert.equal(
      resolveDispositionRecommendation({ mood: 'great', preferLighter: true }),
      'light-walk',
    )
    assert.equal(
      resolveDispositionRecommendation({ mood: 'tired', sleptWell: true }),
      'reduce-time',
    )
    assert.equal(
      resolveDispositionRecommendation({ mood: 'good', sleptWell: true }),
      'slower-pace',
    )
    assert.equal(
      resolveDispositionRecommendation({ mood: 'great', sleptWell: true }),
      'keep',
    )
    assert.equal(getDispositionRecommendationLabel('rest'), 'Descansar hoje')
  })
})
