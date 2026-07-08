import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isCorsOriginAllowed,
  isVdAppDevOrigin,
  isVdAppProductionOrigin,
} from './corsOrigins.js'

describe('corsOrigins — app cidadão (vd-*)', () => {
  it('aceita origins de produção vd e vd-{slug}', () => {
    for (const origin of [
      'https://vd.telefarmed.com.br',
      'https://vd-santa-casa.telefarmed.com.br',
      'https://vd-minha-cidade.telefarmed.com.br',
    ]) {
      assert.equal(isVdAppProductionOrigin(origin), true)
      assert.equal(isCorsOriginAllowed(origin), true)
    }
  })

  it('aceita origins de dev vd-*.localhost', () => {
    for (const origin of [
      'http://vd.localhost:8081',
      'http://vd-minha-cidade.localhost:8081',
    ]) {
      assert.equal(isVdAppDevOrigin(origin), true)
      assert.equal(isCorsOriginAllowed(origin), true)
    }
  })

  it('aceita Expo web em localhost sem subdomínio vd (dev)', () => {
    for (const origin of ['http://localhost:8081', 'http://127.0.0.1:8081']) {
      assert.equal(isVdAppDevOrigin(origin), true)
      assert.equal(isCorsOriginAllowed(origin), true)
    }
  })

  it('rejeita origins de outros portais', () => {
    for (const origin of [
      'https://admin.telefarmed.com.br',
      'https://santa-casa.telefarmed.com.br',
      'https://evil-vd.telefarmed.com.br.evil.com',
    ]) {
      assert.equal(isVdAppProductionOrigin(origin), false)
      assert.equal(isVdAppDevOrigin(origin), false)
    }
  })
})
