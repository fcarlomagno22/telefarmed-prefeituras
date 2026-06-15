import type { ProfissionalPacienteHistoricoResponse } from '../../../types/posConsultaHistorico'
import {
  mockProfissionalHistoricoByPaciente,
  mockProfissionalHistoricoPatientNameAliases,
} from '../../../data/posConsultaHistoricoMock'
import { mockDelay } from '../delay'

export class ProfissionalHistoricoApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ProfissionalHistoricoApiError'
    this.status = status
    this.code = code
  }
}

export function isProfissionalHistoricoApiError(
  error: unknown,
): error is ProfissionalHistoricoApiError {
  return error instanceof ProfissionalHistoricoApiError
}

type FetchHistoricoParams = {
  pacienteId?: string
  patientName?: string
  specialty: string
}

function resolvePacienteId(params: FetchHistoricoParams): string | null {
  if (params.pacienteId && mockProfissionalHistoricoByPaciente[params.pacienteId]) {
    return params.pacienteId
  }
  if (params.patientName) {
    const alias = mockProfissionalHistoricoPatientNameAliases[params.patientName]
    if (alias) return alias
  }
  return null
}

export async function fetchProfissionalPacienteHistoricoEspecialidade(
  _accessToken: string,
  params: FetchHistoricoParams,
): Promise<ProfissionalPacienteHistoricoResponse> {
  const pacienteId = resolvePacienteId(params)
  if (!pacienteId) {
    return mockDelay({
      pacienteId: params.pacienteId ?? '',
      patientName: params.patientName ?? 'Paciente',
      specialty: params.specialty,
      consultas: [],
    })
  }

  const entry = mockProfissionalHistoricoByPaciente[pacienteId]
  const specialtyNorm = params.specialty.trim().toLowerCase()
  const consultas = entry.consultas.filter(
    (item) => item.specialty.trim().toLowerCase() === specialtyNorm,
  )

  return mockDelay({
    pacienteId,
    patientName: entry.patientName,
    specialty: params.specialty,
    consultas,
  })
}
