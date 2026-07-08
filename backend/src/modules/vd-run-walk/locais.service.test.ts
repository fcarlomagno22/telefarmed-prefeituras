import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { RunningRouteSpotRow } from './locais.formatters.js'
import { createRunWalkLocal, listRunWalkLocais, type LocaisServiceDeps } from './locais.service.js'
import type { VdRunWalkPacienteScope } from './types.js'

const scope: VdRunWalkPacienteScope = {
  pacienteId: 'pac-1',
  entidadeContratanteId: 'ent-1',
  cpf: '12345678901',
}

function mockSpot(overrides: Partial<RunningRouteSpotRow> = {}): RunningRouteSpotRow {
  return {
    id: 'spot-1',
    name: 'Parque Central',
    description: 'Ótimo para caminhada leve com pista asfaltada.',
    type: 'park',
    latitude: -23.55,
    longitude: -46.63,
    address_label: 'Av. Paulista',
    location_source: 'gps',
    cover_photo_url: 'https://example.com/cover.jpg',
    submitted_by_cpf: scope.cpf,
    submitted_by_name: 'Maria',
    recommend_count: 2,
    not_recommend_count: 0,
    entidade_contratante_id: scope.entidadeContratanteId,
    paciente_id: scope.pacienteId,
    created_at: '2026-07-08T10:00:00.000Z',
    ...overrides,
  }
}

function createDeps(rows: RunningRouteSpotRow[] = []): LocaisServiceDeps {
  return {
    listInBounds: async () => rows,
    insert: async (_scope, input) =>
      mockSpot({
        id: 'spot-new',
        name: input.name,
        description: input.description,
        type: input.type,
        latitude: input.latitude,
        longitude: input.longitude,
        address_label: input.addressLabel,
        location_source: input.locationSource,
        cover_photo_url: input.coverPhotoReference,
        submitted_by_name: input.submittedByName,
      }),
    createCoverUploadUrl: async (storagePath) => ({
      signedUrl: 'https://upload.example',
      storagePath,
      token: 'token',
      coverPhotoReference: `sb://run-walk-locais-capas/${storagePath}`,
    }),
    buildCoverStoragePath: () => 'ent-1/pac-1/cover.jpg',
  }
}

describe('listRunWalkLocais', () => {
  it('lista spots dentro do raio ordenados por distância', async () => {
    const result = await listRunWalkLocais(
      scope,
      { latitude: -23.55, longitude: -46.63, radiusKm: 5 },
      createDeps([
        mockSpot({ id: 'near', latitude: -23.551, longitude: -46.631 }),
        mockSpot({
          id: 'far',
          latitude: -23.7,
          longitude: -46.9,
          name: 'Longe',
        }),
      ]),
    )

    assert.equal(result.spots.length, 1)
    assert.equal(result.spots[0].id, 'near')
    assert.ok(result.spots[0].distanceKm < 1)
  })
})

describe('createRunWalkLocal', () => {
  it('cria local com foto', async () => {
    const result = await createRunWalkLocal(
      scope,
      {
        name: 'Pista Nova',
        description: 'Boa iluminação e pista larga para corrida.',
        type: 'track',
        latitude: -23.55,
        longitude: -46.63,
        addressLabel: 'Rua A',
        locationSource: 'gps',
        coverPhotoStoragePath: 'ent-1/pac-1/cover.jpg',
      },
      'Maria',
      createDeps(),
    )

    assert.equal(result.name, 'Pista Nova')
    assert.equal(result.type, 'track')
  })

  it('cria local sem foto e sem descrição', async () => {
    const result = await createRunWalkLocal(
      scope,
      {
        name: 'Pista Nova',
        type: 'other',
        latitude: -23.55,
        longitude: -46.63,
        addressLabel: 'Rua A',
        locationSource: 'gps',
      },
      'Maria',
      createDeps(),
    )

    assert.equal(result.name, 'Pista Nova')
    assert.equal(result.type, 'other')
    assert.equal(result.description, '')
  })
})
