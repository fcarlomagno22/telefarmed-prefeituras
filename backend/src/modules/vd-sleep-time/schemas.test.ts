import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createSleepTimeRegistroBodySchema,
  formatSleepTimeValidationError,
  listSleepTimeRegistrosQuerySchema,
  sleepTimeRegistroIdParamsSchema,
} from './schemas.js'

const validRegistroBody = {
  clientLogId: 'client-log-12345678',
  bedAt: '2026-07-08T22:30:00.000-03:00',
  wakeAt: '2026-07-09T07:00:00.000-03:00',
  quality: 4,
  wakeCount: 1,
  notes: 'Dormi bem.',
}

describe('createSleepTimeRegistroBodySchema', () => {
  it('aceita payload válido de registro', () => {
    const parsed = createSleepTimeRegistroBodySchema.safeParse(validRegistroBody)
    assert.equal(parsed.success, true)
  })

  it('rejeita clientLogId curto', () => {
    const parsed = createSleepTimeRegistroBodySchema.safeParse({
      ...validRegistroBody,
      clientLogId: 'abc',
    })
    assert.equal(parsed.success, false)
  })

  it('rejeita qualidade fora do intervalo', () => {
    const parsedHigh = createSleepTimeRegistroBodySchema.safeParse({
      ...validRegistroBody,
      quality: 6,
    })
    assert.equal(parsedHigh.success, false)

    const parsedLow = createSleepTimeRegistroBodySchema.safeParse({
      ...validRegistroBody,
      quality: 0,
    })
    assert.equal(parsedLow.success, false)
  })

  it('aceita qualidade nos limites 1 e 5', () => {
    for (const quality of [1, 5]) {
      const parsed = createSleepTimeRegistroBodySchema.safeParse({
        ...validRegistroBody,
        quality,
      })
      assert.equal(parsed.success, true)
    }
  })

  it('aceita wakeCount nos limites 0 e 20', () => {
    for (const wakeCount of [0, 20]) {
      const parsed = createSleepTimeRegistroBodySchema.safeParse({
        ...validRegistroBody,
        wakeCount,
      })
      assert.equal(parsed.success, true)
    }
  })

  it('rejeita wakeCount negativo', () => {
    const parsed = createSleepTimeRegistroBodySchema.safeParse({
      ...validRegistroBody,
      wakeCount: -1,
    })
    assert.equal(parsed.success, false)
  })

  it('rejeita wakeAt anterior ou igual a bedAt', () => {
    const parsed = createSleepTimeRegistroBodySchema.safeParse({
      ...validRegistroBody,
      wakeAt: validRegistroBody.bedAt,
    })
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.match(formatSleepTimeValidationError(parsed.error), /acordar/i)
    }
  })

  it('rejeita wakeCount acima de 20', () => {
    const parsed = createSleepTimeRegistroBodySchema.safeParse({
      ...validRegistroBody,
      wakeCount: 21,
    })
    assert.equal(parsed.success, false)
  })

  it('rejeita wakeAt no futuro', () => {
    const parsed = createSleepTimeRegistroBodySchema.safeParse({
      ...validRegistroBody,
      bedAt: '2099-01-01T22:00:00.000-03:00',
      wakeAt: '2099-01-02T07:00:00.000-03:00',
    })
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.match(formatSleepTimeValidationError(parsed.error), /futura/i)
    }
  })

  it('trunca notas acima de 500 caracteres', () => {
    const parsed = createSleepTimeRegistroBodySchema.safeParse({
      ...validRegistroBody,
      notes: 'x'.repeat(501),
    })
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.notes?.length, 500)
    }
  })

  it('rejeita durationMinutes enviado pelo client (schema strict)', () => {
    const parsed = createSleepTimeRegistroBodySchema.safeParse({
      ...validRegistroBody,
      durationMinutes: 480,
    })
    assert.equal(parsed.success, false)
  })

  it('rejeita campos desconhecidos (schema strict)', () => {
    const parsed = createSleepTimeRegistroBodySchema.safeParse({
      ...validRegistroBody,
      bedDateIso: '2026-07-08',
    })
    assert.equal(parsed.success, false)
  })

  it('remove caracteres de controle das notas', () => {
    const parsed = createSleepTimeRegistroBodySchema.safeParse({
      ...validRegistroBody,
      notes: 'Dormi\u0007bem.',
    })
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.notes, 'Dormibem.')
    }
  })
})

describe('sleepTimeRegistroIdParamsSchema', () => {
  it('aceita UUID válido', () => {
    const parsed = sleepTimeRegistroIdParamsSchema.safeParse({
      id: '11111111-1111-1111-1111-111111111111',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita id inválido', () => {
    const parsed = sleepTimeRegistroIdParamsSchema.safeParse({
      id: 'not-a-uuid',
    })
    assert.equal(parsed.success, false)
  })
})

describe('listSleepTimeRegistrosQuerySchema', () => {
  it('aplica defaults de paginação', () => {
    const parsed = listSleepTimeRegistrosQuerySchema.safeParse({})
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.page, 1)
      assert.equal(parsed.data.pageSize, 20)
    }
  })

  it('rejeita pageSize acima de 100', () => {
    const parsed = listSleepTimeRegistrosQuerySchema.safeParse({ pageSize: 101 })
    assert.equal(parsed.success, false)
  })

  it('aceita filtro por intervalo de datas', () => {
    const parsed = listSleepTimeRegistrosQuerySchema.safeParse({
      startIso: '2026-07-01T00:00:00.000Z',
      endIso: '2026-07-31T23:59:59.999Z',
      page: 2,
      pageSize: 50,
    })
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.page, 2)
      assert.equal(parsed.data.pageSize, 50)
    }
  })
})
