import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  createMetricasCaminhadaBodySchema,
  createMetricasFrequenciaCardiacaBodySchema,
  createMetricasGlicemiaBodySchema,
  createMetricasHidratacaoBodySchema,
  createMetricasMedidasCorporaisBodySchema,
  createMetricasPesoBodySchema,
  createMetricasPressaoBodySchema,
  formatMetricasValidationError,
  metricasAtividadeQuerySchema,
  metricasFrequenciaCardiacaContextSchema,
  metricasFrequenciaCardiacaQuerySchema,
  metricasGlicemiaContextSchema,
  metricasGlicemiaIdParamsSchema,
  metricasGlicemiaQuerySchema,
  metricasHidratacaoQuerySchema,
  metricasMedidaCorporalSchema,
  metricasMedidasCorporaisQuerySchema,
  metricasIntegracaoIdParamsSchema,
  metricasPesoQuerySchema,
  metricasPressaoQuerySchema,
  updateMetricasIntegracaoBodySchema,
  updateMetricasPerfilBodySchema,
} from './schemas.js'

describe('updateMetricasPerfilBodySchema', () => {
  it('aceita atualização parcial de altura e peso', () => {
    const parsed = updateMetricasPerfilBodySchema.safeParse({
      heightMeters: 1.72,
      weightKg: 78,
    })
    assert.equal(parsed.success, true)
  })

  it('aceita data de nascimento em ISO', () => {
    const parsed = updateMetricasPerfilBodySchema.safeParse({
      birthDate: '1985-03-15',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita body vazio', () => {
    const parsed = updateMetricasPerfilBodySchema.safeParse({})
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.equal(
        formatMetricasValidationError(parsed.error),
        'Informe ao menos um campo para atualizar.',
      )
    }
  })

  it('rejeita altura fora do intervalo', () => {
    const parsed = updateMetricasPerfilBodySchema.safeParse({
      heightMeters: 3,
    })
    assert.equal(parsed.success, false)
  })
})

describe('metricasPesoQuerySchema', () => {
  it('aceita filtro por período compatível com PeriodSelection', () => {
    const parsed = metricasPesoQuerySchema.safeParse({
      start: '2026-07-01T00:00:00.000-03:00',
      end: '2026-07-08T23:59:59.999-03:00',
    })
    assert.equal(parsed.success, true)
  })

  it('aceita consulta sem período', () => {
    const parsed = metricasPesoQuerySchema.safeParse({})
    assert.equal(parsed.success, true)
  })

  it('rejeita período invertido', () => {
    const parsed = metricasPesoQuerySchema.safeParse({
      start: '2026-07-08T23:59:59.999-03:00',
      end: '2026-07-01T00:00:00.000-03:00',
    })
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.equal(formatMetricasValidationError(parsed.error), 'Período inválido.')
    }
  })
})

