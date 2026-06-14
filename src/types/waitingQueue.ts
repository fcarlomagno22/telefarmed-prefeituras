import type { AppointmentStatus } from '../data/agendaMock'

export type WaitingQueueOrigin = 'agendado' | 'espontaneo'

/** Entrada da fila de espera (triagem UBT). */
export type WaitingQueueEntry = {
  id: string
  pacienteId?: string
  appointmentId?: string
  patientName: string
  patientCpf: string
  patientPhone?: string
  serviceType: string
  /** ID da especialidade no contrato / catálogo clínico. */
  specialtyId?: string
  /** Horário da consulta (HH:mm), quando agendado. */
  scheduledTime?: string
  origin: WaitingQueueOrigin
  arrivedAt: string
  /** Status da fila ou da consulta (aguardando, chamado, em_atendimento, etc.). */
  status: AppointmentStatus | 'chamado' | 'finalizado' | 'desistiu'
}
