import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  clearAuthSessionCache,
  getCachedAuthSession,
  invalidateAuthSessionCache,
} from './authSessionCache.js'

describe('authSessionCache', () => {
  it('reuses cached session until invalidated', async () => {
    clearAuthSessionCache()
    let loads = 0

    const load = async () => {
      loads += 1
      return { id: 'user-1', nome: 'Test' }
    }

    await getCachedAuthSession('admin', 'user-1', load)
    await getCachedAuthSession('admin', 'user-1', load)

    assert.equal(loads, 1)

    invalidateAuthSessionCache('admin', 'user-1')

    await getCachedAuthSession('admin', 'user-1', load)
    assert.equal(loads, 2)
  })

  it('isolates cache by portal', async () => {
    clearAuthSessionCache()
    let adminLoads = 0
    let ubtLoads = 0

    await getCachedAuthSession('admin', 'user-1', async () => {
      adminLoads += 1
      return { portal: 'admin' }
    })
    await getCachedAuthSession('ubt', 'user-1', async () => {
      ubtLoads += 1
      return { portal: 'ubt' }
    })

    assert.equal(adminLoads, 1)
    assert.equal(ubtLoads, 1)
  })
})
