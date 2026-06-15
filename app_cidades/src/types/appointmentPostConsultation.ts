import type {
  PosConsultaCheckinRespostas,
  PosConsultaEvolucaoComparacao,
  PosConsultaMeasurementId,
  PosConsultaMedicacaoAdesao,
} from './posConsulta'
import type { StoredAppointment } from './myAppointments'

export type AppointmentPosConsultaPlanStatus = 'ativo' | 'encerrado' | 'indisponivel'

export type AppointmentPosConsultaCheckinStatus =
  | 'pendente'
  | 'respondido'
  | 'expirado'
  | 'agendado'

export type AppointmentPosConsultaCheckinItem = {
  id: string
  checkinNumber: number
  planDayNumber: number
  status: AppointmentPosConsultaCheckinStatus
  scheduledDateLabel: string | null
  respondedAtLabel?: string
  evolucaoComparacao?: PosConsultaEvolucaoComparacao
  intensidadeSintoma?: number | null
  medicacaoAdesao?: PosConsultaMedicacaoAdesao | null
  summary?: string
  token?: string
  respostas?: PosConsultaCheckinRespostas
  requestedMeasurements?: PosConsultaMeasurementId[]
  nextCheckinLabel?: string | null
}

export type AppointmentPosConsultaPlan = {
  appointmentId: string
  appointmentProtocol: string
  status: AppointmentPosConsultaPlanStatus
  planDayNumber: number
  planTotalDays: number
  totalCheckins: number
  respondedCount: number
  nextCheckinLabel: string | null
  patientFirstName: string
  specialtyName: string
  doctorName: string
  checkins: AppointmentPosConsultaCheckinItem[]
  availableCheckinId: string | null
}

export type PostConsultationPlanEntry = {
  appointment: StoredAppointment
  plan: AppointmentPosConsultaPlan
}

export type PostConsultationTab = 'active' | 'closed'
