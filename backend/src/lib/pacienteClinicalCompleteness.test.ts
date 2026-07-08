import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  computePatientMissingFields,
  consentimentoRequiresUbtOperatorCompletion,
  isPatientIncompleteForUbtFirstVisit,
} from './pacienteClinicalCompleteness.js'
import { CONSENTIMENTO_CANAL_APP_VD } from './patientRegistrationAppConsent.js'

const appSubsetPatientRow = {
  data_nascimento: null,
  cpf: '39053344705',
  cns: null,
  cns_pendente: true,
  nacionalidade: null,
  raca_cor: null,
  telefone: '(11) 98765-4321',
  email: 'maria@example.com',
  sexo: 'nao_informado',
  contato_emergencia: [],
  endereco: {
    cep: '01310100',
    logradouro: 'Av Paulista',
    numero: '1000',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP',
  },
}

describe('computePatientMissingFields', () => {
  it('marca subset do app como incompleto (demografia, CNS pendente, contatos)', () => {
    const missing = computePatientMissingFields(appSubsetPatientRow)

    assert.ok(missing.includes('data de nascimento'))
    assert.ok(missing.includes('CNS'))
    assert.ok(missing.includes('gênero'))
    assert.ok(missing.includes('nacionalidade'))
    assert.ok(missing.includes('raça/cor'))
    assert.ok(missing.includes('contato de emergência'))
    assert.equal(missing.includes('telefone'), false)
    assert.equal(missing.includes('CEP'), false)
  })

  it('inclui CNS pendente mesmo com CPF válido', () => {
    const missing = computePatientMissingFields({
      ...appSubsetPatientRow,
      data_nascimento: '1990-01-01',
      nacionalidade: 'Brasileira',
      raca_cor: 'Parda',
      sexo: 'feminino',
      contato_emergencia: [{ name: 'João', phone: '11999999999' }],
      cns_pendente: true,
    })

    assert.deepEqual(missing, ['CNS'])
  })
})

describe('consentimentoRequiresUbtOperatorCompletion', () => {
  it('exige operador UBT após consentimento self-service do app', () => {
    assert.equal(
      consentimentoRequiresUbtOperatorCompletion({
        canal: CONSENTIMENTO_CANAL_APP_VD,
        operador_nome: 'Maria Silva',
      }),
      true,
    )
    assert.equal(
      consentimentoRequiresUbtOperatorCompletion({
        operador_nome: 'Autoatendimento',
      }),
      true,
    )
    assert.equal(
      consentimentoRequiresUbtOperatorCompletion({
        operador_nome: 'Operador UBT',
        unidade_ubt_nome: 'UBT Central',
      }),
      false,
    )
  })
})

describe('isPatientIncompleteForUbtFirstVisit', () => {
  it('detecta paciente app incompleto para primeira visita UBT', () => {
    const missingFields = computePatientMissingFields(appSubsetPatientRow)

    assert.equal(
      isPatientIncompleteForUbtFirstVisit(
        {
          dataQuality: 'incomplete',
          missingFields,
          avatarUrl: 'https://example.com/foto.jpg',
        },
        {
          consentimento_cadastro: { canal: CONSENTIMENTO_CANAL_APP_VD },
        },
      ),
      true,
    )
  })

  it('considera completo quando demografia, CNS, contatos e consentimento UBT ok', () => {
    assert.equal(
      isPatientIncompleteForUbtFirstVisit(
        {
          dataQuality: 'complete',
          missingFields: [],
          avatarUrl: 'https://example.com/foto.jpg',
        },
        {
          consentimento_cadastro: {
            operador_nome: 'Operador UBT',
            unidade_ubt_nome: 'UBT Central',
          },
        },
      ),
      false,
    )
  })
})
