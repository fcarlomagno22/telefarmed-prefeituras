import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildMetricasResumoDto,
  buildMetricasResumoLatestDto,
} from './resumo.formatters.js'

describe('resumo.formatters', () => {
  const profile = {
    height: '1,72 m',
    weight: '78,0 kg',
    birthDate: '15/05/1990',
    genderLabel: 'Feminino',
    ageYears: 34,
    ageLabel: '34 anos',
    imc: 26.4,
    imcZone: 'Sobrepeso',
  }

  it('monta latest com IMC do perfil e métricas numéricas', () => {
    const latest = buildMetricasResumoLatestDto({
      profile,
      pesoKg: 78,
      glicemiaMgDl: 98,
      pressaoSistolica: 120,
      pressaoDiastolica: 80,
      hidratacaoMlHoje: 1500,
      circunferenciaAbdomenCm: 92,
      frequenciaBpm: 72,
      passosHoje: 6400,
      distanciaKmHoje: 4.88,
    })

    assert.equal(latest.imc, 26.4)
    assert.equal(latest.imcZone, 'Sobrepeso')
    assert.equal(latest.circunferenciaAbdomenCm, 92)
    assert.equal(latest.passosHoje, 6400)
  })

  it('monta resumo com profile snapshot', () => {
    const latest = buildMetricasResumoLatestDto({
      profile,
      pesoKg: null,
      glicemiaMgDl: null,
      pressaoSistolica: null,
      pressaoDiastolica: null,
      hidratacaoMlHoje: null,
      circunferenciaAbdomenCm: null,
      frequenciaBpm: null,
      passosHoje: null,
      distanciaKmHoje: null,
    })

    const resumo = buildMetricasResumoDto({
      profile,
      profileComplete: true,
      latest,
    })

    assert.equal(resumo.profileComplete, true)
    assert.equal(resumo.profile.weight, '78,0 kg')
    assert.equal(resumo.latest.imc, 26.4)
  })
})
