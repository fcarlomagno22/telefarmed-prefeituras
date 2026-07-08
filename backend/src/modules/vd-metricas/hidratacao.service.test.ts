import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  aggregateHidratacaoLeituras,
  buildHydrationDayId,
  formatHidratacaoMl,
} from './hidratacao.formatters.js'
import type { PacienteMetricasLeituraRow } from './types.js'

function makeRow(
  id: string,
  registradoEm: string,
  valor: number,
): PacienteMetricasLeituraRow {
  return {
    id,
    paciente_id: 'pac-1',
    entidade_contratante_id: 'ent-1',
    tipo: 'hidratacao',
    registrado_em: registradoEm,
    origem: 'manual',
    valor,
    valor_secundario: null,
    contexto_glicemia: null,
    medida_corporal: null,
    metadados: {},
    criado_em: registradoEm,
  }
}

describe('hidratacao.formatters', () => {
  it('arredonda volume em ml', () => {
    assert.equal(formatHidratacaoMl(249.6), 250)
  })

  it('gera id determinístico por dia', () => {
    assert.equal(buildHydrationDayId('2026-07-08'), 'hydration-2026-07-08')
  })

  it('agrega leituras por dia em totalMl', () => {
    const days = aggregateHidratacaoLeituras([
      makeRow('1', '2026-07-08T08:00:00.000-03:00', 250),
      makeRow('2', '2026-07-08T20:00:00.000-03:00', 300),
      makeRow('3', '2026-07-07T10:00:00.000-03:00', 1800),
    ])

    assert.deepEqual(days, [
      {
        id: 'hydration-2026-07-08',
        date: '2026-07-08',
        totalMl: 550,
      },
      {
        id: 'hydration-2026-07-07',
        date: '2026-07-07',
        totalMl: 1800,
      },
    ])
  })
})
