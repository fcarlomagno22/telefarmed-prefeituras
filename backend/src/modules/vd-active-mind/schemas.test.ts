import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  activeMindSessaoIdParamsSchema,
  createActiveMindSessaoBodySchema,
  estatisticasSemanaisQuerySchema,
  formatActiveMindValidationError,
  listActiveMindSessoesQuerySchema,
} from './schemas.js'

function recentCompletedAt(offsetMs = -60_000): string {
  return new Date(Date.now() + offsetMs).toISOString()
}

const validSessaoBody = {
  clientSessionId: 'active-mind-session-001',
  gameId: 'sudoku',
  difficulty: 'facil',
  puzzleId: 'sudoku-facil-42',
  durationSec: 300,
  attempts: 12,
  correct: 8,
  errors: 2,
  reveals: 1,
  completedAt: recentCompletedAt(),
}

describe('createActiveMindSessaoBodySchema', () => {
  it('aceita payload válido de sessão', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse(validSessaoBody)
    assert.equal(parsed.success, true)
  })

  it('aceita payload sem puzzleId e durationSec', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse({
      clientSessionId: 'session-minimal',
      gameId: 'crosswords',
      difficulty: 'medio',
      attempts: 0,
      correct: 0,
      errors: 0,
      reveals: 0,
      completedAt: recentCompletedAt(),
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita campos desconhecidos (schema strict)', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse({
      ...validSessaoBody,
      serverId: '11111111-1111-1111-1111-111111111111',
    })
    assert.equal(parsed.success, false)
  })

  it('rejeita clientSessionId vazio', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse({
      ...validSessaoBody,
      clientSessionId: '',
    })
    assert.equal(parsed.success, false)
  })

  it('rejeita clientSessionId acima de 128 caracteres', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse({
      ...validSessaoBody,
      clientSessionId: 'x'.repeat(129),
    })
    assert.equal(parsed.success, false)
  })

  it('aceita clientSessionId com exatamente 128 caracteres', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse({
      ...validSessaoBody,
      clientSessionId: 'x'.repeat(128),
    })
    assert.equal(parsed.success, true)
  })

  it('aceita clientSessionId com 1 caractere', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse({
      ...validSessaoBody,
      clientSessionId: 'a',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita gameId fora do catálogo', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse({
      ...validSessaoBody,
      gameId: 'tetris',
    })
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.match(formatActiveMindValidationError(parsed.error), /catálogo/i)
    }
  })

  it('aceita todos os gameId do catálogo', () => {
    const gameIds = [
      'form-the-word',
      'calculations',
      'logic-sequence',
      'sudoku',
      'crosswords',
      'word-search',
    ] as const

    for (const gameId of gameIds) {
      const parsed = createActiveMindSessaoBodySchema.safeParse({
        ...validSessaoBody,
        gameId,
      })
      assert.equal(parsed.success, true, `gameId ${gameId} deveria ser aceito`)
    }
  })

  it('rejeita difficulty inválida', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse({
      ...validSessaoBody,
      difficulty: 'extremo',
    })
    assert.equal(parsed.success, false)
  })

  it('aceita todas as difficulties do catálogo', () => {
    for (const difficulty of ['facil', 'medio', 'dificil'] as const) {
      const parsed = createActiveMindSessaoBodySchema.safeParse({
        ...validSessaoBody,
        difficulty,
      })
      assert.equal(parsed.success, true, `difficulty ${difficulty} deveria ser aceita`)
    }
  })

  it('rejeita puzzleId vazio', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse({
      ...validSessaoBody,
      puzzleId: '',
    })
    assert.equal(parsed.success, false)
  })

  it('aceita puzzleId com exatamente 128 caracteres', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse({
      ...validSessaoBody,
      puzzleId: 'p'.repeat(128),
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita puzzleId acima de 128 caracteres', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse({
      ...validSessaoBody,
      puzzleId: 'p'.repeat(129),
    })
    assert.equal(parsed.success, false)
  })

  it('rejeita durationSec abaixo de 1', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse({
      ...validSessaoBody,
      durationSec: 0,
    })
    assert.equal(parsed.success, false)
  })

  it('aceita durationSec nos limites 1 e 86400', () => {
    for (const durationSec of [1, 86_400]) {
      const parsed = createActiveMindSessaoBodySchema.safeParse({
        ...validSessaoBody,
        durationSec,
      })
      assert.equal(parsed.success, true)
    }
  })

  it('rejeita durationSec acima de 86400', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse({
      ...validSessaoBody,
      durationSec: 86_401,
    })
    assert.equal(parsed.success, false)
  })

  it('aceita stats zeradas', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse({
      ...validSessaoBody,
      attempts: 0,
      correct: 0,
      errors: 0,
      reveals: 0,
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita stats negativas', () => {
    for (const field of ['attempts', 'correct', 'errors', 'reveals'] as const) {
      const parsed = createActiveMindSessaoBodySchema.safeParse({
        ...validSessaoBody,
        [field]: -1,
      })
      assert.equal(parsed.success, false, `${field} negativo deveria falhar`)
    }
  })

  it('rejeita completedAt no futuro', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse({
      ...validSessaoBody,
      completedAt: recentCompletedAt(60_000),
    })
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.match(formatActiveMindValidationError(parsed.error), /futura/i)
    }
  })

  it('rejeita completedAt há mais de 7 dias', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse({
      ...validSessaoBody,
      completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    })
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.match(formatActiveMindValidationError(parsed.error), /7 dias/i)
    }
  })

  it('aceita completedAt dentro da janela de 7 dias', () => {
    const parsed = createActiveMindSessaoBodySchema.safeParse({
      ...validSessaoBody,
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    })
    assert.equal(parsed.success, true)
  })
})

