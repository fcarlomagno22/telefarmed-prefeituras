import assert from 'node:assert/strict'
import test from 'node:test'
import {
  mapRegistrationDataToVdRegisterInput,
  mapVdPacienteUserToAuthUser,
} from './vdAuthMapper.ts'

test('mapVdPacienteUserToAuthUser maps VD address fields to app AuthUser', () => {
  const user = mapVdPacienteUserToAuthUser({
    id: 'paciente-1',
    credencialId: 'credencial-1',
    name: ' Maria Silva ',
    cpf: '226.522.048-58',
    email: ' maria@example.com ',
    phone: '11999998888',
    entidadeContratanteId: 'entidade-1',
    avatarUrl: 'https://cdn.example/avatar.jpg',
    address: {
      cep: '01227-000',
      logradouro: 'Rua da Consolação',
      numero: '100',
      bairro: 'Consolação',
      cidade: 'São Paulo',
      uf: 'SP',
      complemento: 'Apto 12',
    },
  })

  assert.equal(user.name, 'Maria Silva')
  assert.equal(user.email, 'maria@example.com')
  assert.equal(user.address.street, 'Rua da Consolação')
  assert.equal(user.address.number, '100')
  assert.equal(user.address.neighborhood, 'Consolação')
  assert.equal(user.address.complement, 'Apto 12')
  assert.equal(user.selfieUri, 'https://cdn.example/avatar.jpg')
})

test('mapRegistrationDataToVdRegisterInput maps registration payload to VD register input', () => {
  const input = mapRegistrationDataToVdRegisterInput(
    {
      address: {
        cep: '01227-000',
        street: 'Rua da Consolação',
        neighborhood: 'Consolação',
        city: 'São Paulo',
        state: 'SP',
        number: '100',
        complement: '',
      },
      profile: {
        name: 'Maria Silva',
        cpf: '22652204858',
        email: 'maria@example.com',
        phone: '11999998888',
      },
      password: 'SenhaForte1@',
      selfieUri: 'file:///tmp/selfie.jpg',
      legalAcceptances: {
        termsOfUse: true,
        privacyPolicy: true,
        lgpdConsent: true,
        healthDataConsent: true,
        communicationsConsent: false,
        acceptedAt: '2026-07-07T12:00:00.000Z',
      },
    },
    'data:image/jpeg;base64,abc',
  )

  assert.equal(input.fullName, 'Maria Silva')
  assert.equal(input.address.logradouro, 'Rua da Consolação')
  assert.equal(input.address.numero, '100')
  assert.equal(input.registrationConsent.communicationsConsent, false)
  assert.equal(input.photoDataUrl, 'data:image/jpeg;base64,abc')
})
