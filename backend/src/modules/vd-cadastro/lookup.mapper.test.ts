import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { AdminMunicipalPatientDetailDto, AdminMunicipalPatientDto } from '../admin-pacientes/types.js'
import {
  hasVdAppRegistrationSubsetFromDetail,
  mapPatientDetailToVdLookupPatient,
  resolveVdCadastroLookupStatus,
  shouldVdRegistrarCredentialsOnly,
} from './lookup.mapper.js'

function buildDetail(
  overrides: Partial<AdminMunicipalPatientDetailDto> = {},
): AdminMunicipalPatientDetailDto {
  return {
    id: 'patient-1',
    name: 'Maria Silva',
    initials: 'MS',
    avatarClassName: 'avatar-1',
    bairro: 'Centro',
    phone: '(11) 98765-4321',
    cpf: '39053344705',
    birthDate: '',
    age: 0,
    lastAppointmentDate: '',
    lastAppointmentRelative: 'Sem consultas',
    totalAppointments: 0,
    municipalRecordId: '1',
    firstAttendanceUnit: '—',
    registeredAt: '2026-07-07',
    monthsWithoutConsultation: null,
    dataQuality: 'incomplete',
    missingFields: ['data de nascimento'],
    municipality: 'Exemplo',
    contractStatus: 'ativo',
    registrationMonthLabel: 'Mai',
    contractingEntityId: 'entity-1',
    contractingEntityRazaoSocial: 'Prefeitura',
    profile: {
      email: 'maria@example.com',
      socialName: '',
      genderLabel: 'Não informado',
      nationality: '',
      raceColor: '',
      guardianName: '',
      guardianCpf: '',
      guardianRelationship: '',
      guardianPhone: '',
      guardianAttendanceAuthorized: false,
      cns: '',
      cnsPendente: true,
      zipCode: '01310-100',
      street: 'Avenida Paulista',
      number: '1000',
      complement: '',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      contacts: [],
      registrationUnit: 'App',
      registeredAt: '2026-07-07',
      notes: '',
    },
    ...overrides,
  }
}

const listagem: Pick<AdminMunicipalPatientDto, 'id' | 'dataQuality'> = {
  id: 'patient-1',
  dataQuality: 'incomplete',
}

describe('hasVdAppRegistrationSubsetFromDetail', () => {
  it('aceita cadastro subset do app sem demografia clínica', () => {
    assert.equal(hasVdAppRegistrationSubsetFromDetail(buildDetail()), true)
  })

  it('rejeita perfil sem e-mail ou endereço completo', () => {
    assert.equal(
      hasVdAppRegistrationSubsetFromDetail(
        buildDetail({
          profile: {
            ...buildDetail().profile!,
            email: '',
          },
        }),
      ),
      false,
    )

    assert.equal(
      hasVdAppRegistrationSubsetFromDetail(
        buildDetail({
          profile: {
            ...buildDetail().profile!,
            number: '',
          },
        }),
      ),
      false,
    )
  })
})

describe('shouldVdRegistrarCredentialsOnly', () => {
  it('aceita paciente UBT completo mesmo com demografia clínica preenchida', () => {
    const detail = buildDetail({
      birthDate: '15/03/1985',
      dataQuality: 'complete',
      missingFields: [],
      profile: {
        ...buildDetail().profile!,
        genderLabel: 'Feminino',
        nationality: 'Brasileira',
        raceColor: 'Parda',
        cns: '898001234567890',
        cnsPendente: false,
        contacts: [{ id: 'c1', name: 'João', phone: '(11) 91234-5678', relationship: 'Pai' }],
      },
    })

    assert.equal(
      shouldVdRegistrarCredentialsOnly({ dataQuality: 'complete' }, detail),
      true,
    )
  })

  it('aceita subset app incompleto', () => {
    assert.equal(
      shouldVdRegistrarCredentialsOnly({ dataQuality: 'incomplete' }, buildDetail()),
      true,
    )
  })

  it('rejeita paciente incompleto sem subset mínimo do app', () => {
    const detail = buildDetail({
      profile: {
        ...buildDetail().profile!,
        email: '',
      },
    })

    assert.equal(
      shouldVdRegistrarCredentialsOnly({ dataQuality: 'incomplete' }, detail),
      false,
    )
  })
})

describe('resolveVdCadastroLookupStatus', () => {
  it('retorna already_registered quando há credencial app', () => {
    const result = resolveVdCadastroLookupStatus({
      hasCredencial: true,
      patient: null,
      patientDetail: null,
      pendingPreCadastro: null,
    })

    assert.deepEqual(result, { status: 'already_registered' })
  })

  it('retorna not_found sem paciente nem pré-cadastro', () => {
    const result = resolveVdCadastroLookupStatus({
      hasCredencial: false,
      patient: null,
      patientDetail: null,
      pendingPreCadastro: null,
    })

    assert.deepEqual(result, { status: 'not_found' })
  })

  it('retorna needs_full_registration para pré-cadastro pendente', () => {
    const result = resolveVdCadastroLookupStatus({
      hasCredencial: false,
      patient: null,
      patientDetail: null,
      pendingPreCadastro: { id: 'pre-1', paciente_id: null },
    })

    assert.deepEqual(result, {
      status: 'needs_full_registration',
      preCadastroId: 'pre-1',
    })
  })

  it('retorna found_complete_needs_credentials com dados do paciente', () => {
    const detail = buildDetail()
    const patient = buildDetail() as AdminMunicipalPatientDto

    const result = resolveVdCadastroLookupStatus({
      hasCredencial: false,
      patient,
      patientDetail: detail,
      pendingPreCadastro: null,
    })

    assert.equal(result.status, 'found_complete_needs_credentials')
    if (result.status !== 'found_complete_needs_credentials') return

    assert.deepEqual(
      result.patient,
      mapPatientDetailToVdLookupPatient(detail, listagem),
    )
  })

  it('retorna found_complete_needs_credentials para paciente UBT completo', () => {
    const detail = buildDetail({
      birthDate: '15/03/1985',
      dataQuality: 'complete',
      missingFields: [],
      avatarUrl: 'https://storage.example/pacientes/avatar.jpg',
      profile: {
        ...buildDetail().profile!,
        genderLabel: 'Feminino',
        nationality: 'Brasileira',
        raceColor: 'Parda',
        cns: '898001234567890',
        cnsPendente: false,
      },
    })
    const patient = {
      ...buildDetail(),
      id: 'patient-ubt-1',
      dataQuality: 'complete' as const,
    } satisfies AdminMunicipalPatientDto

    const result = resolveVdCadastroLookupStatus({
      hasCredencial: false,
      patient,
      patientDetail: detail,
      pendingPreCadastro: null,
    })

    assert.equal(result.status, 'found_complete_needs_credentials')
    if (result.status !== 'found_complete_needs_credentials') return

    assert.equal(result.patient.patientId, 'patient-ubt-1')
    assert.equal(result.patient.dataQuality, 'complete')
    assert.equal(result.patient.photoDataUrl, 'https://storage.example/pacientes/avatar.jpg')
  })

  it('retorna needs_full_registration quando paciente existe sem subset do app', () => {
    const detail = buildDetail({
      profile: {
        ...buildDetail().profile!,
        email: '',
      },
    })
    const patient = buildDetail() as AdminMunicipalPatientDto

    const result = resolveVdCadastroLookupStatus({
      hasCredencial: false,
      patient,
      patientDetail: detail,
      pendingPreCadastro: null,
    })

    assert.deepEqual(result, {
      status: 'needs_full_registration',
      patientId: 'patient-1',
    })
  })
})
