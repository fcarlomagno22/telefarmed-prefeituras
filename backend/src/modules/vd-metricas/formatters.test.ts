import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildMetricasPerfilDto,
  type PacienteDemographics,
} from './perfil.repository.js'
import {
  calculateImcFromValues,
  formatAgeLabel,
  formatHeightMeters,
  formatWeightKg,
  getImcZoneLabel,
} from './formatters.js'

describe('vd-metricas formatters', () => {
  it('formata altura e peso para exibição', () => {
    assert.equal(formatHeightMeters(1.72), '1,72 m')
    assert.equal(formatWeightKg(78), '78 kg')
    assert.equal(formatWeightKg(78.4), '78,4 kg')
  })

  it('calcula IMC e zona alinhados ao app', () => {
    const imc = calculateImcFromValues(1.72, 78)
    assert.equal(imc, 26.4)
    assert.equal(getImcZoneLabel(imc), 'Sobrepeso')
  })

  it('formata idade em anos', () => {
    assert.equal(formatAgeLabel(1), '1 ano')
    assert.equal(formatAgeLabel(34), '34 anos')
  })
})

describe('buildMetricasPerfilDto', () => {
  const demographics: PacienteDemographics = {
    sexo: 'masculino',
    birthDateIso: '1990-05-15',
  }

  it('monta perfil completo com IMC', () => {
    const dto = buildMetricasPerfilDto(
      {
        id: 'p1',
        paciente_id: 'pac-1',
        entidade_contratante_id: 'ent-1',
        altura_metros: 1.72,
        peso_kg: 78,
        criado_em: '2026-01-01T00:00:00.000Z',
        atualizado_em: '2026-01-01T00:00:00.000Z',
      },
      demographics,
    )

    assert.equal(dto.height, '1,72 m')
    assert.equal(dto.weight, '78 kg')
    assert.equal(dto.birthDate, '15/05/1990')
    assert.equal(dto.genderLabel, 'Masculino')
    assert.equal(dto.ageYears != null && dto.ageYears >= 35, true)
    assert.match(dto.ageLabel ?? '', /anos$/)
    assert.equal(dto.imc, 26.4)
    assert.equal(dto.imcZone, 'Sobrepeso')
  })

  it('retorna nulos quando perfil antropométrico está vazio', () => {
    const dto = buildMetricasPerfilDto(null, demographics)

    assert.equal(dto.height, null)
    assert.equal(dto.weight, null)
    assert.equal(dto.imc, null)
    assert.equal(dto.imcZone, null)
    assert.equal(dto.genderLabel, 'Masculino')
  })
})
