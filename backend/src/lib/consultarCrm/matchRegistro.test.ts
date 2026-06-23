import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  mapConsultarCrmRegistro,
  pickBestConsultarCrmRegistro,
} from './matchRegistro.js'

describe('pickBestConsultarCrmRegistro', () => {
  it('prefere médico com nome mais próximo da busca', () => {
    const registros = [
      {
        uf: 'SP',
        numero_registro: '1234568',
        categoria: 'MÉDICO',
        nome_razao_social: 'JOÃO DOS SANTOS SILVA',
      },
      {
        uf: 'SP',
        numero_registro: '1234567',
        categoria: 'MÉDICO',
        nome_razao_social: 'JOÃO DA SILVA',
      },
    ]

    const best = pickBestConsultarCrmRegistro('Joao Silva', registros)
    assert.equal(best?.numero_registro, '1234567')
  })

  it('ignora categorias que não são médico quando houver alternativa', () => {
    const registros = [
      {
        uf: 'SP',
        numero_registro: '9999999',
        categoria: 'ENFERMEIRO',
        nome_razao_social: 'JOAO SILVA',
      },
      {
        uf: 'RJ',
        numero_registro: '1234567',
        categoria: 'MÉDICO',
        nome_razao_social: 'JOAO SILVA',
      },
    ]

    const best = pickBestConsultarCrmRegistro('Joao Silva', registros)
    assert.equal(best?.numero_registro, '1234567')
  })
})

describe('mapConsultarCrmRegistro', () => {
  it('normaliza número e UF do CRM', () => {
    const mapped = mapConsultarCrmRegistro({
      uf: 'sp',
      numero_registro: 'CRM 1234567',
      categoria: 'MÉDICO',
      nome_razao_social: 'JOÃO DA SILVA',
    })

    assert.deepEqual(mapped, {
      conselhoSigla: 'CRM',
      conselhoNumero: '1234567',
      conselhoUf: 'SP',
      nomeRazaoSocial: 'JOÃO DA SILVA',
    })
  })
})
