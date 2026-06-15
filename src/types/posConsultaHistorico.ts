import type { PosConsultaEvolucaoComparacao, PosConsultaMedicacaoAdesao } from './posConsulta'
import type {
  ProfissionalAttendanceStatus,
  ProfissionalIssuedDocumentKind,
} from './profissionalAtendimentos'

export type ProfissionalConsultaHistoricoCheckin = {
  id: string
  checkinNumber: number
  planDayNumber: number
  respondedAtLabel: string
  evolucaoComparacao: PosConsultaEvolucaoComparacao
  intensidadeSintoma: number | null
  medicacaoAdesao: PosConsultaMedicacaoAdesao | null
  summary: string
}

export type ProfissionalConsultaHistoricoDocument = {
  id: string
  kind: ProfissionalIssuedDocumentKind
  title: string
  signedAtLabel: string
}

export type ProfissionalConsultaHistoricoItem = {
  consultaId: string
  attendanceId: string
  dateTimeIso: string
  dateTimeLabel: string
  doctorName: string
  specialty: string
  status: ProfissionalAttendanceStatus
  triageSummary: string
  issuedDocuments: ProfissionalConsultaHistoricoDocument[]
  posConsultaCheckins: ProfissionalConsultaHistoricoCheckin[]
}

export type ProfissionalPacienteHistoricoResponse = {
  pacienteId: string
  patientName: string
  specialty: string
  consultas: ProfissionalConsultaHistoricoItem[]
}
