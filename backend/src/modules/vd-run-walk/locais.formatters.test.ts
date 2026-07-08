import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_LOCAIS_RADIUS_KM,
  haversineDistanceKm,
  normalizeListLocaisQuery,
  resolveBoundingBox,
} from './locais.formatters.js'
import { VdRunWalkError } from './errors.js'

describe('locais.formatters', () => {
  it('calcula distância haversine', () => {
    const distance = haversineDistanceKm(
      { latitude: -23.55, longitude: -46.63 },
      { latitude: -23.56, longitude: -46.64 },
    )

    assert.ok(distance > 1 && distance < 2)
  })

  it('resolve bounding box a partir do raio', () => {
    const bounds = resolveBoundingBox(-23.55, -46.63, 10)
    assert.ok(bounds.minLat < -23.55)
    assert.ok(bounds.maxLat > -23.55)
    assert.ok(bounds.minLng < -46.63)
    assert.ok(bounds.maxLng > -46.63)
  })

  it('normaliza query com defaults', () => {
    const normalized = normalizeListLocaisQuery({
      latitude: -23.55,
      longitude: -46.63,
    })

    assert.equal(normalized.radiusKm, DEFAULT_LOCAIS_RADIUS_KM)
    assert.equal(normalized.page, 1)
    assert.equal(normalized.pageSize, 50)
  })

  it('rejeita coordenadas inválidas', () => {
    assert.throws(
      () =>
        normalizeListLocaisQuery({
          latitude: 120,
          longitude: -46.63,
        }),
      (error: unknown) => error instanceof VdRunWalkError,
    )
  })
})
