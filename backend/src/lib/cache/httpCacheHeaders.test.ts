import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DAY_SPECIALTIES_MAX_AGE_SECONDS,
  PUBLIC_CATALOG_MAX_AGE_SECONDS,
  PUBLIC_CATALOG_STALE_WHILE_REVALIDATE_SECONDS,
  setDaySpecialtiesCacheHeaders,
  setPublicCatalogCacheHeaders,
  setTenantCacheHeaders,
  TENANT_MAX_AGE_SECONDS,
  TENANT_STALE_WHILE_REVALIDATE_SECONDS,
} from './httpCacheHeaders.js'

describe('httpCacheHeaders', () => {
  it('sets public catalog headers with stale-while-revalidate', () => {
    const headers = new Map<string, string>()
    setPublicCatalogCacheHeaders({
      header(name, value) {
        headers.set(name, value)
      },
    })

    assert.equal(
      headers.get('Cache-Control'),
      `public, max-age=${PUBLIC_CATALOG_MAX_AGE_SECONDS}, stale-while-revalidate=${PUBLIC_CATALOG_STALE_WHILE_REVALIDATE_SECONDS}`,
    )
    assert.ok(PUBLIC_CATALOG_MAX_AGE_SECONDS >= 5 * 60)
    assert.ok(PUBLIC_CATALOG_MAX_AGE_SECONDS <= 15 * 60)
  })

  it('sets tenant headers within 5–10 min range', () => {
    const headers = new Map<string, string>()
    setTenantCacheHeaders({
      header(name, value) {
        headers.set(name, value)
      },
    })

    assert.equal(
      headers.get('Cache-Control'),
      `public, max-age=${TENANT_MAX_AGE_SECONDS}, s-maxage=${TENANT_MAX_AGE_SECONDS}, stale-while-revalidate=${TENANT_STALE_WHILE_REVALIDATE_SECONDS}`,
    )
    assert.ok(TENANT_MAX_AGE_SECONDS >= 5 * 60)
    assert.ok(TENANT_MAX_AGE_SECONDS <= 10 * 60)
  })

  it('sets day specialties headers within 1–2 min range', () => {
    const headers = new Map<string, string>()
    setDaySpecialtiesCacheHeaders({
      header(name, value) {
        headers.set(name, value)
      },
    })

    assert.match(headers.get('Cache-Control') ?? '', /^private, max-age=\d+, stale-while-revalidate=\d+$/)
    assert.ok(DAY_SPECIALTIES_MAX_AGE_SECONDS >= 60)
    assert.ok(DAY_SPECIALTIES_MAX_AGE_SECONDS <= 120)
  })
})
