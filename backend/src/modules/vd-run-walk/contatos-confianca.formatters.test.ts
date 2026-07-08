import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  assertValidBrazilPhone,
  extractBrazilPhoneDigits,
  formatBrazilPhone,
  mapContatoConfiancaRowToDto,
  MAX_TRUSTED_CONTACTS,
} from './contatos-confianca.formatters.js'
import { VdRunWalkError } from './errors.js'

describe('contatos-confianca.formatters', () => {
  it('valida telefone brasileiro com 10 ou 11 dígitos', () => {
    assert.equal(assertValidBrazilPhone('(11) 3333-4444'), '1133334444')
    assert.equal(assertValidBrazilPhone('11999998888'), '11999998888')
  })

  it('rejeita telefone inválido', () => {
    assert.throws(
      () => assertValidBrazilPhone('123'),
      (error: unknown) =>
        error instanceof VdRunWalkError && error.code === 'INVALID_DATA',
    )
  })

  it('formata telefone fixo e celular', () => {
    assert.equal(formatBrazilPhone('1133334444'), '(11) 3333-4444')
    assert.equal(formatBrazilPhone('11999998888'), '(11) 99999-8888')
  })

  it('extrai apenas dígitos', () => {
    assert.equal(extractBrazilPhoneDigits('(21) 98888-7777'), '21988887777')
  })

  it('mapeia linha para DTO', () => {
    const dto = mapContatoConfiancaRowToDto({
      id: 'uuid-1',
      paciente_id: 'pac-1',
      entidade_contratante_id: 'ent-1',
      client_contact_id: 'contact-local-1',
      name: 'Maria',
      phone: '11999998888',
      live_share_enabled: true,
      is_active_sos: true,
      sort_order: 0,
      deleted_at: null,
      criado_em: '2026-07-08T10:00:00.000Z',
      atualizado_em: '2026-07-08T10:00:00.000Z',
    })

    assert.equal(dto.id, 'uuid-1')
    assert.equal(dto.clientContactId, 'contact-local-1')
    assert.equal(dto.phone, '(11) 99999-8888')
    assert.equal(dto.liveShareEnabled, true)
    assert.equal(dto.isActiveSos, true)
  })

  it('define limite máximo de contatos', () => {
    assert.equal(MAX_TRUSTED_CONTACTS, 5)
  })
})