describe('activeMindSessaoIdParamsSchema', () => {
  it('aceita UUID válido', () => {
    const parsed = activeMindSessaoIdParamsSchema.safeParse({
      id: '11111111-1111-1111-1111-111111111111',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita id inválido', () => {
    const parsed = activeMindSessaoIdParamsSchema.safeParse({
      id: 'not-a-uuid',
    })
    assert.equal(parsed.success, false)
  })
})

describe('listActiveMindSessoesQuerySchema', () => {
  it('aplica defaults de paginação', () => {
    const parsed = listActiveMindSessoesQuerySchema.safeParse({})
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.page, 1)
      assert.equal(parsed.data.pageSize, 20)
    }
  })

  it('rejeita pageSize acima de 50', () => {
    const parsed = listActiveMindSessoesQuerySchema.safeParse({ pageSize: 51 })
    assert.equal(parsed.success, false)
  })

  it('aceita pageSize nos limites 1 e 50', () => {
    for (const pageSize of [1, 50]) {
      const parsed = listActiveMindSessoesQuerySchema.safeParse({ pageSize })
      assert.equal(parsed.success, true)
      if (parsed.success) {
        assert.equal(parsed.data.pageSize, pageSize)
      }
    }
  })

  it('rejeita page abaixo de 1', () => {
    const parsed = listActiveMindSessoesQuerySchema.safeParse({ page: 0 })
    assert.equal(parsed.success, false)
  })

  it('rejeita pageSize abaixo de 1', () => {
    const parsed = listActiveMindSessoesQuerySchema.safeParse({ pageSize: 0 })
    assert.equal(parsed.success, false)
  })

  it('rejeita startIso inválido', () => {
    const parsed = listActiveMindSessoesQuerySchema.safeParse({
      startIso: 'ontem',
    })
    assert.equal(parsed.success, false)
  })

  it('aceita filtro por intervalo, jogo e paginação', () => {
    const parsed = listActiveMindSessoesQuerySchema.safeParse({
      startIso: '2026-07-01T00:00:00.000Z',
      endIso: '2026-07-31T23:59:59.999Z',
      gameId: 'word-search',
      page: 2,
      pageSize: 50,
    })
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.gameId, 'word-search')
      assert.equal(parsed.data.page, 2)
      assert.equal(parsed.data.pageSize, 50)
    }
  })

  it('rejeita gameId fora do catálogo na query', () => {
    const parsed = listActiveMindSessoesQuerySchema.safeParse({
      gameId: 'jogo-invalido',
    })
    assert.equal(parsed.success, false)
  })
})

describe('estatisticasSemanaisQuerySchema', () => {
  it('aceita query vazia', () => {
    const parsed = estatisticasSemanaisQuerySchema.safeParse({})
    assert.equal(parsed.success, true)
  })

  it('aceita weekStartIso válido', () => {
    const parsed = estatisticasSemanaisQuerySchema.safeParse({
      weekStartIso: '2026-07-06T03:00:00.000Z',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita weekStartIso inválido', () => {
    const parsed = estatisticasSemanaisQuerySchema.safeParse({
      weekStartIso: 'segunda',
    })
    assert.equal(parsed.success, false)
  })
})
