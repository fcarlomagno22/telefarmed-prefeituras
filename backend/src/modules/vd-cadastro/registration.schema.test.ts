import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { APP_PACIENTE_REGISTRATION_DEFAULTS } from './registration.constants.js'
import { mapAppPacienteRegistrationToCreatePacienteInput } from './registration.mapper.js'
import { appPacienteRegistrationSchema } from './registration.schema.js'

const validConsent = {
  termsOfUse: true as const,
  privacyPolicy: true as const,
  lgpdConsent: true as const,
  healthDataConsent: true as const,
  communicationsConsent: true as const,
  acceptedAt: '2026-07-07T22:30:00.000Z',
}

const validPayload = {
  fullName: 'Maria Silva',
  cpf: '39053344705',
  email: 'maria@example.com',
  phone: '(11) 98765-4321',
  address: {
    cep: '01310-100',
    logradouro: 'Avenida Paulista',
    numero: '1000',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP',
  },
  registrationConsent: validConsent,
  password: 'Senha@123',
  selfie: 'data:image/jpeg;base64,abc',
}

describe('appPacienteRegistrationSchema', () => {
  it('aceita cadastro subset sem demografia clínica', () => {
    const parsed = appPacienteRegistrationSchema.safeParse(validPayload)
    assert.equal(parsed.success, true)
  })

  it('rejeita CPF inválido e senha fraca', () => {
    const invalidCpf = appPacienteRegistrationSchema.safeParse({
      ...validPayload,
      cpf: '11111111111',
    })
    assert.equal(invalidCpf.success, false)

    const weakPassword = appPacienteRegistrationSchema.safeParse({
      ...validPayload,
      password: '12345678',
    })
    assert.equal(weakPassword.success, false)
  })

  it('exige endereço completo e consentimentos', () => {
    const missingAddress = appPacienteRegistrationSchema.safeParse({
      ...validPayload,
      address: { ...validPayload.address, numero: '' },
    })
    assert.equal(missingAddress.success, false)

    const missingConsent = appPacienteRegistrationSchema.safeParse({
      ...validPayload,
      registrationConsent: { ...validConsent, termsOfUse: false },
    })
    assert.equal(missingConsent.success, false)
  })
})

describe('mapAppPacienteRegistrationToCreatePacienteInput', () => {
  it('mapeia defaults de paciente ativo incompleto para UBT completar', () => {
    const input = appPacienteRegistrationSchema.parse(validPayload)
    const mapped = mapAppPacienteRegistrationToCreatePacienteInput(input, {
      entidadeContratanteId: '11111111-1111-4111-8111-111111111111',
      entityDisplayName: 'Prefeitura de Exemplo',
    })

    assert.equal(mapped.paciente.status, APP_PACIENTE_REGISTRATION_DEFAULTS.status)
    assert.equal(mapped.paciente.gender, APP_PACIENTE_REGISTRATION_DEFAULTS.gender)
    assert.equal(mapped.paciente.cnsPendente, APP_PACIENTE_REGISTRATION_DEFAULTS.cnsPendente)
    assert.equal(mapped.paciente.cadastroOrigem, APP_PACIENTE_REGISTRATION_DEFAULTS.cadastroOrigem)
    assert.equal(mapped.paciente.birthDate, undefined)
    assert.equal(mapped.paciente.nationality, undefined)
    assert.equal(mapped.paciente.raceColor, undefined)
    assert.equal(mapped.paciente.zipCode, '01310100')
    assert.equal(mapped.paciente.photoDataUrl, validPayload.selfie)
    assert.equal(mapped.password, validPayload.password)

    const consentimento = mapped.paciente.consentimentoCadastro as Record<string, unknown>
    assert.equal(consentimento.canal, 'app_vd')
    assert.equal(consentimento.operador_nome, 'Autoatendimento')
    assert.equal(consentimento.paciente_nome, 'Maria Silva')
  })
})
