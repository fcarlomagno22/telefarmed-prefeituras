export type { UbtScope } from '../ubt-pacientes/types.js'

export type FilaEsperaStatus =
  | 'aguardando'
  | 'chamado'
  | 'em_atendimento'
  | 'finalizado'
  | 'desistiu'

export type WaitingQueueEntryDto = {
  id: string
  pacienteId: string
  appointmentId: string
  patientName: string
  patientCpf: string
  patientPhone: string
  serviceType: string
  specialtyId: string
  scheduledTime?: string
  origin: 'agendado' | 'espontaneo'
  arrivedAt: string
  status: FilaEsperaStatus | string
}

export type FilaLiveResponseDto = {
  entries: WaitingQueueEntryDto[]
  priorityCount: number
  serverTime: string
}

export type FilaStatusUpdateDto = 'em_atendimento' | 'finalizado' | 'desistiu'
