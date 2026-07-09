import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createFunctionalTrainingSessaoBodySchema,
  estatisticasSemanaisQuerySchema,
  formatFunctionalTrainingValidationError,
  functionalTrainingExerciseIdParamsSchema,
  listFunctionalTrainingSessoesQuerySchema,
} from './schemas.js'

const validSessaoBody = {
  clientSessionId: 'client-session-12345678',
  mode: 'single',
  durationSec: 30,
  totalActiveSec: 28,
  exerciseIds: ['abdominal-reverso'],
  completedAt: '2026-07-08T10:30:00.000-03:00',
}

describe('createFunctionalTrainingSessaoBodySchema', () => {
  it('aceita payload válido de sessão', () => {
    const parsed = createFunctionalTrainingSessaoBodySchema.safeParse(validSessaoBody)
    assert.equal(parsed.success, true)
  })

  it('rejeita exercício fora do catálogo', () => {
    const parsed = createFunctionalTrainingSessaoBodySchema.safeParse({
      ...validSessaoBody,
      exerciseIds: ['exercicio-inexistente'],
    })
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.match(formatFunctionalTrainingValidationError(parsed.error), /catálogo/i)
    }
  })

  it('rejeita clientSessionId curto', () => {
    const parsed = createFunctionalTrainingSessaoBodySchema.safeParse({
      ...validSessaoBody,
      clientSessionId: 'abc',
    })
    assert.equal(parsed.success, false)
  })
})

describe('functionalTrainingExerciseIdParamsSchema', () => {
  it('aceita slug válido', () => {
    const parsed = functionalTrainingExerciseIdParamsSchema.safeParse({
      exerciseId: 'afundo',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita slug inválido', () => {
    const parsed = functionalTrainingExerciseIdParamsSchema.safeParse({
      exerciseId: 'polichinelo',
    })
    assert.equal(parsed.success, false)
  })
})

describe('listFunctionalTrainingSessoesQuerySchema', () => {
  it('aplica defaults de paginação', () => {
    const parsed = listFunctionalTrainingSessoesQuerySchema.safeParse({})
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.page, 1)
      assert.equal(parsed.data.pageSize, 20)
    }
  })
})

describe('estatisticasSemanaisQuerySchema', () => {
  it('aceita query vazia', () => {
    const parsed = estatisticasSemanaisQuerySchema.safeParse({})
    assert.equal(parsed.success, true)
  })
})
