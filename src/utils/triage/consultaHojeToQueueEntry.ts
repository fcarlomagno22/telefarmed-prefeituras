import type { UbtDashboardConsultaHoje } from '../../types/ubtDashboard'
import type { WaitingQueueEntry } from '../../types/waitingQueue'

export function consultaHojeToQueueEntry(
  consultation: UbtDashboardConsultaHoje,
  filaOverrides?: Partial<WaitingQueueEntry>,
): WaitingQueueEntry | null {
  if (!consultation.filaEsperaId) return null

  return {
    id: consultation.filaEsperaId,
    appointmentId: consultation.id,
    pacienteId: consultation.pacienteId,
    patientName: consultation.patient,
    patientCpf: consultation.patientCpf,
    patientPhone: consultation.patientPhone,
    serviceType: consultation.specialty,
    specialtyId: consultation.specialtyId,
    scheduledTime: consultation.time,
    origin: consultation.origin,
    arrivedAt: new Date().toISOString(),
    status: consultation.filaStatus ?? 'aguardando',
    ...filaOverrides,
  }
}
