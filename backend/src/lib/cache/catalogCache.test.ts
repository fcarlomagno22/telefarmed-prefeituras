import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  clearCatalogCache,
  invalidateClinicoCatalogCache,
  withCatalogCache,
} from './catalogCache.js'

describe('catalogCache', () => {
  it('reuses cached values until invalidated', async () => {
    clearCatalogCache()
    let loads = 0

    const load = async () => {
      loads += 1
      return { ok: true }
    }

    const first = await withCatalogCache('clinico', 'active', load)
    const second = await withCatalogCache('clinico', 'active', load)

    assert.deepEqual(first, { ok: true })
    assert.deepEqual(second, { ok: true })
    assert.equal(loads, 1)

    invalidateClinicoCatalogCache()

    await withCatalogCache('clinico', 'active', load)
    assert.equal(loads, 2)
  })

  it('does not cache null results', async () => {
    clearCatalogCache()
    let loads = 0

    const load = async () => {
      loads += 1
      return null
    }

    await withCatalogCache('tenant', 'missing-slug', load)
    await withCatalogCache('tenant', 'missing-slug', load)

    assert.equal(loads, 2)
  })
})
