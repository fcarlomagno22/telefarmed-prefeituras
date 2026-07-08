import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { extractPosConsultaVitals } from './pos-consulta-sync.service.js'
import type { PosConsultaCheckinRespostasInput } from '../pos-consulta/schemas.js'

function baseRespostas(
  overrides: Partial<PosConsultaCheckinRespostasInput> = {},
): PosConsultaCheckinRespostasInput {
  return {
    evolucaoComparacao: 'igual',
    intensidadeSintoma: 3,
    medicacaoAdesao: 'sim',
    medicacaoAdesaoMotivo: '',
    bloodPressureSystolic: { value: 120, notMeasured: false },
    bloodPressureDiastolic: { value: 80, notMeasured: false },
    bloodGlucose: { value: 95, notMeasured: false },
    alertSigns: {
      dispneia: false,
      dor_toracica: false,
      febre_persistente: false,
      sangramento: false,
      confusao_mental: false,
    },
    ...overrides,
  }
}

describe('extractPosConsultaVitals', () => {
  it('extrai pressão no check-in ímpar (só blood_pressure solicitado)', () => {
    const vitals = extractPosConsultaVitals(baseRespostas(), 1)

    assert.deepEqual(vitals.bloodPressure, { systolic: 120, diastolic: 80 })
    assert.equal(vitals.bloodGlucose, null)
  })

  it('extrai pressão e glicemia no check-in par', () => {
    const vitals = extractPosConsultaVitals(baseRespostas(), 2)

    assert.deepEqual(vitals.bloodPressure, { systolic: 120, diastolic: 80 })
    assert.deepEqual(vitals.bloodGlucose, { amountMg: 95 })
  })

  it('ignora campos marcados como não medidos', () => {
    const vitals = extractPosConsultaVitals(
      baseRespostas({
        bloodPressureSystolic: { value: null, notMeasured: true },
        bloodPressureDiastolic: { value: null, notMeasured: true },
        bloodGlucose: { value: null, notMeasured: true },
      }),
      2,
    )

    assert.equal(vitals.bloodPressure, null)
    assert.equal(vitals.bloodGlucose, null)
  })

  it('ignora pressão inválida quando sistólica não é maior que diastólica', () => {
    const vitals = extractPosConsultaVitals(
      baseRespostas({
        bloodPressureSystolic: { value: 80, notMeasured: false },
        bloodPressureDiastolic: { value: 120, notMeasured: false },
      }),
      1,
    )

    assert.equal(vitals.bloodPressure, null)
  })

  it('arredonda valores decimais', () => {
    const vitals = extractPosConsultaVitals(
      baseRespostas({
        bloodPressureSystolic: { value: 120.6, notMeasured: false },
        bloodPressureDiastolic: { value: 80.4, notMeasured: false },
        bloodGlucose: { value: 95.7, notMeasured: false },
      }),
      2,
    )

    assert.deepEqual(vitals.bloodPressure, { systolic: 121, diastolic: 80 })
    assert.deepEqual(vitals.bloodGlucose, { amountMg: 96 })
  })
})