describe('createMetricasPesoBodySchema', () => {
  it('aceita registro de peso com recordedAt opcional', () => {
    const parsed = createMetricasPesoBodySchema.safeParse({
      weightKg: 78,
      recordedAt: '2026-07-08T10:30:00.000-03:00',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita peso fora do intervalo', () => {
    const parsed = createMetricasPesoBodySchema.safeParse({ weightKg: 12 })
    assert.equal(parsed.success, false)
  })
})

describe('createMetricasGlicemiaBodySchema', () => {
  it('aceita registro de glicemia com contexto e recordedAt opcional', () => {
    const parsed = createMetricasGlicemiaBodySchema.safeParse({
      amountMg: 92,
      context: 'fasting',
      recordedAt: '2026-07-08T10:30:00.000-03:00',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita glicemia fora do intervalo', () => {
    const parsed = createMetricasGlicemiaBodySchema.safeParse({
      amountMg: 20,
      context: 'other',
    })
    assert.equal(parsed.success, false)
  })

  it('exige contexto de glicemia', () => {
    const parsed = createMetricasGlicemiaBodySchema.safeParse({ amountMg: 92 })
    assert.equal(parsed.success, false)
  })
})

describe('metricasGlicemiaQuerySchema', () => {
  it('aceita filtro por período', () => {
    const parsed = metricasGlicemiaQuerySchema.safeParse({
      start: '2026-07-01T00:00:00.000-03:00',
      end: '2026-07-08T23:59:59.999-03:00',
    })
    assert.equal(parsed.success, true)
  })
})

describe('createMetricasPressaoBodySchema', () => {
  it('aceita registro de pressão com recordedAt opcional', () => {
    const parsed = createMetricasPressaoBodySchema.safeParse({
      systolic: 120,
      diastolic: 80,
      recordedAt: '2026-07-08T10:30:00.000-03:00',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita sistólica fora do intervalo clínico', () => {
    const parsed = createMetricasPressaoBodySchema.safeParse({
      systolic: 70,
      diastolic: 50,
    })
    assert.equal(parsed.success, false)
  })

  it('rejeita diastólica fora do intervalo clínico', () => {
    const parsed = createMetricasPressaoBodySchema.safeParse({
      systolic: 120,
      diastolic: 140,
    })
    assert.equal(parsed.success, false)
  })

  it('exige sistólica maior que diastólica', () => {
    const parsed = createMetricasPressaoBodySchema.safeParse({
      systolic: 80,
      diastolic: 90,
    })
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.equal(
        formatMetricasValidationError(parsed.error),
        'A sistólica deve ser maior que a diastólica.',
      )
    }
  })

  it('rejeita sistólica igual à diastólica', () => {
    const parsed = createMetricasPressaoBodySchema.safeParse({
      systolic: 100,
      diastolic: 100,
    })
    assert.equal(parsed.success, false)
  })
})

describe('metricasPressaoQuerySchema', () => {
  it('aceita filtro por período', () => {
    const parsed = metricasPressaoQuerySchema.safeParse({
      start: '2026-07-01T00:00:00.000-03:00',
      end: '2026-07-08T23:59:59.999-03:00',
    })
    assert.equal(parsed.success, true)
  })
})

describe('createMetricasHidratacaoBodySchema', () => {
  it('aceita registro de hidratação com recordedAt opcional', () => {
    const parsed = createMetricasHidratacaoBodySchema.safeParse({
      amountMl: 250,
      recordedAt: '2026-07-08T10:30:00.000-03:00',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita volume fora do intervalo', () => {
    const parsed = createMetricasHidratacaoBodySchema.safeParse({ amountMl: 20 })
    assert.equal(parsed.success, false)
  })
})

describe('metricasHidratacaoQuerySchema', () => {
  it('aceita filtro por período', () => {
    const parsed = metricasHidratacaoQuerySchema.safeParse({
      start: '2026-07-01T00:00:00.000-03:00',
      end: '2026-07-08T23:59:59.999-03:00',
    })
    assert.equal(parsed.success, true)
  })
})

describe('createMetricasMedidasCorporaisBodySchema', () => {
  it('aceita registro de medida corporal com recordedAt opcional', () => {
    const parsed = createMetricasMedidasCorporaisBodySchema.safeParse({
      measurementId: 'abdomen',
      valueCm: 92,
      recordedAt: '2026-07-08T10:30:00.000-03:00',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita valor fora do intervalo da medida', () => {
    const parsed = createMetricasMedidasCorporaisBodySchema.safeParse({
      measurementId: 'braco',
      valueCm: 10,
    })
    assert.equal(parsed.success, false)
  })

  it('rejeita measurementId fora do enum (peso não é medida corporal)', () => {
    const parsed = createMetricasMedidasCorporaisBodySchema.safeParse({
      measurementId: 'peso',
      valueCm: 78,
    })
    assert.equal(parsed.success, false)
  })
})

describe('metricasMedidasCorporaisQuerySchema', () => {
  it('aceita filtro por período e tipo', () => {
    const parsed = metricasMedidasCorporaisQuerySchema.safeParse({
      start: '2026-07-01T00:00:00.000-03:00',
      end: '2026-07-08T23:59:59.999-03:00',
      tipo: 'abdomen',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita tipo inválido', () => {
    const parsed = metricasMedidasCorporaisQuerySchema.safeParse({ tipo: 'peso' })
    assert.equal(parsed.success, false)
  })
})

describe('createMetricasFrequenciaCardiacaBodySchema', () => {
  it('aceita registro manual com recordedAt opcional', () => {
    const parsed = createMetricasFrequenciaCardiacaBodySchema.safeParse({
      bpm: 74,
      recordedAt: '2026-07-08T10:30:00.000-03:00',
      source: 'manual',
      context: 'manual',
    })
    assert.equal(parsed.success, true)
  })

  it('aceita registro de integração com sourceLabel', () => {
    const parsed = createMetricasFrequenciaCardiacaBodySchema.safeParse({
      bpm: 96,
      source: 'integracao',
      context: 'workout',
      sourceLabel: 'Apple Health',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita bpm fora do intervalo', () => {
    const parsed = createMetricasFrequenciaCardiacaBodySchema.safeParse({ bpm: 20 })
    assert.equal(parsed.success, false)
  })
})

describe('metricasFrequenciaCardiacaQuerySchema', () => {
  it('aceita filtro por período', () => {
    const parsed = metricasFrequenciaCardiacaQuerySchema.safeParse({
      start: '2026-07-01T00:00:00.000-03:00',
      end: '2026-07-08T23:59:59.999-03:00',
    })
    assert.equal(parsed.success, true)
  })
})

describe('createMetricasCaminhadaBodySchema', () => {
  it('aceita registro manual com passos e duração', () => {
    const parsed = createMetricasCaminhadaBodySchema.safeParse({
      steps: 2500,
      durationMinutes: 30,
      recordedAt: '2026-07-08T10:30:00.000-03:00',
    })
    assert.equal(parsed.success, true)
  })

  it('aceita registro apenas com distância', () => {
    const parsed = createMetricasCaminhadaBodySchema.safeParse({ distanceKm: 2.4 })
    assert.equal(parsed.success, true)
  })

  it('rejeita body vazio', () => {
    const parsed = createMetricasCaminhadaBodySchema.safeParse({})
    assert.equal(parsed.success, false)
  })
})

describe('metricasAtividadeQuerySchema', () => {
  it('aceita filtro por período', () => {
    const parsed = metricasAtividadeQuerySchema.safeParse({
      start: '2026-07-01T00:00:00.000-03:00',
      end: '2026-07-08T23:59:59.999-03:00',
    })
    assert.equal(parsed.success, true)
  })
})

describe('metricasIntegracaoIdParamsSchema', () => {
  it('aceita integrationId conhecido', () => {
    const parsed = metricasIntegracaoIdParamsSchema.safeParse({
      integrationId: 'health-connect',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita integrationId inválido', () => {
    const parsed = metricasIntegracaoIdParamsSchema.safeParse({
      integrationId: 'fitbit',
    })
    assert.equal(parsed.success, false)
  })
})

describe('updateMetricasIntegracaoBodySchema', () => {
  it('aceita conexão com permissões e connectedAt opcional', () => {
    const parsed = updateMetricasIntegracaoBodySchema.safeParse({
      status: 'connected',
      permissions: ['steps', 'heart-rate'],
      connectedAt: '2026-07-08T12:00:00.000-03:00',
    })
    assert.equal(parsed.success, true)
  })

  it('aceita desconexão sem permissões', () => {
    const parsed = updateMetricasIntegracaoBodySchema.safeParse({
      status: 'disconnected',
    })
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.deepEqual(parsed.data.permissions, [])
    }
  })

  it('rejeita permissão fora do enum', () => {
    const parsed = updateMetricasIntegracaoBodySchema.safeParse({
      status: 'connected',
      permissions: ['sleep'],
    })
    assert.equal(parsed.success, false)
  })
})

describe('metricasGlicemiaIdParamsSchema', () => {
  it('aceita uuid válido', () => {
    const parsed = metricasGlicemiaIdParamsSchema.safeParse({
      id: '11111111-1111-1111-1111-111111111111',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita id inválido', () => {
    const parsed = metricasGlicemiaIdParamsSchema.safeParse({ id: 'abc' })
    assert.equal(parsed.success, false)
  })
})

describe('metricas enums base', () => {
  it('aceita contextos de glicemia do app', () => {
    for (const context of ['fasting', 'pre_meal', 'post_meal', 'bedtime', 'other'] as const) {
      assert.equal(metricasGlicemiaContextSchema.safeParse(context).success, true)
    }
  })

  it('aceita medidas corporais do app', () => {
    for (const medida of ['abdomen', 'quadril', 'peito', 'cintura', 'coxa', 'braco', 'pescoco'] as const) {
      assert.equal(metricasMedidaCorporalSchema.safeParse(medida).success, true)
    }
  })

  it('aceita contextos de frequência cardíaca do app', () => {
    for (const context of ['resting', 'workout', 'sleep', 'manual'] as const) {
      assert.equal(metricasFrequenciaCardiacaContextSchema.safeParse(context).success, true)
    }
  })
})
