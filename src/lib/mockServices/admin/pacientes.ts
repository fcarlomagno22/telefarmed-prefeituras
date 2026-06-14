import type {
  AdminContractStatus,
  AdminMunicipalPatient,
  AdminMunicipalPatientDetail,
  AdminPatientContractingEntity,
} from '../../../types/adminPacientes'
import type { PatientProntuarioData } from '../../../types/patientProntuario'
import { prefeituraMunicipalPatients } from '../../../data/prefeituraMunicipalPatientsMock'
import { networkUsers } from '../../../data/networkUsersMock'
import { adminClientesRows } from '../../../data/adminClientesMock'
import { getNetworkUserProfile } from '../../../data/networkUserProfiles'
import { mockDelay } from '../delay'

export class AdminPacientesApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminPacientesApiError'
    this.status = status
    this.code = code
  }
}

export type PacienteApiRow = AdminMunicipalPatient & {
  status?: 'ativo' | 'inativo' | 'pre_cadastro' | 'suspenso'
  uf?: string
  unidadeUbtPrincipalId?: string
  unidadeUbtPrincipalNome?: string
}

export type PacienteDetailApiRow = PacienteApiRow & AdminMunicipalPatientDetail

export type PacientesSummaryResponse = {
  totalPacientes: number
  novosNoMesAtual: number
  contratoAtivo: number
  contratoEncerrado: number
  registrosIncompletos: number
  novosCadastrosPorMes: { label: string; count: number }[]
  cadastrosPorMunicipio: { label: string; registrations: number }[]
  basePorStatusContratual: { label: string; registrations: number }[]
  municipios: string[]
}

export type PreCadastroRegistrationPayload = {
  entidadeContratanteId: string
  unidadeUbtId?: string
  fullName: string
  socialName?: string
  cpf: string
  birthDate: string
  gender: string
  phone?: string
  email?: string
  guardianName?: string
  guardianCpf?: string
  contacts?: { id?: string; name: string; phone: string; relationship?: string }[]
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  photoDataUrl?: string
  concluirImmediately?: boolean
}

export type CreatePacientePayload = PreCadastroRegistrationPayload & {
  status?: 'ativo' | 'inativo' | 'pre_cadastro' | 'suspenso'
}

export type PreCadastroCreateResponse = {
  preCadastroId: string
  paciente?: AdminMunicipalPatient
}

export type ListPacientesParams = {
  search?: string
  municipio?: string
  status?: 'ativo' | 'inativo' | 'pre_cadastro' | 'suspenso' | 'all'
  contractStatus?: AdminContractStatus | 'all'
  entidadeContratanteId?: string
}

export type UpdatePacientePayload = {
  fullName?: string
  socialName?: string
  birthDate?: string
  gender?: string
  phone?: string
  email?: string
  guardianName?: string
  guardianCpf?: string
  contacts?: { id?: string; name: string; phone: string; relationship?: string }[]
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  photoDataUrl?: string
}

let pacientesState: AdminMunicipalPatientDetail[] = prefeituraMunicipalPatients.map((item, index) => {
  const profile = getNetworkUserProfile(item)
  return {
    ...item,
    municipality: adminClientesRows[index % adminClientesRows.length]?.municipio ?? 'Brasília',
    contractStatus: index % 5 === 0 ? 'encerrado' : 'ativo',
    registrationMonthLabel: (['Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai'][index % 6] ??
      'Mai') as AdminMunicipalPatient['registrationMonthLabel'],
    contractingEntityId: adminClientesRows[index % adminClientesRows.length]?.id ?? 'cli-bsb',
    contractingEntityRazaoSocial:
      adminClientesRows[index % adminClientesRows.length]?.razaoSocial ?? 'Prefeitura Municipal',
    ubts: [
      {
        id: `ubt-${index + 1}`,
        nome: profile.registrationUnit,
        principal: true,
        municipio: profile.city,
        uf: profile.state,
      },
    ],
    consultations: profile.consultations.map((consultation) => ({
      ...consultation,
      ubtName: profile.registrationUnit,
    })),
    profile: {
      email: profile.email,
      genderLabel: profile.genderLabel,
      guardianName: profile.guardianName,
      guardianCpf: profile.guardianCpf,
      zipCode: profile.zipCode,
      street: profile.street,
      number: profile.number,
      complement: profile.complement,
      neighborhood: profile.neighborhood,
      city: profile.city,
      state: profile.state,
      contacts: profile.contacts,
      registrationUnit: profile.registrationUnit,
      registeredAt: profile.registeredAt,
      notes: profile.notes,
    },
  }
})

