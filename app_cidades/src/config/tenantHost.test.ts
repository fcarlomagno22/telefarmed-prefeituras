import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  extractVdEntitySlugFromHostname,
  isAppCidadesDedicatedHost,
  resolveVdTenantSlug,
  shouldFetchVdTenant,
} from './tenantHost.js'

describe('tenantHost', () => {
  it('extrai slug de vd-{slug}.telefarmed.com.br', () => {
    assert.equal(extractVdEntitySlugFromHostname('vd-santacasa.telefarmed.com.br'), 'santacasa')
    assert.equal(extractVdEntitySlugFromHostname('vd-santacasa.localhost'), 'santacasa')
  })

  it('identifica hosts dedicados VD', () => {
    assert.equal(isAppCidadesDedicatedHost('vd.telefarmed.com.br'), true)
    assert.equal(isAppCidadesDedicatedHost('vd-demo.telefarmed.com.br'), true)
    assert.equal(isAppCidadesDedicatedHost('demo.telefarmed.com.br'), false)
  })

  it('decide fetch com slug ou host vd', () => {
    assert.equal(shouldFetchVdTenant({ slug: 'demo', hostHeader: 'localhost' }), true)
    assert.equal(
      shouldFetchVdTenant({ slug: null, hostHeader: 'vd-demo.localhost' }),
      true,
    )
    assert.equal(shouldFetchVdTenant({ slug: null, hostHeader: 'localhost' }), false)
  })

  it('resolve slug via EXPO_PUBLIC_ENTIDADE_SLUG', () => {
    const previous = process.env.EXPO_PUBLIC_ENTIDADE_SLUG
    process.env.EXPO_PUBLIC_ENTIDADE_SLUG = 'vd-minha-cidade'
    try {
      assert.equal(resolveVdTenantSlug(), 'minha-cidade')
    } finally {
      if (previous === undefined) {
        delete process.env.EXPO_PUBLIC_ENTIDADE_SLUG
      } else {
        process.env.EXPO_PUBLIC_ENTIDADE_SLUG = previous
      }
    }
  })
})
