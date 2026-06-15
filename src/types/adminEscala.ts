import type { AdminEscalaWeekday } from '../utils/adminEscala/buildClosedSchedule'
import type { ProfissionalEscalaTurn } from './profissionalEscalaDisponivel'

export type AdminEscalaSelectionMode = 'all' | 'selected'

export type AdminEscalaUbtScopeMode = 'all' | 'selected' | 'tele_only'

export type AdminEscalaShiftStatus = 'rascunho' | 'publicada' | 'cancelada'

export type AdminEscalaModality = 'tele' | 'hibrido' | 'presencial_ubt'

export type AdminEscalaAssignmentMode = 'assigned' | 'open'

export type EscalaRepasseModalidade = 'plantao_fixo' | 'por_consulta' | 'hibrido'

/** Comportamento quando o profissional não cumpre todos os critérios para pagamento integral. */
export type EscalaRepasseTratamentoInelegivel =
  | 'proporcional_consultas'
  | 'aguardando_analise_manual'

export type EscalaRepasseCriteriosPresenca = {
  /** Pagamento integral só se online ≥ este % do turno (ex.: 80). */
  minPercentualOnline: number
  /** Exigir encerramento formal do plantão na agenda. */
  exigeEncerramentoFormal: boolean
  /** Mínimo de consultas concluídas para pagamento integral (≥ N). */
  minConsultasConcluidas: number
  /** Aceita turno sem demanda comprovada (zero na fila/agenda) como critério atendido. */
  aceitaSemDemandaComprovada: boolean
  /** O que fazer quando não cumpre todos os critérios para pagamento integral. */
  tratamentoInelegivel: EscalaRepasseTratamentoInelegivel
}

/** Regra de repasse definida na criação/publicação da escala (campo escala_slots.repasse_regra).
 *  É a fonte da verdade para auditoria e repasse no financeiro — copiada para cada plantão executado
 *  e usada por computePlantaoRepasse. Alterações exigem novo slot ou revisão administrativa após publicação.
 *
 *  TODO(backend): persistir em escala_slots.repasse_regra no batch save; retornar snapshot na auditoria financeira. */
export type EscalaRepasseRule = {
  modalidade: EscalaRepasseModalidade
  valorPlantaoCentavos: number
  valorConsultaCentavos: number
  percentualFixoHibrido?: number
  criteriosPresenca: EscalaRepasseCriteriosPresenca
}

export type AdminEscalaFillStatus = 'na' | 'aberto' | 'parcial' | 'lotado'

export type AdminEscalaExecutionStatus =
  | 'na'
  | 'agendado'
  | 'em_andamento'
  | 'realizado'
  | 'parcial'
  | 'expirado'

export type AdminEscalaPlantaoExecution = {
  plantaoId: string
  profissionalId: string
  profissionalNome: string
  plantaoStatus: 'confirmado' | 'realizado' | 'cancelado' | 'falta_profissional'
  confirmadoEm: string
  enteredAt: string | null
  endedAt: string | null
  sessaoAtiva: boolean
  plantaoEncerrado: boolean
  consultasAgendadas: number
  encaixes: number
  atendidos: number
  naoCompareceu: number
  desistiu: number
  tempoMedioMin: number | null
  duracaoPlantaoMin: number | null
  percentualOnline: number | null
  encerramentoFormal: boolean
}

export type AdminEscalaShiftExecutionDetail = {
  slotId: string
  scheduledStartAt: string
  scheduledEndAt: string
  executionStatus: AdminEscalaExecutionStatus
  realizadoCount: number
  confirmadoCount: number
  totalPlantoes: number
  plantoes: AdminEscalaPlantaoExecution[]
}

export type AdminEscalaClaimCapture = {
  doctorId: string
  doctorName: string
  claimedAt: string
}

export type AdminEscalaPrefeituraScope = {
  mode: AdminEscalaSelectionMode
  prefeituraIds: string[]
  /** Contrato operacional por entidade (prefeitura) selecionada. */
  contratosPorPrefeitura?: Record<string, string>
}

export type AdminEscalaUbtScope = {
  mode: AdminEscalaUbtScopeMode
  ubtIds: string[]
}

export type AdminEscalaScheduleMode = 'single' | 'closed'

/** Um médico (titular + reserva) ou plantão aberto em um bloco de dias/horário. */
export type AdminEscalaProgrammingSlot = {
  id: string
  specialtyId: string
  dailyStart: string
  dailyEnd: string
  weekdays: AdminEscalaWeekday[]
  modality: AdminEscalaModality
  assignmentMode: AdminEscalaAssignmentMode
  primaryDoctorId: string
  backupDoctorIds: string[]
  vacancies: number
  amountCents: number
  /** Regra editável em rascunho — persistida em escala_slots.repasse_regra. */
  repasseRule: EscalaRepasseRule
  unitName: string
  city: string
  cityUf: string
  fullAddress: string | null
  notes: string
}

export type AdminEscalaShift = {
  id: string
  batchId?: string
  contratoEntidadeId?: string | null
  assignmentMode: AdminEscalaAssignmentMode
  primaryDoctorId: string
  backupDoctorIds: string[]
  specialtyId?: string
  specialty: string
  modality: AdminEscalaModality
  startAt: string
  endAt: string
  turn: ProfissionalEscalaTurn
  turnLabel: string
  prefeituraScope: AdminEscalaPrefeituraScope
  ubtScope: AdminEscalaUbtScope
  status: AdminEscalaShiftStatus
  /** Vagas ainda disponíveis (modo aberto). */
  vacancies: number
  /** Vagas totais publicadas (modo aberto). */
  totalVacancies: number
  amountCents: number
  /** Cópia imutável de escala_slots.repasse_regra — usada na auditoria financeira. */
  repasseRule: EscalaRepasseRule
  unitName: string
  city: string
  cityUf: string
  fullAddress: string | null
  claimedCaptures: AdminEscalaClaimCapture[]
  notes: string
  createdAt: string
  updatedAt: string
  executionStatus: AdminEscalaExecutionStatus
  realizadoCount: number
  confirmadoCount: number
  totalPlantoes: number
}

/** JSON em `escala_slots.repasse_regra` — espelha `escalaRepasseRuleSchema` do backend. */
export type EscalaRepasseRuleApi = EscalaRepasseRule

/** Campos de repasse em payloads de slot/plantão (admin batch save e leitura). */
export type EscalaSlotRepasseFieldsApi = {
  amountCents: number
  repasseRule: EscalaRepasseRuleApi
}
