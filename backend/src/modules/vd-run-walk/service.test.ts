import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isUniqueViolationError } from './atividades.repository.js'

describe('registerRunWalkAtividade helpers', () => {
  it('detecta violação de unique do Postgres', () => {
    assert.equal(isUniqueViolationError({ code: '23505' }), true)
    assert.equal(isUniqueViolationError({ code: '23503' }), false)
    assert.equal(isUniqueViolationError(new Error('fail')), false)
  })
})
