import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

/** Deve permanecer alinhado com vercel.json (has.host.value) e middleware.js. */
export const VD_APP_PRODUCTION_HOST_PATTERN = /^vd(-[^.]+)?\.telefarmed\.com\.br$/

function isAppCidadesHost(hostname) {
  const host = (hostname || '').toLowerCase().split(':')[0]

  if (host.endsWith('.localhost')) {
    const slug = host.slice(0, -'.localhost'.length)
    return slug === 'vd' || slug.startsWith('vd-')
  }

  return VD_APP_PRODUCTION_HOST_PATTERN.test(host)
}

describe('VD app production host pattern', () => {
  it('aceita vd interno e vd-{slug}', () => {
    for (const host of [
      'vd.telefarmed.com.br',
      'vd-santa-casa.telefarmed.com.br',
      'vd-minha-cidade.telefarmed.com.br',
    ]) {
      assert.match(host, VD_APP_PRODUCTION_HOST_PATTERN)
      assert.equal(isAppCidadesHost(host), true)
    }
  })

  it('rejeita outros subdomínios da plataforma', () => {
    for (const host of [
      'admin.telefarmed.com.br',
      'santa-casa.telefarmed.com.br',
      'ubt.telefarmed.com.br',
      'vd-.telefarmed.com.br',
      'vd.telefarmed.com.br.evil.com',
    ]) {
      assert.doesNotMatch(host, VD_APP_PRODUCTION_HOST_PATTERN)
      assert.equal(isAppCidadesHost(host), false)
    }
  })
})
