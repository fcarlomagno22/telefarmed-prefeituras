import type {
  AdminProfissionalCandidatura,
  AdminCandidaturaDocumentStatus,
} from '../../../types/adminProfissionais'
import { mockDelay } from '../delay'

export class AdminProfissionaisApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminProfissionaisApiError'
    this.status = status
    this.code = code
  }
}

export function isAdminProfissionaisApiError(error: unknown): error is AdminProfissionaisApiError {
  return error instanceof AdminProfissionaisApiError
}

export type CandidaturasSummaryResponse = {
  total: number
  pendente: number
  incompleto: number
  aprovado: number
  reprovado: number
  em_analise: number
  aguardandoFinalizacao: number
}

const candidaturasState: AdminProfissionalCandidatura[] = [
  {
    id: 'cand-1',
    fullName: 'Dra. Camila Teixeira',
    cpf: '123.456.789-00',
    email: 'camila.teixeira@email.com',
    phone: '(11) 98888-1111',
    birthDate: '1990-03-12',
    formation: 'medicina',
    formationLabel: 'Medicina',
    specialty: 'Clínica Médica',
    specialties: [
      { name: 'Clínica Médica', rqe: '77889' },
      { name: 'Cardiologia', rqe: '88123' },
    ],
    councilLabel: 'CRM',
    councilNumber: '123456',
    councilUf: 'SP',
    rqe: '77889',
    professionalDescription: 'Atuação em atenção primária e teleatendimento.',
    addressSummary: 'São Paulo/SP',
    submittedAtLabel: 'Hoje, 10:40',
    status: 'pendente',
    assignedAnalyst: 'Marina Costa',
    documents: [
      {
        id: 'doc-1',
        kind: 'crm',
        label: 'Registro profissional',
        fileName: 'crm.pdf',
        uploadedAtLabel: 'Hoje, 10:39',
        status: 'pendente',
      },
    ],
    empresa: { status: 'nao_informado' },
    timeline: [{ id: 'ev-1', atLabel: 'Hoje, 10:40', title: 'Candidatura recebida' }],
  },
]

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function ensure(candidaturaId: string) {
  const row = candidaturasState.find((item) => item.id === candidaturaId)
  if (!row) throw new AdminProfissionaisApiError('Candidatura não encontrada.', 404)
  return row
}

function computeSummary(): CandidaturasSummaryResponse {
  const inQueue = candidaturasState.filter((item) => item.status !== 'aprovado')
  return {
    total: inQueue.length,
    pendente: inQueue.filter((item) => item.status === 'pendente').length,
    incompleto: inQueue.filter((item) => item.status === 'incompleto').length,
    aprovado: candidaturasState.filter((item) => item.status === 'aprovado').length,
    reprovado: inQueue.filter((item) => item.status === 'reprovado').length,
    em_analise: inQueue.filter((item) => item.status === 'em_analise').length,
    aguardandoFinalizacao: candidaturasState.filter(
      (item) => item.status === 'aprovado' && item.empresa.status === 'aguardando_finalizacao',
    ).length,
  }
}

export async function fetchCandidaturasSummary(
  _accessToken: string,
): Promise<CandidaturasSummaryResponse> {
  void _accessToken
  return mockDelay(computeSummary(), 50)
}

export async function fetchCandidaturasRows(
  _accessToken: string,
  params?: { search?: string; status?: string },
): Promise<AdminProfissionalCandidatura[]> {
  const search = params?.search?.trim().toLowerCase()
  return mockDelay(
    clone(
      candidaturasState.filter((item) => {
        if (item.status === 'aprovado') return false
        if (params?.status && params.status !== 'all' && item.status !== params.status) return false
        if (search && ![item.fullName, item.email, item.specialty].some((v) => v.toLowerCase().includes(search))) {
          return false
        }
        return true
      }),
    ),
    60,
  )
}

export async function fetchCandidaturaDetail(
  _accessToken: string,
  id: string,
): Promise<AdminProfissionalCandidatura> {
  return mockDelay(clone(ensure(id)), 50)
}

export async function reviewCandidaturaDocument(
  _accessToken: string,
  candidaturaId: string,
  documentoId: string,
  payload: { status: AdminCandidaturaDocumentStatus; motivoReprovacao?: string },
): Promise<AdminProfissionalCandidatura> {
  const candidatura = ensure(candidaturaId)
  const document = candidatura.documents.find((item) => item.id === documentoId)
  if (!document) throw new AdminProfissionaisApiError('Documento não encontrado.', 404)
  document.status = payload.status
  document.rejectReason = payload.motivoReprovacao
  candidatura.status = payload.status === 'reprovado' ? 'incompleto' : candidatura.status
  return mockDelay(clone(candidatura), 70)
}

export async function approveCandidatura(
  _accessToken: string,
  candidaturaId: string,
): Promise<{ candidatura: AdminProfissionalCandidatura; accessCode?: string }> {
  const candidatura = ensure(candidaturaId)
  candidatura.status = 'aprovado'
  candidatura.finalizedAtLabel = 'Agora'
  return mockDelay({ candidatura: clone(candidatura), accessCode: 'ACESSO-1234' }, 70)
}

export async function rejectCandidatura(
  _accessToken: string,
  candidaturaId: string,
  motivo: string,
): Promise<AdminProfissionalCandidatura> {
  const candidatura = ensure(candidaturaId)
  candidatura.status = 'reprovado'
  candidatura.timeline.unshift({
    id: `ev-${Date.now()}`,
    atLabel: 'Agora',
    title: 'Candidatura reprovada',
    detail: motivo,
  })
  return mockDelay(clone(candidatura), 70)
}

export async function requestCandidaturaCorrection(
  _accessToken: string,
  candidaturaId: string,
  payload: { mensagem: string; documentoIds: string[] },
): Promise<AdminProfissionalCandidatura> {
  const candidatura = ensure(candidaturaId)
  candidatura.status = 'incompleto'
  candidatura.timeline.unshift({
    id: `ev-${Date.now()}`,
    atLabel: 'Agora',
    title: 'Correção solicitada',
    detail: payload.mensagem,
  })
  for (const document of candidatura.documents) {
    if (payload.documentoIds.includes(document.id)) {
      document.complementRequestedAtLabel = 'Agora'
    }
  }
  return mockDelay(clone(candidatura), 70)
}
