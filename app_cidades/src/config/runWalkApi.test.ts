import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isRunWalkApiEnabled } from './runWalkApi'

describe('isRunWalkApiEnabled', () => {
  it('retorna true quando variável não está definida', () => {
    const previous = process.env.EXPO_PUBLIC_RUN_WALK_API
    delete process.env.EXPO_PUBLIC_RUN_WALK_API

    try {
      assert.equal(isRunWalkApiEnabled(), true)
    } finally {
      if (previous === undefined) {
        delete process.env.EXPO_PUBLIC_RUN_WALK_API
      } else {
        process.env.EXPO_PUBLIC_RUN_WALK_API = previous
      }
    }
  })

  it('retorna true para true ou 1', () => {
    const previous = process.env.EXPO_PUBLIC_RUN_WALK_API

    try {
      process.env.EXPO_PUBLIC_RUN_WALK_API = 'true'
      assert.equal(isRunWalkApiEnabled(), true)

      process.env.EXPO_PUBLIC_RUN_WALK_API = '1'
      assert.equal(isRunWalkApiEnabled(), true)
    } finally {
      if (previous === undefined) {
        delete process.env.EXPO_PUBLIC_RUN_WALK_API
      } else {
        process.env.EXPO_PUBLIC_RUN_WALK_API = previous
      }
    }
  })
})
