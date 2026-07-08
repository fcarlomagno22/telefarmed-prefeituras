import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  mapApiGenderLabelToProfile,
  metricsProfileDtoToSnapshot,
  needsMetricsProfileOnboarding,
  onboardingToUpdateInput,
  profileFieldToUpdateInput,
  profileGenderLabelToApi,
} from './metricsProfile'

describe('metricsProfile utils', () => {
  it('retorna snapshot vazio quando o DTO é ausente', () => {
    assert.deepEqual(metricsProfileDtoToSnapshot(undefined), {
      height: '',
      weight: '',
      birthDate: '',
      age: '',
      gender: '',
    })
  })

  it('converte DTO da API para ProfileSnapshot', () => {
    const snapshot = metricsProfileDtoToSnapshot({
      height: '1,72 m',
      weight: '78 kg',
      birthDate: '15/03/1985',
      genderLabel: 'Masculino',
      ageYears: 34,
      ageLabel: '34 anos',
      imc: 26.4,
      imcZone: 'Sobrepeso',
    })

    assert.deepEqual(snapshot, {
      height: '1,72 m',
      weight: '78 kg',
      birthDate: '15/03/1985',
      age: '34 anos',
      gender: 'Masculino',
    })
  })

  it('mapeia gênero da API e do drawer para o backend', () => {
    assert.equal(mapApiGenderLabelToProfile('Não informado'), 'Prefiro não informar')
    assert.equal(profileGenderLabelToApi('Outro'), 'outros')
    assert.equal(profileGenderLabelToApi('Feminino'), 'feminino')
  })

  it('monta payload de onboarding e edição parcial', () => {
    assert.deepEqual(onboardingToUpdateInput('1,72 m', '78 kg', '15/03/1985'), {
      heightMeters: 1.72,
      weightKg: 78,
      birthDate: '1985-03-15',
    })
    assert.deepEqual(profileFieldToUpdateInput('gender', 'Masculino'), {
      gender: 'masculino',
    })
  })

  it('exige onboarding quando faltam dados antropométricos ou nascimento', () => {
    assert.equal(
      needsMetricsProfileOnboarding({
        height: '1,72 m',
        weight: '78 kg',
        birthDate: '',
        age: '',
        gender: '',
      }),
      true,
    )
    assert.equal(
      needsMetricsProfileOnboarding({
        height: '1,72 m',
        weight: '78 kg',
        birthDate: '15/03/1985',
        age: '34 anos',
        gender: '',
      }),
      false,
    )
  })
})
