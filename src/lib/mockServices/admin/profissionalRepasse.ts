import { adminRepasseProfissionalRows } from '../../../data/adminProfissionalRepasseMock'
import {
  createRepasseDraftAndContaPagar,
  hasRepasseContaForCompetencia,
} from '../../../data/adminFinanceiroRepasseStore'
import type {
  AdminRepasseProfissionalCompetenciaRow,
  AdminRepasseProfissionalStatus,
  RepasseCompetenciaAprovadaPayload,
  SubmitPlantaoDecisaoPayload,
} from '../../../types/adminProfissionalRepasse'
import { appendFinanceiroContaPagar, upsertFornecedorForRepasse } from './financeiro'
import { mockDelay } from '../delay'

export class AdminProfissionalRepasseApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminProfissionalRepasseApiError'
    this.status = status
    this.code = code
  }
}

export type AdminRepasseCompetenciasResponse = {
  rows: AdminRepasseProfissionalCompetenciaRow[]
}

export type AdminRepasseCompetenciaMutationResponse = {
  row: AdminRepasseProfissionalCompetenciaRow
}

let repasseRowsState: AdminRepasseProfissionalCompetenciaRow[] = JSON.parse(
  JSON.stringify(adminRepasseProfissionalRows),
)

function cloneRows(rows: AdminRepasseProfissionalCompetenciaRow[]) {
  return JSON.parse(JSON.stringify(rows)) as AdminRepasseProfissionalCompetenciaRow[]
}

function findRow(competenciaId: string) {
  const row = repasseRowsState.find((item) => item.id === competenciaId)
  if (!row) {
    throw new AdminProfissionalRepasseApiError('Competência de repasse não encontrada.', 404, 'NOT_FOUND')
  }
  return row
}

function patchRowStatus(competenciaId: string, status: AdminRepasseProfissionalStatus) {
  repasseRowsState = repasseRowsState.map((item) =>
    item.id === competenciaId ? { ...item, status } : item,
  )
  return findRow(competenciaId)
}

export function resetAdminRepasseMockState() {
  repasseRowsState = cloneRows(adminRepasseProfissionalRows)
}

export async function fetchAdminRepasseCompetencias(
  _token: string,
): Promise<AdminRepasseCompetenciasResponse> {
  await mockDelay()
  return { rows: cloneRows(repasseRowsState) }
}

export async function approveAdminRepasseCompetencia(
  token: string,
  payload: RepasseCompetenciaAprovadaPayload,
): Promise<AdminRepasseCompetenciaMutationResponse> {
  await mockDelay(400)
  const row = findRow(payload.competenciaRow.id)
  if (row.status === 'pago') {
    throw new AdminProfissionalRepasseApiError('Competência já marcada como paga.', 409, 'ALREADY_PAID')
  }
  if (row.status === 'rejeitado') {
    throw new AdminProfissionalRepasseApiError('Competência rejeitada não pode ser aprovada.', 409, 'REJECTED')
  }
  if (row.status === 'aprovado') {
    throw new AdminProfissionalRepasseApiError(
      'Esta competência já possui conta a pagar gerada.',
      409,
      'ALREADY_APPROVED',
    )
  }
  if (hasRepasseContaForCompetencia(payload.competenciaRow.id)) {
    throw new AdminProfissionalRepasseApiError(
      'Esta competência já possui conta a pagar gerada.',
      409,
      'ALREADY_APPROVED',
    )
  }

  const fornecedorId = upsertFornecedorForRepasse(
    payload.competenciaRow.pjCnpj,
    payload.competenciaRow.pjRazaoSocial,
  )
  const { contaPagar } = createRepasseDraftAndContaPagar(payload, fornecedorId)
  await appendFinanceiroContaPagar(token, contaPagar)

  const updated = patchRowStatus(payload.competenciaRow.id, 'aprovado')
  return { row: cloneRows([updated])[0]! }
}

export async function rejectAdminRepasseCompetencia(
  _token: string,
  competenciaId: string,
  _motivo: string,
): Promise<AdminRepasseCompetenciaMutationResponse> {
  await mockDelay(300)
  const row = findRow(competenciaId)
  if (row.status === 'pago') {
    throw new AdminProfissionalRepasseApiError('Não é possível rejeitar competência paga.', 409, 'ALREADY_PAID')
  }
  const updated = patchRowStatus(competenciaId, 'rejeitado')
  return { row: cloneRows([updated])[0]! }
}

export async function requestAdminRepasseCorrecao(
  _token: string,
  competenciaId: string,
  _motivo: string,
): Promise<AdminRepasseCompetenciaMutationResponse> {
  await mockDelay(300)
  const row = findRow(competenciaId)
  return { row: cloneRows([row])[0]! }
}

export async function submitAdminRepassePlantaoDecisao(
  _token: string,
  payload: SubmitPlantaoDecisaoPayload,
): Promise<AdminRepasseCompetenciaMutationResponse> {
  await mockDelay(300)
  const row = findRow(payload.competenciaId)
  if (row.status === 'aprovado' || row.status === 'pago') {
    throw new AdminProfissionalRepasseApiError(
      'Competência já aprovada — decisões de plantão não podem ser alteradas.',
      409,
      'ALREADY_APPROVED',
    )
  }
  if (row.status === 'rejeitado') {
    throw new AdminProfissionalRepasseApiError('Competência rejeitada.', 409, 'REJECTED')
  }

  const observacao = payload.observacao?.trim() ?? ''
  if (payload.decisao === 'indeferido' && observacao.length < 3) {
    throw new AdminProfissionalRepasseApiError(
      'Informe o parecer ao indeferir o plantão (mínimo 3 caracteres).',
      400,
      'INVALID_DATA',
    )
  }

  const updatedPlantoes = row.plantoes.map((plantao) =>
    plantao.id === payload.plantaoId
      ? {
          ...plantao,
          decisaoAnalista: payload.decisao,
          observacaoAnalista: observacao,
          decididoEm: new Date().toISOString(),
        }
      : plantao,
  )

  if (!updatedPlantoes.some((plantao) => plantao.id === payload.plantaoId)) {
    throw new AdminProfissionalRepasseApiError('Plantão não encontrado nesta competência.', 404, 'NOT_FOUND')
  }

  repasseRowsState = repasseRowsState.map((item) =>
    item.id === payload.competenciaId ? { ...item, plantoes: updatedPlantoes } : item,
  )

  return { row: cloneRows([findRow(payload.competenciaId)])[0]! }
}

export async function markAdminRepasseCompetenciaPago(
  _token: string,
  competenciaId: string,
): Promise<AdminRepasseCompetenciaMutationResponse> {
  await mockDelay(350)
  const row = findRow(competenciaId)
  if (row.status !== 'aprovado') {
    throw new AdminProfissionalRepasseApiError(
      'Somente competências aprovadas podem ser marcadas como pagas.',
      409,
      'NOT_APPROVED',
    )
  }
  const updated = patchRowStatus(competenciaId, 'pago')
  return { row: cloneRows([updated])[0]! }
}

export function isAdminProfissionalRepasseApiError(
  error: unknown,
): error is AdminProfissionalRepasseApiError {
  return error instanceof AdminProfissionalRepasseApiError
}
