import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildHeartRateReading,
  buildRunWalkIntegracoesLeiturasTempoRealDto,
  buildStepsReading,
  hasConnectedIntegrationPermission,
  isIntegrationActiveForLiveReadings,
} from './integracoes-leituras-tempo-real.formatters.js'
import type {
  PacienteMetricasIntegracaoRow,
  PacienteMetricasLeituraRow,
} from '../vd-metricas/types.js'

const integrationRow = (
  overrides: Partial<PacienteMetricasIntegracaoRow> = {},
): PacienteMetricasIntegracaoRow => ({
  id: '11111111-1111-1111-1111-111111111111',
  paciente_id: 'pac-1',
  entidade_contratante_id: 'ent-1',
  integration_id: 'apple-health',
  status: 'connected',
  permissions: ['steps', 'heart-rate'],
  metadata: { lastSyncedAt: '2026-07-08T10:00:00.000-03:00' },
  conectado_em: '2026-07-08T09:00:00.000-03:00',
  criado_em: '2026-07-08T09:00:00.000-03:00',
  atualizado_em: '2026-07-08T10:00:00.000-03:00',
  ...overrides,
})

const heartRateRow = (
  overrides: Partial<PacienteMetricasLeituraRow> = {},
): PacienteMetricasLeituraRow => ({
  id: '22222222-2222-2222-2222-222222222222',
  paciente_id: 'pac-1',
  entidade_contratante_id: 'ent-1',
  tipo: 'frequencia_cardiaca',
  registrado_em: '2026-07-08T10:29:30.000-03:00',
  origem: 'integracao',
  valor: 142,
  valor_secundario: null,
  contexto_glicemia: null,
  medida_corporal: null,
  metadados: { context: 'workout', sourceLabel: 'Apple Watch' },
  criado_em: '2026-07-08T10:29:30.000-03:00',
  ...overrides,
})

describe('integracoes-leituras-tempo-real.formatters', () => {
  it('detecta integração ativa com permissão de HR ou passos', () => {
    const rows = [
      integrationRow(),
      integrationRow({
        id: '33333333-3333-3333-3333-333333333333',
        integration_id: 'devices',
        status: 'disconnected',
        permissions: ['heart-rate'],
      }),
    ]

    assert.equal(isIntegrationActiveForLiveReadings(rows), true)
    assert.equal(hasConnectedIntegrationPermission(rows, 'heart-rate'), true)
    assert.equal(hasConnectedIntegrationPermission(rows, 'steps'), true)
  })

  it('marca HR recente como disponível', () => {
    const reading = buildHeartRateReading(heartRateRow(), {
      available: true,
      maxAgeSeconds: 120,
      nowIso: '2026-07-08T10:30:00.000-03:00',
    })

    assert.equal(reading.available, true)
    assert.equal(reading.bpm, 142)
    assert.equal(reading.stale, false)
    assert.equal(reading.source, 'integracao')
    assert.equal(reading.sourceLabel, 'Apple Watch')
  })

  it('marca HR antigo como stale', () => {
    const reading = buildHeartRateReading(heartRateRow(), {
      available: true,
      maxAgeSeconds: 60,
      nowIso: '2026-07-08T10:35:00.000-03:00',
    })

    assert.equal(reading.available, false)
    assert.equal(reading.bpm, null)
    assert.equal(reading.stale, true)
  })

  it('monta passos com total do dia e delta da sessão', () => {
    const steps = buildStepsReading({
      available: true,
      todayTotal: 5400,
      sessionDelta: 850,
      latestRecordedAt: '2026-07-08T10:28:00.000-03:00',
      sourceLabel: 'Apple Health',
    })

    assert.deepEqual(steps, {
      available: true,
      todayTotal: 5400,
      sessionDelta: 850,
      recordedAt: '2026-07-08T10:28:00.000-03:00',
      sourceLabel: 'Apple Health',
    })
  })

  it('monta payload completo com limitações documentadas', () => {
    const payload = buildRunWalkIntegracoesLeiturasTempoRealDto({
      integrations: [integrationRow()],
      heartRateRow: heartRateRow(),
      todayTotalSteps: 5400,
      sessionDeltaSteps: 850,
      latestStepsRecordedAt: '2026-07-08T10:28:00.000-03:00',
      sessionStartedAt: '2026-07-08T10:00:00.000-03:00',
      maxAgeSeconds: 120,
      fetchedAt: '2026-07-08T10:30:00.000-03:00',
    })

    assert.equal(payload.integrationActive, true)
    assert.equal(payload.heartRate.bpm, 142)
    assert.equal(payload.steps.sessionDelta, 850)
    assert.equal(payload.pollIntervalMs, 10_000)
    assert.ok(payload.limitations.length >= 3)
  })
})
