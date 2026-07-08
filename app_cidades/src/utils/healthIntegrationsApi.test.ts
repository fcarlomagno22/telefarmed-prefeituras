import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  connectionStateToUpdateInput,
  mapIntegracaoDtoToConnectionState,
  mapIntegracoesDtoToConnectionState,
} from './healthIntegrationsApi.ts'

describe('healthIntegrationsApi', () => {
  it('mapeia DTO conectado para IntegrationConnectionState', () => {
    const state = mapIntegracaoDtoToConnectionState({
      status: 'connected',
      permissions: ['steps', 'heart-rate'],
      connectedAt: '2026-07-08T11:00:00.000-03:00',
      lastSyncedAt: '2026-07-08T12:00:00.000-03:00',
    })

    assert.equal(state.status, 'connected')
    assert.deepEqual(state.enabledPermissions, ['steps', 'heart-rate'])
    assert.equal(state.lastSyncedAt, Date.parse('2026-07-08T12:00:00.000-03:00'))
  })

  it('mapeia dispositivo com connectedDeviceName', () => {
    const state = mapIntegracaoDtoToConnectionState({
      status: 'connected',
      permissions: [],
      connectedAt: '2026-07-08T11:00:00.000-03:00',
      connectedDeviceName: 'Galaxy Watch 6',
    })

    assert.equal(state.connectedDeviceName, 'Galaxy Watch 6')
  })

  it('monta payload PUT a partir do estado local', () => {
    const payload = connectionStateToUpdateInput({
      status: 'connected',
      enabledPermissions: ['steps', 'distance'],
      lastSyncedAt: Date.parse('2026-07-08T12:00:00.000-03:00'),
    })

    assert.equal(payload.status, 'connected')
    assert.deepEqual(payload.permissions, ['steps', 'distance'])
    assert.equal(payload.connectedAt, '2026-07-08T15:00:00.000Z')
    assert.equal(payload.lastSyncedAt, '2026-07-08T15:00:00.000Z')
  })

  it('desconexão envia status disconnected', () => {
    const payload = connectionStateToUpdateInput({
      status: 'disconnected',
      enabledPermissions: ['steps'],
    })

    assert.equal(payload.status, 'disconnected')
    assert.deepEqual(payload.permissions, ['steps'])
    assert.equal(payload.connectedAt, undefined)
  })

  it('mapeia mapa de integrações', () => {
    const connections = mapIntegracoesDtoToConnectionState({
      'apple-health': {
        status: 'connected',
        permissions: ['steps'],
        connectedAt: '2026-07-08T11:00:00.000-03:00',
      },
    })

    assert.equal(connections['apple-health']?.status, 'connected')
  })
})
