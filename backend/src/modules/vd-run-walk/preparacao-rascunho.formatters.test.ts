import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isPreparacaoRascunhoExpired,
  mapPreparacaoRascunhoRowToDto,
  resolvePreparacaoRascunhoExpiresAt,
  RUN_WALK_PREPARACAO_RASCUNHO_TTL_MS,
} from './preparacao-rascunho.formatters.js'

describe('preparacao-rascunho.formatters', () => {
  it('resolve expiração com TTL de 24 horas', () => {
    const now = new Date('2026-07-08T10:00:00.000-03:00')
    const expiresAt = resolvePreparacaoRascunhoExpiresAt(now)
    assert.equal(
      Date.parse(expiresAt) - now.getTime(),
      RUN_WALK_PREPARACAO_RASCUNHO_TTL_MS,
    )
  })

  it('detecta rascunho expirado', () => {
    assert.equal(
      isPreparacaoRascunhoExpired(
        '2026-07-08T09:00:00.000-03:00',
        Date.parse('2026-07-08T10:00:00.000-03:00'),
      ),
      true,
    )
    assert.equal(
      isPreparacaoRascunhoExpired(
        '2026-07-08T11:00:00.000-03:00',
        Date.parse('2026-07-08T10:00:00.000-03:00'),
      ),
      false,
    )
  })

  it('mapeia linha do banco para DTO da API', () => {
    const dto = mapPreparacaoRascunhoRowToDto({
      id: '11111111-1111-1111-1111-111111111111',
      paciente_id: 'pac-1',
      entidade_contratante_id: 'ent-1',
      modality: 'run-walk',
      activity_name: 'Corrida e caminhada',
      intensity: 'Confortável',
      duration_minutes: 30,
      audio_configured: true,
      expires_at: '2026-07-09T10:00:00.000-03:00',
      criado_em: '2026-07-08T10:00:00.000-03:00',
      atualizado_em: '2026-07-08T10:15:00.000-03:00',
    })

    assert.deepEqual(dto, {
      modality: 'run-walk',
      activityName: 'Corrida e caminhada',
      intensity: 'Confortável',
      durationMinutes: 30,
      audioConfigured: true,
      updatedAt: '2026-07-08T10:15:00.000-03:00',
      expiresAt: '2026-07-09T10:00:00.000-03:00',
    })
  })
})
