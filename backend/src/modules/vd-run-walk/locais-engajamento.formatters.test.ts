import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  applyVoteTransition,
  buildComentariosListDto,
  normalizeListComentariosQuery,
} from './locais-engajamento.formatters.js'

describe('locais-engajamento.formatters', () => {
  it('aplica transição de voto recomendado', () => {
    const result = applyVoteTransition(null, 'recommend', 2, 1)
    assert.equal(result.recommendCount, 3)
    assert.equal(result.notRecommendCount, 1)
    assert.equal(result.shouldUpsert, true)
    assert.equal(result.shouldDelete, false)
  })

  it('remove voto ao enviar null', () => {
    const result = applyVoteTransition('recommend', null, 3, 1)
    assert.equal(result.recommendCount, 2)
    assert.equal(result.notRecommendCount, 1)
    assert.equal(result.shouldDelete, true)
  })

  it('troca voto de recomendado para não recomendado', () => {
    const result = applyVoteTransition('recommend', 'not-recommend', 3, 1)
    assert.equal(result.recommendCount, 2)
    assert.equal(result.notRecommendCount, 2)
  })

  it('normaliza paginação de comentários', () => {
    const normalized = normalizeListComentariosQuery({ page: 2, pageSize: 10 })
    assert.equal(normalized.page, 2)
    assert.equal(normalized.pageSize, 10)
  })

  it('monta lista paginada com engajamento', () => {
    const dto = buildComentariosListDto({
      comments: [{ id: 'c1', authorName: 'Ana', text: 'Ótimo', createdAt: '2026-07-08' }],
      totalCount: 1,
      page: 1,
      pageSize: 20,
      userVote: 'recommend',
      recommendCount: 4,
      notRecommendCount: 0,
    })

    assert.equal(dto.comments.length, 1)
    assert.equal(dto.userVote, 'recommend')
    assert.equal(dto.hasMore, false)
  })
})