type MockPreCadastroRow = {
  id: string
  payload: PreCadastroRegistrationPayload
  status: 'pendente' | 'concluido' | 'cancelado'
  pacienteId?: string
}

const preCadastroState = new Map<string, MockPreCadastroRow>()

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function ensurePaciente(id: string) {
  const row = pacientesState.find((item) => item.id === id)
  if (!row) throw new AdminPacientesApiError('Paciente não encontrado.', 404)
  return row
}

export function isAdminPacientesApiError(error: unknown): error is AdminPacientesApiError {
  return error instanceof AdminPacientesApiError
}

export function mapApiRowToAdminPatient(row: PacienteApiRow): AdminMunicipalPatient {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    avatarUrl: row.avatarUrl,
    avatarClassName: row.avatarClassName,
    bairro: row.bairro,
    phone: row.phone,
    cpf: row.cpf,
    birthDate: row.birthDate,
    age: row.age,
    lastAppointmentDate: row.lastAppointmentDate,
    lastAppointmentRelative: row.lastAppointmentRelative,
    totalAppointments: row.totalAppointments,
    municipalRecordId: row.municipalRecordId,
    firstAttendanceUnit: row.firstAttendanceUnit,
    registeredAt: row.registeredAt,
    monthsWithoutConsultation: row.monthsWithoutConsultation,
    dataQuality: row.dataQuality,
    missingFields: row.missingFields,
    municipality: row.municipality,
    contractStatus: row.contractStatus,
    registrationMonthLabel: row.registrationMonthLabel,
    contractingEntityId: row.contractingEntityId,
    contractingEntityRazaoSocial: row.contractingEntityRazaoSocial,
  }
}

export function mapApiDetailToAdminPatient(row: PacienteDetailApiRow): AdminMunicipalPatientDetail {
  return {
    ...mapApiRowToAdminPatient(row),
    ubts: row.ubts,
    consultations: row.consultations,
    profile: row.profile,
  }
}

export async function fetchPacientesSummary(
  _accessToken: string,
  params: Pick<ListPacientesParams, 'municipio' | 'entidadeContratanteId'> = {},
): Promise<PacientesSummaryResponse> {
  void _accessToken
  const filtered = pacientesState.filter((item) => {
    if (params.municipio && item.municipality !== params.municipio) return false
    if (params.entidadeContratanteId && item.contractingEntityId !== params.entidadeContratanteId) {
      return false
    }
    return true
  })
  const municipios = Array.from(new Set(filtered.map((item) => item.municipality)))
  return mockDelay(
    {
      totalPacientes: filtered.length,
      novosNoMesAtual: Math.round(filtered.length * 0.2),
      contratoAtivo: filtered.filter((item) => item.contractStatus === 'ativo').length,
      contratoEncerrado: filtered.filter((item) => item.contractStatus === 'encerrado').length,
      registrosIncompletos: filtered.filter((item) => item.dataQuality === 'incomplete').length,
      novosCadastrosPorMes: [
        { label: 'Jan', count: 18 },
        { label: 'Fev', count: 22 },
        { label: 'Mar', count: 19 },
        { label: 'Abr', count: 25 },
        { label: 'Mai', count: 28 },
      ],
      cadastrosPorMunicipio: municipios.map((municipio) => ({
        label: municipio,
        registrations: filtered.filter((item) => item.municipality === municipio).length,
      })),
      basePorStatusContratual: [
        { label: 'Ativo', registrations: filtered.filter((item) => item.contractStatus === 'ativo').length },
        { label: 'Encerrado', registrations: filtered.filter((item) => item.contractStatus === 'encerrado').length },
      ],
      municipios,
    },
    70,
  )
}

