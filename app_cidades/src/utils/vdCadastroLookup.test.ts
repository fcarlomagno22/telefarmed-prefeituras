import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  mapLookupPatientToAddress,
  mapLookupPatientToProfile,
} from './vdCadastroLookup.ts'

describe('vdCadastroLookup mappers', () => {
  it('mapeia paciente completo para perfil e endereço', () => {
    const patient = {
      patientId: 'p1',
      fullName: 'Maria Silva',
      cpf: '390.533.447-05',
      email: 'maria@example.com',
      phone: '(11) 98765-4321',
      address: {
        cep: '01310-100',
        logradouro: 'Av Paulista',
        numero: '1000',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP',
        complemento: 'Apto 12',
      },
      dataQuality: 'complete' as const,
    }

    assert.deepEqual(mapLookupPatientToProfile(patient), {
      name: 'Maria Silva',
      cpf: '390.533.447-05',
      email: 'maria@example.com',
      phone: '(11) 98765-4321',
    })

    assert.deepEqual(mapLookupPatientToAddress(patient), {
      cep: '01310-100',
      street: 'Av Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      complement: 'Apto 12',
    })
  })
})
