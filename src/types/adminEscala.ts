import type { AdminEscalaWeekday } from '../utils/adminEscala/buildClosedSchedule'
import type { ProfissionalEscalaTurn } from './profissionalEscalaDisponivel'

export type AdminEscalaSelectionMode = 'all' | 'selected'

export type AdminEscalaUbtScopeMode = 'all' | 'selected' | 'tele_only'

export type AdminEscalaShiftStatus = 'rascunho' | 'publicada' | 'cancelada'

export type AdminEscalaModality = 'tele' | 'hibrido' | 'presencial_ubt'

export type AdminEscalaAssignmentMode = 'assigned' | 'open'

export type AdminEscalaFillStatus = 'na' | 'aberto' | 'parcial' | 'lotado'

export type AdminEscalaClaimCapture = {
  doctorId: string
  doctorName: string
  claimedAt: string
}

export type AdminEscalaPrefeituraScope = {
  mode: AdminEscalaSelectionMode
  prefeituraIds: string[]
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
  unitName: string
  city: string
  cityUf: string
  fullAddress: string | null
  notes: string
}

export type AdminEscalaShift = {
  id: string
  batchId?: string
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
  unitName: string
  city: string
  cityUf: string
  fullAddress: string | null
  claimedCaptures: AdminEscalaClaimCapture[]
  notes: string
  createdAt: string
  updatedAt: string
}
