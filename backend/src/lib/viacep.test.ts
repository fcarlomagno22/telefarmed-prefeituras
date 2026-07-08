import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isValidCepDigits, normalizeCepDigits } from './viacep.js'
import { shouldEnforcePatientMunicipalityTerritory, shouldEnforceVdAppCadastroTerritory } from './patientTerritoryPolicy.js'
import { addressMatchesEntityTerritory } from './municipalityTerritory.js'

describe('viacep helpers', () => {
  it('normaliza e valida CEP', () => {
    assert.equal(normalizeCepDigits('01310-100'), '01310100')
    assert.equal(isValidCepDigits('01310100'), true)
    assert.equal(isValidCepDigits('0131010'), false)
  })
})

describe('territory policy for VD cadastro', () => {
  it('prefeitura sem flag exige município contratante (admin)', () => {
    assert.equal(
      shouldEnforcePatientMunicipalityTerritory('prefeitura', false),
      true,
    )
    assert.equal(
      shouldEnforcePatientMunicipalityTerritory('prefeitura', true),
      false,
    )
    assert.equal(
      shouldEnforcePatientMunicipalityTerritory('santa_casa', false),
      false,
    )
  })

  it('app cidadão respeita flag do contrato para qualquer tipo', () => {
    assert.equal(shouldEnforceVdAppCadastroTerritory(false), true)
    assert.equal(shouldEnforceVdAppCadastroTerritory(true), false)
  })

  it('compara município normalizado', () => {
    assert.equal(addressMatchesEntityTerritory('São Paulo', 'sp', 'Sao Paulo', 'SP'), true)
    assert.equal(addressMatchesEntityTerritory('Campinas', 'SP', 'São Paulo', 'SP'), false)
  })
})
