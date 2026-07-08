import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildIntegracoesRecord,
  parseIntegracaoPermissions,
  rowToIntegracaoMetricasDto,
} from './integracoes.formatters.js'
import type { PacienteMetricasIntegracaoRow } from './types.js'

function buildRow(
  overrides: Partial<PacienteMetricasIntegracaoRow> = {},
): PacienteMetricasIntegracaoRow {
  return {
    id: 'row-1',
    paciente_id: 'paciente-1',
    entidade_contratante_id: 'entidade-1',
    integration_id: 'apple-health',
    status: 'connected',
    permissions: ['steps', 'distance'],
    metadata: {
      lastSyncedAt: '2026-07-08T12:00:00.000-03:00',
    },
    conectado_em: '2026-07-08T11:00:00.000-03:00',
    criado_em: '2026-07-08T10:00:00.000-03:00',
    atualizado_em: '2026-07-08T12:00:00.000-03:00',
    ...overrides,
  }
}

describe('integracoes.formatters', () => {
  it('filtra permissions inválidas', () => {
    assert.deepEqual(parseIntegracaoPermissions(['steps', '', 1, 'distance']), [
      'steps',
      'distance',
    ])
  })

  it('mapeia linha conectada para DTO', () => {
    const dto = rowToIntegracaoMetricasDto(buildRow())
    assert.equal(dto.status, 'connected')
    assert.deepEqual(dto.permissions, ['steps', 'distance'])
    assert.equal(dto.connectedAt, '2026-07-08T11:00:00.000-03:00')
    assert.equal(dto.lastSyncedAt, '2026-07-08T12:00:00.000-03:00')
  })

  it('inclui connectedDeviceName quando presente em metadata', () => {
    const dto = rowToIntegracaoMetricasDto(
      buildRow({
        integration_id: 'devices',
        metadata: {
          connectedDeviceName: 'Galaxy Watch 6',
          lastSyncedAt: '2026-07-08T12:00:00.000-03:00',
        },
      }),
    )
    assert.equal(dto.connectedDeviceName, 'Galaxy Watch 6')
  })

  it('monta mapa por integration_id', () => {
    const map = buildIntegracoesRecord([
      buildRow({ integration_id: 'apple-health' }),
      buildRow({
        integration_id: 'health-connect',
        status: 'disconnected',
        permissions: [],
        metadata: {},
        conectado_em: null,
      }),
    ])

    assert.equal(Object.keys(map).length, 2)
    assert.equal(map['health-connect']?.status, 'disconnected')
  })
})
