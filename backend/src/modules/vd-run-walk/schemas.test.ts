import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  applyPlanoHojeAcaoBodySchema,
  appendLiveSessionPointsBodySchema,
  createContatoConfiancaBodySchema,
  createRunWalkLocalBodySchema,
  createRunWalkLocalComentarioBodySchema,
  listRunWalkLocaisQuerySchema,
  postRunWalkLocalVotoBodySchema,
  createDisposicaoCheckinBodySchema,
  createLiveSessionBodySchema,
  createRunWalkAtividadeBodySchema,
  formatRunWalkValidationError,
  listRunWalkAtividadesQuerySchema,
  patchAtividadeCheckinBodySchema,
  resumoRunWalkAtividadesQuerySchema,
  runWalkAtividadeIdParamsSchema,
  updateContatoConfiancaBodySchema,
  upsertMetasSemanaisBodySchema,
  upsertPlanoHojeBodySchema,
  upsertPreparacaoRascunhoBodySchema,
} from './schemas.js'

const validBody = {
  clientActivityId: 'client-activity-12345678',
  modality: 'walk',
  activityName: 'Caminhada leve',
  elapsedSeconds: 1800,
  distanceKm: 2.5,
  paceMinPerKm: 12,
  stepCount: 3200,
  heartRateBpm: 118,
  estimatedCalories: 180,
  activeMinutes: 30,
  completedAt: '2026-07-08T10:30:00.000-03:00',
  trail: [{ latitude: -23.55, longitude: -46.63, recordedAt: 1_720_431_000_000 }],
}

describe('createRunWalkAtividadeBodySchema', () => {
  it('aceita payload válido de atividade completa', () => {
    const parsed = createRunWalkAtividadeBodySchema.safeParse(validBody)
    assert.equal(parsed.success, true)
  })

  it('aceita check-in pós-atividade', () => {
    const parsed = createRunWalkAtividadeBodySchema.safeParse({
      ...validBody,
      checkIn: {
        intensity: 'adequate',
        wellbeing: 'well',
        discomfort: 'none',
        note: null,
        answeredAt: '2026-07-08T10:35:00.000-03:00',
      },
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita body sem clientActivityId', () => {
    const parsed = createRunWalkAtividadeBodySchema.safeParse({
      ...validBody,
      clientActivityId: 'abc',
    })
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.match(formatRunWalkValidationError(parsed.error), /identificador/i)
    }
  })

  it('rejeita modalidade inválida', () => {
    const parsed = createRunWalkAtividadeBodySchema.safeParse({
      ...validBody,
      modality: 'swim',
    })
    assert.equal(parsed.success, false)
  })

  it('rejeita trail vazio com ponto inválido', () => {
    const parsed = createRunWalkAtividadeBodySchema.safeParse({
      ...validBody,
      trail: [{ latitude: 120, longitude: 0, recordedAt: 1 }],
    })
    assert.equal(parsed.success, false)
  })
})

describe('listRunWalkAtividadesQuerySchema', () => {
  it('aplica defaults de paginação e ordenação', () => {
    const parsed = listRunWalkAtividadesQuerySchema.safeParse({})
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.page, 1)
      assert.equal(parsed.data.pageSize, 20)
      assert.equal(parsed.data.sort, 'recent')
      assert.equal(parsed.data.minDistanceKm, 0)
    }
  })

  it('aceita filtro por período e distância mínima', () => {
    const parsed = listRunWalkAtividadesQuerySchema.safeParse({
      period: '30d',
      sort: 'distance',
      minDistanceKm: 2,
      page: 2,
      pageSize: 10,
    })
    assert.equal(parsed.success, true)
  })

  it('aceita intervalo customizado com startIso e endIso', () => {
    const parsed = listRunWalkAtividadesQuerySchema.safeParse({
      startIso: '2026-07-01T00:00:00.000-03:00',
      endIso: '2026-07-08T23:59:59.999-03:00',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita pageSize acima do limite', () => {
    const parsed = listRunWalkAtividadesQuerySchema.safeParse({ pageSize: 200 })
    assert.equal(parsed.success, false)
  })
})

describe('resumoRunWalkAtividadesQuerySchema', () => {
  it('aplica defaults de período e chartMetric', () => {
    const parsed = resumoRunWalkAtividadesQuerySchema.safeParse({})
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.minDistanceKm, 0)
      assert.equal(parsed.data.chartMetric, 'minutes')
    }
  })

  it('aceita filtro por período e distância mínima', () => {
    const parsed = resumoRunWalkAtividadesQuerySchema.safeParse({
      period: '90d',
      minDistanceKm: 2,
      chartMetric: 'distance',
    })
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.period, '90d')
      assert.equal(parsed.data.chartMetric, 'distance')
    }
  })

  it('aceita intervalo customizado com startIso e endIso', () => {
    const parsed = resumoRunWalkAtividadesQuerySchema.safeParse({
      startIso: '2026-07-01T00:00:00.000-03:00',
      endIso: '2026-07-08T23:59:59.999-03:00',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita chartMetric inválido', () => {
    const parsed = resumoRunWalkAtividadesQuerySchema.safeParse({ chartMetric: 'pace' })
    assert.equal(parsed.success, false)
  })
})

