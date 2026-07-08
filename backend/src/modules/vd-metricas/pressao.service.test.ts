import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  formatPressaoMmHg,
  leituraToBloodPressureHistoryEntry,
  mapPressaoLeituras,
} from './pressao.formatters.js'
import type { PacienteMetricasLeituraRow } from './types.js'

const sampleRow: PacienteMetricasLeituraRow = {
  id: '11111111-1111-1111-1111-111111111111',
  paciente_id: 'pac-1',
  entidade_contratante_id: 'ent-1',
  tipo: 'pressao',
  registrado_em: '2026-07-08T10:30:00.000-03:00',
  origem: 'manual',
  valor: 120.4,
  valor_secundario: 80.6,
  contexto_glicemia: null,
  medida_corporal: null,
  metadados: {},
  criado_em: '2026-07-08T10:30:00.000-03:00',
}

describe('pressao.formatters', () => {
  it('arredonda pressão em mmHg', () => {
    assert.equal(formatPressaoMmHg(120.4), 120)
    assert.equal(formatPressaoMmHg(80.6), 81)
  })

  it('mapeia leitura para BloodPressureHistoryEntry', () => {
    const entry = leituraToBloodPressureHistoryEntry(sampleRow)

    assert.deepEqual(entry, {
      id: sampleRow.id,
      recordedAt: sampleRow.registrado_em,
      systolic: 120,
      diastolic: 81,
    })
  })

  it('mapeia lista de leituras', () => {
    const entries = mapPressaoLeituras([
      sampleRow,
      {
        ...sampleRow,
        id: '22222222-2222-2222-2222-222222222222',
        valor: 140,
        valor_secundario: 90,
      },
    ])

    assert.equal(entries.length, 2)
    assert.equal(entries[1]?.systolic, 140)
    assert.equal(entries[1]?.diastolic, 90)
  })
})
