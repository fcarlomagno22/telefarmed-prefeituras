import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  formatGlicemiaAmountMg,
  leituraToGlucoseHistoryEntry,
  mapGlicemiaLeituras,
} from './glicemia.formatters.js'
import type { PacienteMetricasLeituraRow } from './types.js'

const sampleRow: PacienteMetricasLeituraRow = {
  id: '11111111-1111-1111-1111-111111111111',
  paciente_id: 'pac-1',
  entidade_contratante_id: 'ent-1',
  tipo: 'glicemia',
  registrado_em: '2026-07-08T10:30:00.000-03:00',
  origem: 'manual',
  valor: 92.4,
  valor_secundario: null,
  contexto_glicemia: 'fasting',
  medida_corporal: null,
  metadados: {},
  criado_em: '2026-07-08T10:30:00.000-03:00',
}

describe('glicemia.formatters', () => {
  it('arredonda glicemia em mg/dL', () => {
    assert.equal(formatGlicemiaAmountMg(92.4), 92)
    assert.equal(formatGlicemiaAmountMg(110.6), 111)
  })

  it('mapeia leitura para GlucoseHistoryEntry', () => {
    const entry = leituraToGlucoseHistoryEntry(sampleRow)

    assert.deepEqual(entry, {
      id: sampleRow.id,
      recordedAt: sampleRow.registrado_em,
      amountMg: 92,
      context: 'fasting',
    })
  })

  it('mapeia lista de leituras', () => {
    const entries = mapGlicemiaLeituras([
      sampleRow,
      {
        ...sampleRow,
        id: '22222222-2222-2222-2222-222222222222',
        valor: 140,
        contexto_glicemia: 'post_meal',
      },
    ])

    assert.equal(entries.length, 2)
    assert.equal(entries[1]?.context, 'post_meal')
    assert.equal(entries[1]?.amountMg, 140)
  })
})
