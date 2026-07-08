import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildTenantHeaders,
  mergeTenantIntoBody,
  mergeTenantIntoQuery,
} from './tenantScopeMerge.ts'

describe('vd tenantScope', () => {
  it('inclui slug e host na query string', () => {
    const params = mergeTenantIntoQuery(new URLSearchParams(), {
      slug: 'santa-casa',
      host: 'vd-santa-casa.localhost',
    })

    assert.equal(params.get('slug'), 'santa-casa')
    assert.equal(params.get('host'), 'vd-santa-casa.localhost')
  })

  it('propaga tenant no body de POST', () => {
    const body = mergeTenantIntoBody(
      { cpf: '39053344705', password: 'secret123' },
      { slug: 'demo', host: 'vd-demo.telefarmed.com.br' },
    )

    assert.equal(body.slug, 'demo')
    assert.equal(body.host, 'vd-demo.telefarmed.com.br')
    assert.equal(body.tenantHost, 'vd-demo.telefarmed.com.br')
    assert.equal(body.cpf, '39053344705')
  })

  it('envia X-Forwarded-Host quando host disponível', () => {
    assert.deepEqual(
      buildTenantHeaders({ host: 'vd-demo.telefarmed.com.br' }),
      { 'X-Forwarded-Host': 'vd-demo.telefarmed.com.br' },
    )
  })
})