export async function fetchPacientesRows(
  _accessToken: string,
  params: ListPacientesParams = {},
): Promise<AdminMunicipalPatient[]> {
  void _accessToken
  const search = params.search?.trim().toLowerCase()
  const rows = pacientesState.filter((item) => {
    if (params.municipio && item.municipality !== params.municipio) return false
    if (params.contractStatus && params.contractStatus !== 'all' && item.contractStatus !== params.contractStatus) {
      return false
    }
    if (params.entidadeContratanteId && item.contractingEntityId !== params.entidadeContratanteId) return false
    if (
      search &&
      ![item.name, item.cpf, item.municipality, item.contractingEntityRazaoSocial].some((value) =>
        value.toLowerCase().includes(search),
      )
    ) {
      return false
    }
    return true
  })
  return mockDelay(clone(rows.map(mapApiRowToAdminPatient)), 70)
}

export async function fetchPacienteDetail(
  _accessToken: string,
  id: string,
): Promise<AdminMunicipalPatientDetail> {
  void _accessToken
  return mockDelay(clone(ensurePaciente(id)), 60)
}

export async function fetchPacienteProntuario(
  _accessToken: string,
  id: string,
  pin: string,
): Promise<PatientProntuarioData> {
  void _accessToken
  if (!/^\d{6}$/.test(pin)) {
    throw new AdminPacientesApiError('Senha de autorização inválida.', 400, 'INVALID_PIN')
  }

  const detail = ensurePaciente(id)
  const profile = getNetworkUserProfile(detail)
  const consultations = detail.consultations ?? profile.consultations

  const entries = consultations
    .filter((item) => item.status === 'concluida')
    .map((item, index) => ({
      id: item.id,
      attendanceId: item.protocol,
      dateTimeIso: new Date().toISOString(),
      dateTimeLabel: `${item.date} · ${item.time}`,
      specialty: item.specialty,
      professionalName: item.professional,
      professionalCrm: 'CRM 12345/DF',
      ubtName: detail.firstAttendanceUnit,
      status: 'concluido' as const,
      durationMinutes: 18 + index * 3,
      triageSummary:
        index === 0
          ? 'Paciente relata sintomas há 3 dias, sem comorbidades graves conhecidas.'
          : undefined,
      clinicalNotes:
        index === 0
          ? 'Paciente orientado quanto à hidratação e repouso relativo. Prescrito analgésico conforme protocolo. Retorno se piora dos sintomas.'
          : 'Evolução favorável. Mantida conduta anterior. Paciente compreendeu orientações.',
      prescriptions:
        index === 0
          ? [
              {
                id: `rx-${item.id}`,
                medicationName: 'Paracetamol 500 mg',
                dosage: '1 comprimido',
                route: 'VO',
                frequency: '8/8h',
                duration: '5 dias',
                notes: 'Se dor ou febre',
              },
            ]
          : [],
      examRequests:
        index === 1
          ? [
              {
                id: `ex-${item.id}`,
                examName: 'Hemograma completo',
                notes: 'Controle evolutivo',
              },
            ]
          : [],
      issuedDocuments:
        index === 0
          ? [
              {
                id: `doc-${item.id}`,
                kind: 'receita',
                title: 'Receita médica',
                meta: 'Paracetamol 500 mg',
                fileName: 'receita-medica.pdf',
                signedAtLabel: item.time,
              },
            ]
          : [],
      patientUploads: [],
      messages: [
        {
          id: `msg-${item.id}-1`,
          from: 'patient' as const,
          time: item.time,
          text: 'Bom dia, doutor(a). Estou com os sintomas descritos na triagem.',
        },
        {
          id: `msg-${item.id}-2`,
          from: 'doctor' as const,
          time: item.time,
          text: 'Olá! Vou avaliar seu caso e registrar as orientações no prontuário.',
        },
      ],
    }))

  return mockDelay(
    clone({
      patient: {
        id: detail.id,
        name: detail.name,
        photoUrl: detail.avatarUrl ?? '',
        birthDate: detail.birthDate,
        age: detail.age,
        genderLabel: detail.profile?.genderLabel ?? '—',
        cpf: detail.cpf,
        municipalRecordId: detail.municipalRecordId,
        municipality: detail.municipality,
        contractingEntityRazaoSocial: detail.contractingEntityRazaoSocial,
        registrationUnit: detail.firstAttendanceUnit,
        registeredAt: detail.registeredAt,
        city: detail.profile?.city ?? detail.municipality,
        neighborhood: detail.profile?.neighborhood ?? detail.bairro,
      },
      entries,
    }),
    80,
  )
}

