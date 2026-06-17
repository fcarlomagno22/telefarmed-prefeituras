import type { AdminDoctor } from '../../../types/adminMedicos'
import { adminDoctors, createEmptyAdminDoctor } from '../../../data/adminMedicosMock'
import { mockDelay } from '../delay'

export class AdminProfissionaisAtivosApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminProfissionaisAtivosApiError'
    this.status = status
    this.code = code
  }
}

export function isAdminProfissionaisAtivosApiError(
  error: unknown,
): error is AdminProfissionaisAtivosApiError {
  return error instanceof AdminProfissionaisAtivosApiError
}

export type AtivosSummaryResponse = {
  total: number
  ativos: number
  inativos: number
  online: number
  emPlantao: number
  nacional: number
  porContrato: number
  medicos: number
  psicologos: number
  nutricionistas: number
  fonoaudiologos: number
  averageRating: number
  avgPatientsMonth: number
}

let ativosState: AdminDoctor[] = JSON.parse(JSON.stringify(adminDoctors))

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function ensure(id: string) {
  const row = ativosState.find((item) => item.id === id)
  if (!row) throw new AdminProfissionaisAtivosApiError('Profissional não encontrado.', 404)
  return row
}

export async function fetchAtivosSummary(_accessToken: string): Promise<AtivosSummaryResponse> {
  void _accessToken
  const total = ativosState.length
  const ativos = ativosState.filter((item) => item.status === 'ativo').length
  const inativos = total - ativos
  const online = ativosState.filter((item) => item.isOnlineNow).length
  const emPlantao = ativosState.filter((item) => item.onCallLabel.trim()).length
  const nacional = ativosState.filter((item) => item.allocation === 'nacional').length
  const porContrato = total - nacional
  return mockDelay(
    {
      total,
      ativos,
      inativos,
      online,
      emPlantao,
      nacional,
      porContrato,
      medicos: ativosState.filter((item) => item.profession === 'Médicos').length,
      psicologos: ativosState.filter((item) => item.profession === 'Psicólogos').length,
      nutricionistas: ativosState.filter((item) => item.profession === 'Nutricionistas').length,
      fonoaudiologos: ativosState.filter((item) => item.profession === 'Fonoaudiólogos').length,
      averageRating:
        ativosState.reduce((acc, row) => acc + row.averageRating, 0) / Math.max(1, ativosState.length),
      avgPatientsMonth:
        ativosState.reduce((acc, row) => acc + row.totalPatientsThisMonth, 0) /
        Math.max(1, ativosState.length),
    },
    60,
  )
}

export async function fetchProfissionaisAtivosRows(
  _accessToken: string,
  params?: {
    search?: string
    status?: string
    allocation?: string
    profession?: string
  },
): Promise<AdminDoctor[]> {
  const search = params?.search?.trim().toLowerCase()
  return mockDelay(
    clone(
      ativosState.filter((item) => {
        if (params?.status && item.status !== params.status) return false
        if (params?.allocation && item.allocation !== params.allocation) return false
        if (params?.profession && item.profession !== params.profession) return false
        if (
          search &&
          ![item.name, item.specialty, item.profession, item.city].some((value) =>
            value.toLowerCase().includes(search),
          )
        ) {
          return false
        }
        return true
      }),
    ),
    60,
  )
}

export async function fetchProfissionalAtivoDetail(
  _accessToken: string,
  id: string,
): Promise<AdminDoctor> {
  return mockDelay(clone(ensure(id)), 50)
}

const MOCK_PDF_PREVIEW_URL =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'

export async function fetchProfissionalAtendimentoDocumentDownloadUrl(
  _accessToken: string,
  _profissionalId: string,
  _consultaId: string,
  _documentId: string,
): Promise<string> {
  return mockDelay(MOCK_PDF_PREVIEW_URL, 40)
}

export async function updateProfissionalAtivo(
  _accessToken: string,
  id: string,
  payload: {
    phone?: string
    specialty?: string
    onCallLabel?: string
    status?: 'ativo' | 'inativo'
  },
): Promise<AdminDoctor> {
  const doctor = ensure(id)
  Object.assign(doctor, payload)
  return mockDelay(clone(doctor), 60)
}

export async function inactivateProfissionalAtivo(
  _accessToken: string,
  id: string,
): Promise<AdminDoctor> {
  const doctor = ensure(id)
  doctor.status = 'inativo'
  return mockDelay(clone(doctor), 60)
}

export async function reactivateProfissionalAtivo(
  _accessToken: string,
  id: string,
): Promise<AdminDoctor> {
  const doctor = ensure(id)
  doctor.status = 'ativo'
  return mockDelay(clone(doctor), 60)
}

export async function createProfissionalAtivo(
  _accessToken: string,
  payload: Record<string, unknown>,
): Promise<AdminDoctor> {
  const row = createEmptyAdminDoctor()
  row.id = `prof-${Date.now()}`
  row.name = String(payload.name ?? 'Novo profissional')
  row.specialty = String(payload.specialty ?? 'Clínica Médica')
  row.profession = String(payload.profession ?? 'Médicos') as AdminDoctor['profession']
  row.phone = String(payload.phone ?? '')
  row.cpf = String(payload.cpf ?? '')
  ativosState = [row, ...ativosState]
  return mockDelay(clone(row), 70)
}
