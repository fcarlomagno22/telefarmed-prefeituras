import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  aggregateMedidasCorporaisLeituras,
  formatMedidaCorporalValueCm,
  leituraToMedidaCorporalPoint,
  pickMedidasCorporaisHistorico,
} from './medidas-corporais.formatters.js'
import type { PacienteMetricasLeituraRow } from './types.js'

const baseRow: PacienteMetricasLeituraRow = {
  id: '11111111-1111-1111-1111-111111111111',
  paciente_id: 'pac-1',
  entidade_contratante_id: 'ent-1',
  tipo: 'medida_corporal',
  registrado_em: '2026-07-08T10:30:00.000-03:00',
  origem: 'manual',
  valor: 92.4,
  valor_secundario: null,
  contexto_glicemia: null,
  medida_corporal: 'abdomen',
  metadados: {},
  criado_em: '2026-07-08T10:30:00.000-03:00',
}

describe('medidas-corporais.formatters', () => {
  it('formata cm inteiros para medidas principais', () => {
    assert.equal(formatMedidaCorporalValueCm('abdomen', 92.4), 92)
    assert.equal(formatMedidaCorporalValueCm('cintura', 88.9), 89)
  })

  it('formata cm com uma casa para braço e pescoço', () => {
    assert.equal(formatMedidaCorporalValueCm('braco', 32.44), 32.4)
    assert.equal(formatMedidaCorporalValueCm('pescoco', 38.06), 38.1)
  })

  it('mapeia leitura para MetricDataPoint', () => {
    const point = leituraToMedidaCorporalPoint(baseRow)
    assert.deepEqual(point, { date: '2026-07-08', value: 92 })
  })

  it('agrega leituras por medida mantendo a última do dia', () => {
    const measurements = aggregateMedidasCorporaisLeituras([
      baseRow,
      {
        ...baseRow,
        id: '22222222-2222-2222-2222-222222222222',
        registrado_em: '2026-07-08T18:00:00.000-03:00',
        valor: 90,
      },
      {
        ...baseRow,
        id: '33333333-3333-3333-3333-333333333333',
        medida_corporal: 'cintura',
        valor: 84,
      },
      {
        ...baseRow,
        id: '44444444-4444-4444-4444-444444444444',
        medida_corporal: 'cintura',
        registrado_em: '2026-07-09T09:00:00.000-03:00',
        valor: 83,
      },
    ])

    assert.deepEqual(measurements.abdomen, [{ date: '2026-07-08', value: 90 }])
    assert.deepEqual(measurements.cintura, [
      { date: '2026-07-08', value: 84 },
      { date: '2026-07-09', value: 83 },
    ])
  })

  it('filtra histórico por tipo quando informado', () => {
    const measurements = {
      abdomen: [{ date: '2026-07-08', value: 90 }],
      cintura: [{ date: '2026-07-08', value: 84 }],
    }

    assert.deepEqual(pickMedidasCorporaisHistorico(measurements, 'cintura'), {
      cintura: [{ date: '2026-07-08', value: 84 }],
    })
    assert.deepEqual(pickMedidasCorporaisHistorico(measurements), measurements)
    assert.deepEqual(pickMedidasCorporaisHistorico(measurements, 'quadril'), {})
  })
})
