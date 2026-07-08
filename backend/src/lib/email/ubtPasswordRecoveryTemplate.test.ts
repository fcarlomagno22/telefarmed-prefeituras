import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildUbtPasswordRecoveryEmailHtml,
  buildUbtPasswordRecoveryEmailText,
} from './ubtPasswordRecoveryTemplate.js'

describe('password recovery email branding', () => {
  it('usa logo e marca da entidade quando informados', () => {
    const html = buildUbtPasswordRecoveryEmailHtml('12345678', 'https://vd-cidade.example/login', {
      logoUrl: 'https://cdn.example/logo-cliente.png',
      brandName: 'Prefeitura de Cidade',
      accentColor: '#0055aa',
    })

    assert.match(html, /logo-cliente\.png/)
    assert.match(html, /Prefeitura de Cidade/)
    assert.match(html, /#0055aa/)
    assert.doesNotMatch(html, /logo_4\.png/)
  })

  it('texto plano inclui nome da marca whitelabel', () => {
    const text = buildUbtPasswordRecoveryEmailText('12345678', undefined, {
      brandName: 'Santa Casa',
    })

    assert.match(text, /Santa Casa/)
  })
})