export async function fetchPacienteByCpf(
  _accessToken: string,
  cpf: string,
  entidadeContratanteId?: string,
): Promise<AdminMunicipalPatient | null> {
  void _accessToken
  const digits = cpf.replace(/\D/g, '')
  const row = pacientesState.find(
    (item) =>
      item.cpf.replace(/\D/g, '') === digits &&
      (!entidadeContratanteId || item.contractingEntityId === entidadeContratanteId),
  )
  return mockDelay(row ? clone(mapApiRowToAdminPatient(row)) : null, 60)
}

export async function fetchPacientesContractingEntities(
  _accessToken: string,
): Promise<AdminPatientContractingEntity[]> {
  void _accessToken
  return mockDelay(
    clone(
      adminClientesRows.map((item) => {
        const activeContract = item.contratos.find((contract) => contract.status === 'ativo')
        return {
          id: item.id,
          razaoSocial: item.razaoSocial,
          municipality: item.municipio,
          uf: item.uf,
          contractStatus: activeContract ? 'ativo' : 'encerrado',
          aceitaPacientesOutrosMunicipios:
            activeContract?.detalhes?.aceitaPacientesOutrosMunicipios ?? false,
        }
      }),
    ),
    60,
  )
}

export async function fetchPacientesMunicipios(_accessToken: string): Promise<string[]> {
  void _accessToken
  return mockDelay(clone(Array.from(new Set(pacientesState.map((item) => item.municipality)))), 50)
}

export async function submitPacientePreCadastro(
  _accessToken: string,
  payload: PreCadastroRegistrationPayload,
): Promise<AdminMunicipalPatient> {
  void _accessToken
  const detail = await createPacienteFromPayload(payload, 'pre_cadastro')
  return mockDelay(clone(mapApiRowToAdminPatient(detail)), 70)
}

function createPacienteFromPayload(
  payload: PreCadastroRegistrationPayload,
  status: PacienteApiRow['status'] = 'ativo',
): AdminMunicipalPatientDetail {
  const base = networkUsers[0]
  const row: AdminMunicipalPatientDetail = {
    ...base,
    id: `pac-${Date.now()}`,
    name: payload.fullName,
    cpf: payload.cpf,
    birthDate: payload.birthDate,
    phone: payload.phone ?? '',
    municipality: payload.city ?? 'Brasília',
    municipalRecordId: `MUN-${Date.now()}`,
    firstAttendanceUnit: payload.unidadeUbtId ?? 'UBT Centro',
    registeredAt: new Date().toISOString().slice(0, 10),
    monthsWithoutConsultation: null,
    dataQuality: 'incomplete',
    missingFields: [],
    contractStatus: 'ativo',
    registrationMonthLabel: 'Mai',
    contractingEntityId: payload.entidadeContratanteId,
    contractingEntityRazaoSocial:
      adminClientesRows.find((item) => item.id === payload.entidadeContratanteId)?.razaoSocial ?? '',
    status,
    ubts: [],
    consultations: [],
    profile: {
      email: payload.email ?? '',
      genderLabel: payload.gender,
      guardianName: payload.guardianName ?? '',
      guardianCpf: payload.guardianCpf ?? '',
      zipCode: payload.zipCode ?? '',
      street: payload.street ?? '',
      number: payload.number ?? '',
      complement: payload.complement ?? '',
      neighborhood: payload.neighborhood ?? '',
      city: payload.city ?? '',
      state: payload.state ?? '',
      contacts: payload.contacts ?? [],
      registrationUnit: payload.unidadeUbtId ?? 'UBT Centro',
      registeredAt: new Date().toISOString().slice(0, 10),
      notes: '',
    },
  }
  pacientesState = [row, ...pacientesState]
  return row
}

export async function createPaciente(
  _accessToken: string,
  payload: CreatePacientePayload,
): Promise<AdminMunicipalPatientDetail> {
  void _accessToken
  const detail = createPacienteFromPayload(payload, payload.status ?? 'ativo')
  return mockDelay(clone(detail), 70)
}

