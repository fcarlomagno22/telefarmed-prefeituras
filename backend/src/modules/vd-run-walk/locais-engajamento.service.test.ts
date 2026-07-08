import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { RunningRouteSpotRow } from './locais.formatters.js'
import type { RunningRouteSpotVotoRow } from './locais-engajamento.repository.js'
import {
  createRunWalkLocalComentario,
  listRunWalkLocalComentarios,
  postRunWalkLocalVoto,
  type LocaisEngajamentoServiceDeps,
} from './locais-engajamento.service.js'
import { VdRunWalkError } from './errors.js'
import type { VdRunWalkPacienteScope } from './types.js'

const scope: VdRunWalkPacienteScope = {
  pacienteId: 'pac-1',
  entidadeContratanteId: 'ent-1',
  cpf: '12345678901',
}

function mockSpot(overrides: Partial<RunningRouteSpotRow> = {}): RunningRouteSpotRow {
  return {
    id: 'spot-1',
    name: 'Parque',
    description: 'Descrição longa do parque para corrida.',
    type: 'park',
    latitude: -23.55,
    longitude: -46.63,
    address_label: 'Rua A',
    location_source: 'gps',
    cover_photo_url: null,
    submitted_by_cpf: scope.cpf,
    submitted_by_name: 'Maria',
    recommend_count: 2,
    not_recommend_count: 1,
    entidade_contratante_id: scope.entidadeContratanteId,
    paciente_id: scope.pacienteId,
    created_at: '2026-07-08T10:00:00.000Z',
    ...overrides,
  }
}

function createDeps(initial?: {
  spot?: RunningRouteSpotRow
  vote?: RunningRouteSpotVotoRow | null
  comments?: Array<{ id: string; author_name: string; text: string; criado_em: string }>
}): LocaisEngajamentoServiceDeps {
  let spot = initial?.spot ?? mockSpot()
  let vote = initial?.vote ?? null
  const comments = [...(initial?.comments ?? [])]

  return {
    findSpotById: async () => spot,
    findVote: async () => vote,
    upsertVote: async (_scope, spotId, nextVote) => {
      vote = {
        id: 'vote-1',
        spot_id: spotId,
        paciente_id: scope.pacienteId,
        entidade_contratante_id: scope.entidadeContratanteId,
        vote: nextVote,
        criado_em: '2026-07-08T10:00:00.000Z',
        atualizado_em: '2026-07-08T10:00:00.000Z',
      }
      return vote
    },
    deleteVote: async () => {
      vote = null
    },
    updateCounters: async (_spotId, recommendCount, notRecommendCount) => {
      spot = mockSpot({ recommend_count: recommendCount, not_recommend_count: notRecommendCount })
      return spot
    },
    listComentarios: async ({ page, pageSize }) => {
      const offset = (page - 1) * pageSize
      const rows = comments.slice(offset, offset + pageSize).map((comment) => ({
        id: comment.id,
        spot_id: spot.id,
        paciente_id: scope.pacienteId,
        entidade_contratante_id: scope.entidadeContratanteId,
        author_name: comment.author_name,
        text: comment.text,
        deleted_at: null,
        criado_em: comment.criado_em,
        atualizado_em: comment.criado_em,
      }))
      return { rows, totalCount: comments.length }
    },
    insertComentario: async (_scope, spotId, authorName, text) => {
      const row = {
        id: `comment-${comments.length + 1}`,
        spot_id: spotId,
        paciente_id: scope.pacienteId,
        entidade_contratante_id: scope.entidadeContratanteId,
        author_name: authorName,
        text,
        deleted_at: null,
        criado_em: '2026-07-08T12:00:00.000Z',
        atualizado_em: '2026-07-08T12:00:00.000Z',
      }
      comments.unshift({
        id: row.id,
        author_name: row.author_name,
        text: row.text,
        criado_em: row.criado_em,
      })
      return row
    },
  }
}

describe('postRunWalkLocalVoto', () => {
  it('adiciona voto recomendado e atualiza contadores', async () => {
    const deps = createDeps()
    const result = await postRunWalkLocalVoto(scope, 'spot-1', 'recommend', deps)

    assert.equal(result.userVote, 'recommend')
    assert.equal(result.recommendCount, 3)
    assert.equal(result.notRecommendCount, 1)
  })

  it('remove voto existente com null', async () => {
    const deps = createDeps({
      vote: {
        id: 'vote-1',
        spot_id: 'spot-1',
        paciente_id: scope.pacienteId,
        entidade_contratante_id: scope.entidadeContratanteId,
        vote: 'recommend',
        criado_em: '2026-07-08T10:00:00.000Z',
        atualizado_em: '2026-07-08T10:00:00.000Z',
      },
    })

    const result = await postRunWalkLocalVoto(scope, 'spot-1', null, deps)
    assert.equal(result.userVote, null)
    assert.equal(result.recommendCount, 1)
  })
})

describe('listRunWalkLocalComentarios', () => {
  it('retorna comentários com voto do paciente', async () => {
    const deps = createDeps({
      vote: {
        id: 'vote-1',
        spot_id: 'spot-1',
        paciente_id: scope.pacienteId,
        entidade_contratante_id: scope.entidadeContratanteId,
        vote: 'not-recommend',
        criado_em: '2026-07-08T10:00:00.000Z',
        atualizado_em: '2026-07-08T10:00:00.000Z',
      },
      comments: [
        {
          id: 'c1',
          author_name: 'João',
          text: 'Bom para caminhada',
          criado_em: '2026-07-08T11:00:00.000Z',
        },
      ],
    })

    const result = await listRunWalkLocalComentarios(scope, 'spot-1', {}, deps)
    assert.equal(result.comments.length, 1)
    assert.equal(result.userVote, 'not-recommend')
  })
})

describe('createRunWalkLocalComentario', () => {
  it('cria comentário', async () => {
    const deps = createDeps()
    const result = await createRunWalkLocalComentario(
      scope,
      'spot-1',
      'Local tranquilo',
      'Ana',
      deps,
    )

    assert.equal(result.text, 'Local tranquilo')
    assert.equal(result.authorName, 'Ana')
  })

  it('rejeita texto vazio', async () => {
    await assert.rejects(
      () => createRunWalkLocalComentario(scope, 'spot-1', '  ', 'Ana', createDeps()),
      (error: unknown) => error instanceof VdRunWalkError,
    )
  })
})