describe('upsertMetasSemanaisBodySchema', () => {
  it('aceita metas semanais válidas', () => {
    const parsed = upsertMetasSemanaisBodySchema.safeParse({
      targetActivities: 4,
      targetActiveMinutes: 150,
      targetMovementDays: 5,
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita atividades acima do limite', () => {
    const parsed = upsertMetasSemanaisBodySchema.safeParse({
      targetActivities: 15,
      targetActiveMinutes: 150,
      targetMovementDays: 5,
    })
    assert.equal(parsed.success, false)
  })

  it('rejeita minutos ativos zero', () => {
    const parsed = upsertMetasSemanaisBodySchema.safeParse({
      targetActivities: 4,
      targetActiveMinutes: 0,
      targetMovementDays: 5,
    })
    assert.equal(parsed.success, false)
  })

  it('rejeita dias de movimento acima de 7', () => {
    const parsed = upsertMetasSemanaisBodySchema.safeParse({
      targetActivities: 4,
      targetActiveMinutes: 150,
      targetMovementDays: 8,
    })
    assert.equal(parsed.success, false)
  })
})

describe('createDisposicaoCheckinBodySchema', () => {
  it('aceita respostas mínimas do drawer (humor)', () => {
    const parsed = createDisposicaoCheckinBodySchema.safeParse({ mood: 'good' })
    assert.equal(parsed.success, true)
  })

  it('aceita follow-up completo', () => {
    const parsed = createDisposicaoCheckinBodySchema.safeParse({
      mood: 'tired',
      sleptWell: false,
      hasPain: false,
      lowEnergy: true,
      preferLighter: true,
      preferWalkOverRun: false,
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita humor inválido', () => {
    const parsed = createDisposicaoCheckinBodySchema.safeParse({ mood: 'exhausted' })
    assert.equal(parsed.success, false)
  })
})

describe('upsertPlanoHojeBodySchema', () => {
  it('aceita seleção por presetId', () => {
    const parsed = upsertPlanoHojeBodySchema.safeParse({ presetId: 'light-walk' })
    assert.equal(parsed.success, true)
  })

  it('aceita customização parcial de activity', () => {
    const parsed = upsertPlanoHojeBodySchema.safeParse({
      activity: { durationMinutes: 20, title: 'Caminhada ajustada' },
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita body vazio', () => {
    const parsed = upsertPlanoHojeBodySchema.safeParse({})
    assert.equal(parsed.success, false)
  })
})

describe('applyPlanoHojeAcaoBodySchema', () => {
  it('aceita ações do menu', () => {
    const parsed = applyPlanoHojeAcaoBodySchema.safeParse({ action: 'reduce-intensity' })
    assert.equal(parsed.success, true)
  })

  it('rejeita ação inválida', () => {
    const parsed = applyPlanoHojeAcaoBodySchema.safeParse({ action: 'pause' })
    assert.equal(parsed.success, false)
  })
})

describe('patchAtividadeCheckinBodySchema', () => {
  it('aceita check-in respondido', () => {
    const parsed = patchAtividadeCheckinBodySchema.safeParse({
      checkIn: {
        intensity: 'adequate',
        wellbeing: 'well',
        discomfort: 'none',
        note: 'Tudo certo',
        answeredAt: '2026-07-08T10:35:00.000-03:00',
      },
    })
    assert.equal(parsed.success, true)
  })

  it('aceita check-in ignorado', () => {
    const parsed = patchAtividadeCheckinBodySchema.safeParse({ checkInSkipped: true })
    assert.equal(parsed.success, true)
  })

  it('rejeita body vazio', () => {
    const parsed = patchAtividadeCheckinBodySchema.safeParse({})
    assert.equal(parsed.success, false)
  })

  it('rejeita checkInSkipped falso', () => {
    const parsed = patchAtividadeCheckinBodySchema.safeParse({ checkInSkipped: false })
    assert.equal(parsed.success, false)
  })
})

describe('appendLiveSessionPointsBodySchema', () => {
  it('aceita batch de pontos', () => {
    const parsed = appendLiveSessionPointsBodySchema.safeParse({
      points: [
        { latitude: -23.55, longitude: -46.63, accuracyMeters: 12 },
        { latitude: -23.551, longitude: -46.631 },
      ],
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita batch vazio', () => {
    const parsed = appendLiveSessionPointsBodySchema.safeParse({ points: [] })
    assert.equal(parsed.success, false)
  })

  it('rejeita mais de 50 pontos', () => {
    const parsed = appendLiveSessionPointsBodySchema.safeParse({
      points: Array.from({ length: 51 }, () => ({
        latitude: -23.55,
        longitude: -46.63,
      })),
    })
    assert.equal(parsed.success, false)
  })
})

describe('createLiveSessionBodySchema', () => {
  it('aceita criação com ponto inicial', () => {
    const parsed = createLiveSessionBodySchema.safeParse({
      participantName: 'Maria',
      activityName: 'Caminhada',
      initialPoint: { latitude: -23.55, longitude: -46.63 },
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita nomes vazios', () => {
    const parsed = createLiveSessionBodySchema.safeParse({
      participantName: ' ',
      activityName: 'Caminhada',
    })
    assert.equal(parsed.success, false)
  })
})

describe('runWalkAtividadeIdParamsSchema', () => {
  it('aceita uuid válido', () => {
    const parsed = runWalkAtividadeIdParamsSchema.safeParse({
      id: '11111111-1111-1111-1111-111111111111',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita id inválido', () => {
    const parsed = runWalkAtividadeIdParamsSchema.safeParse({ id: 'not-a-uuid' })
    assert.equal(parsed.success, false)
  })
})

describe('createContatoConfiancaBodySchema', () => {
  it('aceita payload válido', () => {
    const parsed = createContatoConfiancaBodySchema.safeParse({
      clientContactId: 'contact-local-123456',
      name: 'Maria',
      phone: '(11) 98888-7777',
      liveShareEnabled: true,
      isActiveSos: true,
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita telefone inválido', () => {
    const parsed = createContatoConfiancaBodySchema.safeParse({
      clientContactId: 'contact-local-123456',
      name: 'Maria',
      phone: '123',
    })
    assert.equal(parsed.success, false)
  })

  it('rejeita nome curto', () => {
    const parsed = createContatoConfiancaBodySchema.safeParse({
      clientContactId: 'contact-local-123456',
      name: 'A',
      phone: '(11) 98888-7777',
    })
    assert.equal(parsed.success, false)
  })
})

describe('updateContatoConfiancaBodySchema', () => {
  it('aceita atualização parcial', () => {
    const parsed = updateContatoConfiancaBodySchema.safeParse({
      liveShareEnabled: false,
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita body vazio', () => {
    const parsed = updateContatoConfiancaBodySchema.safeParse({})
    assert.equal(parsed.success, false)
  })
})

describe('listRunWalkLocaisQuerySchema', () => {
  it('aceita query geo com paginação', () => {
    const parsed = listRunWalkLocaisQuerySchema.safeParse({
      latitude: -23.55,
      longitude: -46.63,
      radiusKm: 20,
      page: 2,
      pageSize: 25,
    })
    assert.equal(parsed.success, true)
  })
})

describe('createRunWalkLocalBodySchema', () => {
  it('aceita submissão sem foto e sem descrição', () => {
    const parsed = createRunWalkLocalBodySchema.safeParse({
      name: 'Parque Novo',
      type: 'other',
      latitude: -23.55,
      longitude: -46.63,
      addressLabel: 'Rua A, 100',
      locationSource: 'gps',
    })
    assert.equal(parsed.success, true)
    if (parsed.success) {
      assert.equal(parsed.data.description, '')
    }
  })

  it('aceita submissão com storage path', () => {
    const parsed = createRunWalkLocalBodySchema.safeParse({
      name: 'Parque Novo',
      description: 'Local seguro com iluminação e pista larga.',
      type: 'park',
      latitude: -23.55,
      longitude: -46.63,
      addressLabel: 'Rua A, 100',
      locationSource: 'gps',
      coverPhotoStoragePath: 'ent-1/pac-1/cover.jpg',
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita tipo inválido', () => {
    const parsed = createRunWalkLocalBodySchema.safeParse({
      name: 'Parque Novo',
      type: 'invalid',
      latitude: -23.55,
      longitude: -46.63,
      addressLabel: 'Rua A, 100',
      locationSource: 'gps',
    })
    assert.equal(parsed.success, false)
  })
})

describe('postRunWalkLocalVotoBodySchema', () => {
  it('aceita voto e toggle null', () => {
    assert.equal(
      postRunWalkLocalVotoBodySchema.safeParse({ vote: 'recommend' }).success,
      true,
    )
    assert.equal(postRunWalkLocalVotoBodySchema.safeParse({ vote: null }).success, true)
  })
})

describe('createRunWalkLocalComentarioBodySchema', () => {
  it('aceita comentário válido', () => {
    const parsed = createRunWalkLocalComentarioBodySchema.safeParse({
      text: 'Ótimo para caminhada',
      authorName: 'Ana',
    })
    assert.equal(parsed.success, true)
  })
})

describe('upsertPreparacaoRascunhoBodySchema', () => {
  it('aceita rascunho de preparação válido', () => {
    const parsed = upsertPreparacaoRascunhoBodySchema.safeParse({
      modality: 'walk',
      activityName: 'Caminhada tranquila',
      intensity: 'Leve',
      durationMinutes: 30,
      audioConfigured: false,
    })
    assert.equal(parsed.success, true)
  })

  it('rejeita duração inválida', () => {
    const parsed = upsertPreparacaoRascunhoBodySchema.safeParse({
      modality: 'run',
      activityName: 'Corrida',
      intensity: 'Moderada',
      durationMinutes: 0,
      audioConfigured: true,
    })
    assert.equal(parsed.success, false)
  })
})