export async function createPacientePreCadastroDraft(
  _accessToken: string,
  payload: PreCadastroRegistrationPayload,
): Promise<PreCadastroCreateResponse> {
  void _accessToken
  const preCadastroId = `pre-${Date.now()}`
  preCadastroState.set(preCadastroId, {
    id: preCadastroId,
    payload,
    status: 'pendente',
  })
  return mockDelay({ preCadastroId }, 60)
}

export async function concludePacientePreCadastro(
  _accessToken: string,
  preCadastroId: string,
): Promise<AdminMunicipalPatient> {
  void _accessToken
  const draft = preCadastroState.get(preCadastroId)
  if (!draft) {
    throw new AdminPacientesApiError('Pré-cadastro não encontrado.', 404)
  }
  if (draft.status === 'cancelado') {
    throw new AdminPacientesApiError('Pré-cadastro cancelado.', 409, 'PRE_CADASTRO_INVALID')
  }
  if (draft.status === 'concluido' && draft.pacienteId) {
    return mockDelay(clone(mapApiRowToAdminPatient(ensurePaciente(draft.pacienteId))), 70)
  }

  const detail = createPacienteFromPayload(draft.payload, 'pre_cadastro')
  preCadastroState.set(preCadastroId, {
    ...draft,
    status: 'concluido',
    pacienteId: detail.id,
  })
  return mockDelay(clone(mapApiRowToAdminPatient(detail)), 70)
}

export async function cancelPacientePreCadastro(
  _accessToken: string,
  preCadastroId: string,
): Promise<void> {
  void _accessToken
  const draft = preCadastroState.get(preCadastroId)
  if (!draft) {
    throw new AdminPacientesApiError('Pré-cadastro não encontrado.', 404)
  }
  if (draft.status === 'concluido') {
    throw new AdminPacientesApiError('Pré-cadastro já concluído.', 409, 'PRE_CADASTRO_INVALID')
  }
  preCadastroState.set(preCadastroId, { ...draft, status: 'cancelado' })
  return mockDelay(undefined, 40)
}

export async function inactivatePaciente(
  _accessToken: string,
  id: string,
): Promise<AdminMunicipalPatientDetail> {
  void _accessToken
  const row = ensurePaciente(id)
  row.status = 'inativo'
  pacientesState = pacientesState.filter((item) => item.id !== id)
  return mockDelay(clone(row), 70)
}

export async function updatePaciente(
  _accessToken: string,
  id: string,
  payload: UpdatePacientePayload,
): Promise<AdminMunicipalPatientDetail> {
  void _accessToken
  const row = ensurePaciente(id)
  if (payload.fullName) row.name = payload.fullName
  if (payload.birthDate) row.birthDate = payload.birthDate
  if (payload.phone) row.phone = payload.phone
  if (payload.email && row.profile) row.profile.email = payload.email
  if (row.profile) {
    if (payload.guardianName !== undefined) row.profile.guardianName = payload.guardianName
    if (payload.guardianCpf !== undefined) row.profile.guardianCpf = payload.guardianCpf
    if (payload.contacts) row.profile.contacts = payload.contacts
    if (payload.zipCode !== undefined) row.profile.zipCode = payload.zipCode
    if (payload.street !== undefined) row.profile.street = payload.street
    if (payload.number !== undefined) row.profile.number = payload.number
    if (payload.complement !== undefined) row.profile.complement = payload.complement
    if (payload.neighborhood !== undefined) row.profile.neighborhood = payload.neighborhood
    if (payload.city !== undefined) row.profile.city = payload.city
    if (payload.state !== undefined) row.profile.state = payload.state
  }
  return mockDelay(clone(row), 70)
}

export async function downloadPacientesExport(
  _accessToken: string,
  params: ListPacientesParams = {},
): Promise<Blob> {
  void _accessToken
  const rows = await fetchPacientesRows('', params)
  const csv = [
    'id,nome,cpf,municipio,statusContrato',
    ...rows.map((row) => `${row.id},${row.name},${row.cpf},${row.municipality},${row.contractStatus}`),
  ].join('\n')
  return mockDelay(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 40)
}

export type {
  AdminContractStatus,
  AdminMunicipalPatient,
  AdminMunicipalPatientDetail,
  AdminPatientContractingEntity,
} from '../../../types/adminPacientes'
