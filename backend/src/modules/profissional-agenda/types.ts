import type { ProfissionalEscalaContext } from '../profissional-escala/types.js'

export type ProfissionalAgendaContext = ProfissionalEscalaContext

export type ProfissionalAgendaShiftStatsApi = {
  previstos: number
  naFila: number
  atendidos: number
  tempoMedioMin: number
}

export type ProfissionalAgendaPlantaoApi = {
  shiftId: string
  plantaoId: string
  escalaSlotId: string
  dateKey: string
  municipality: string
  ubtLabel: string
  specialty: string
  turnLabel: string
  startAt: string
  endAt: string
  startTime: string
  endTime: string
  role: 'titular' | 'reserva'
  modality: 'tele' | 'presencial'
  modalityLabel: string
  plantaoStatus: string
  stats: ProfissionalAgendaShiftStatsApi
}

export type ProfissionalAgendaConsultaApi = {
  id: string
  agendaConsultaId?: string | null
  shiftId: string
  plantaoId: string
  escalaSlotId: string | null
  patientName: string
  patientAge: number
  patientCpf: string
  specialty: string
  serviceType: string
  triageReason: string
  ubtName: string
  scheduledTime?: string
  origin: 'agendado' | 'espontaneo'
  arrivedAt: string
  status:
    | 'aguardando'
    | 'chamado'
    | 'em_atendimento'
    | 'finalizado'
    | 'nao_compareceu'
    | 'desistiu'
  recallCount: number
  calledAt?: string
  attendanceId?: string
  duracaoMinutos?: number
}

export type ProfissionalAgendaNoticeApi = {
  id: string
  type: 'troca' | 'cancelamento' | 'reserva'
  title: string
  body: string
  dateLabel: string
  shiftDateKey?: string
}

export type ProfissionalAgendaOverviewApi = {
  dateFrom: string
  dateTo: string
  plantoes: ProfissionalAgendaPlantaoApi[]
  consultas: ProfissionalAgendaConsultaApi[]
  shiftCountByDate: Record<string, number>
  activeSession: ProfissionalAgendaActiveSessionApi | null
  notices: ProfissionalAgendaNoticeApi[]
}

export type ProfissionalAgendaActiveSessionApi = {
  shiftId: string
  plantaoId: string
  enteredAt: string
  endedAt?: string
  scheduledEndAt?: string
  autoClosePending?: boolean
  summary?: {
    atendidos: number
    naoCompareceu: number
    desistiu: number
    tempoMedioMin: number
    duracaoPlantaoMin: number
    encerramentoFormal?: boolean
    encerramentoAutomatico?: boolean
  }
}

export type ProfissionalAgendaEndShiftSummaryInput = {
  atendidos: number
  naoCompareceu: number
  desistiu: number
  tempoMedioMin: number
  duracaoPlantaoMin: number
}

export type PlantaoConfirmadoRow = {
  id: string
  slot_id: string
  status: string
  profissional_id: string
}

export type AgendaConsultaRow = {
  id: string
  paciente_id: string
  profissional_id: string | null
  escala_slot_id: string | null
  especialidade_id: string
  origem: string
  status: string
  data: string
  hora: string
  observacoes: string
  unidade_ubt_id: string
  pacientes: {
    nome: string
    cpf: string
    data_nascimento: string | null
  }
  config_especialidades: { nome: string }
  unidades_ubt: { nome: string }
}

export type ConsultaClinicaRow = {
  id: string
  codigo_atendimento: string
  agenda_consulta_id: string | null
  status: string
  iniciada_em: string | null
  finalizada_em: string | null
  duracao_minutos: number | null
  sala_espera_entrada_em: string | null
}

export type SlotAgendaRow = {
  id: string
  data: string
  hora_inicio: string
  hora_fim: string
  modalidade: string
  profissional_titular_id: string | null
  fila_reserva: unknown
  unidade_nome: string | null
  cidade: string | null
  cidade_uf: string | null
  especialidade_id: string
  config_especialidades: { nome: string }
}
