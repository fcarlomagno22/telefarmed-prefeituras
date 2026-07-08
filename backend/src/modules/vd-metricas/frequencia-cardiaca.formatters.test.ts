import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  formatFrequenciaBpm,
  leituraToHeartRateHistoryEntry,
  mapFrequenciaCardiacaLeituras,
} from './frequencia-cardiaca.formatters.js'
import type { PacienteMetricasLeituraRow } from './types.js'

const manualRow: PacienteMetricasLeituraRow = {
  id: '11111111-1111-1111-1111-111111111111',
  paciente_id: 'pac-1',
  entidade_contratante_id: 'ent-1',
  tipo: 'frequencia_cardiaca',
  registrado_em: '2026-07-08T10:30:00.000-03:00',
  origem: 'manual',
  valor: 74.6,
  valor_secundario: null,
  contexto_glicemia: null,
  medida_corporal: null,
  metadados: { context: 'manual' },
  criado_em: '2026-07-08T10:30:00.000-03:00',
}

const integrationRow: PacienteMetricasLeituraRow = {
  ...manualRow,
  id: '22222222-2222-2222-2222-222222222222',
  origem: 'integracao',
  valor: 96,
  metadados: { context: 'workout', sourceLabel: 'Apple Health' },
}

describe('frequencia-cardiaca.formatters', () => {
  it('arredonda bpm', () => {
    assert.equal(formatFrequenciaBpm(74.6), 75)
    assert.equal(formatFrequenciaBpm(96), 96)
  })

  it('mapeia leitura manual para HeartRateHistoryEntry', () => {
    const entry = leituraToHeartRateHistoryEntry(manualRow)

    assert.deepEqual(entry, {
      id: manualRow.id,
      recordedAt: manualRow.registrado_em,
      bpm: 75,
      source: 'manual',
      context: 'manual',
    })
  })

  it('mapeia leitura de integração com sourceLabel', () => {
    const entry = leituraToHeartRateHistoryEntry(integrationRow)

    assert.deepEqual(entry, {
      id: integrationRow.id,
      recordedAt: integrationRow.registrado_em,
      bpm: 96,
      source: 'integracao',
      context: 'workout',
      sourceLabel: 'Apple Health',
    })
  })

  it('mapeia lista de leituras', () => {
    const entries = mapFrequenciaCardiacaLeituras([manualRow, integrationRow])
    assert.equal(entries.length, 2)
    assert.equal(entries[1]?.source, 'integracao')
  })
})
