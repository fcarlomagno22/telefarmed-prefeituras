import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  vdAuthRefreshClearCookieOptions,
  vdAuthRefreshCookieOptions,
} from './vdAuthRefreshCookie.js'
import { VD_REFRESH_COOKIE_PATH, VD_REFRESH_TTL_DAYS } from './vdAuthSession.js'

describe('vdAuthRefreshCookie', () => {
  it('limita cookie ao path /api/v1/vd/auth sem domain', () => {
    const options = vdAuthRefreshCookieOptions()

    assert.equal(options.path, VD_REFRESH_COOKIE_PATH)
    assert.equal(options.httpOnly, true)
    assert.equal('domain' in options, false)
    assert.equal(options.maxAge, VD_REFRESH_TTL_DAYS * 24 * 60 * 60)
  })

  it('usa SameSite none for refresh cross-origin fora de produção', () => {
    assert.equal(vdAuthRefreshCookieOptions().sameSite, 'none')
  })

  it('clearCookie usa o mesmo path', () => {
    assert.deepEqual(vdAuthRefreshClearCookieOptions(), {
      path: VD_REFRESH_COOKIE_PATH,
    })
  })
})
