import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildLiveSharePublicUrl,
  generateLiveShareToken,
  isLiveSessionExpired,
  mapCreateInputToInsertRow,
  mapLiveSessionRow,
  resolveLiveShareWebBaseUrl,
} from './live-sessions.formatters.js'

describe('live-sessions.formatters', () => {
  it('gera token alfanumérico de 8 caracteres', () => {
    const token = generateLiveShareToken()
    assert.equal(token.length, 8)
    assert.match(token, /^[A-HJ-NP-Z2-9]{8}$/)
  })

  it('monta URL pública dedicada', () => {
    const previous = process.env.LIVE_SHARE_WEB_BASE_URL
    process.env.LIVE_SHARE_WEB_BASE_URL = 'https://seguranca.telefarmed.com.br'
    assert.equal(buildLiveSharePublicUrl('AB12CD34'), 'https://seguranca.telefarmed.com.br/AB12CD34')
    if (previous) process.env.LIVE_SHARE_WEB_BASE_URL = previous
    else delete process.env.LIVE_SHARE_WEB_BASE_URL
  })

  it('mapeia input de criação com escopo do paciente', () => {
    const row = mapCreateInputToInsertRow(
      {
        pacienteId: 'pac-1',
        entidadeContratanteId: 'ent-1',
        cpf: '12345678901',
      },
      {
        participantName: ' Maria ',
        activityName: ' Corrida ',
      },
      'AB12CD34',
    )

    assert.equal(row.share_token, 'AB12CD34')
    assert.equal(row.participant_name, 'Maria')
    assert.equal(row.activity_name, 'Corrida')
    assert.equal(row.paciente_id, 'pac-1')
    assert.equal(row.entidade_contratante_id, 'ent-1')
    assert.equal(row.created_by_cpf, '12345678901')
    assert.equal(row.is_active, true)
  })

  it('detecta sessão expirada', () => {
    const expired = mapLiveSessionRow({
      id: '11111111-1111-1111-1111-111111111111',
      share_token: 'AB12CD34',
      participant_name: 'Maria',
      activity_name: 'Caminhada',
      is_active: true,
      started_at: '2026-07-08T10:00:00.000Z',
      expires_at: '2026-07-08T11:00:00.000Z',
      created_at: '2026-07-08T10:00:00.000Z',
      paciente_id: 'pac-1',
      entidade_contratante_id: 'ent-1',
      created_by_cpf: '12345678901',
    })

    assert.equal(expired.shareToken, 'AB12CD34')
    assert.equal(
      isLiveSessionExpired(
        {
          id: expired.id,
          share_token: expired.shareToken,
          participant_name: expired.participantName,
          activity_name: expired.activityName,
          is_active: true,
          started_at: expired.startedAt,
          expires_at: '2020-01-01T00:00:00.000Z',
          created_at: expired.startedAt,
          paciente_id: 'pac-1',
          entidade_contratante_id: 'ent-1',
          created_by_cpf: '12345678901',
        },
        Date.parse('2026-07-08T12:00:00.000Z'),
      ),
      true,
    )
  })

  it('resolve base URL padrão', () => {
    const previous = process.env.LIVE_SHARE_WEB_BASE_URL
    delete process.env.LIVE_SHARE_WEB_BASE_URL
    assert.equal(resolveLiveShareWebBaseUrl(), 'https://seguranca.telefarmed.com.br')
    if (previous) process.env.LIVE_SHARE_WEB_BASE_URL = previous
  })
})
