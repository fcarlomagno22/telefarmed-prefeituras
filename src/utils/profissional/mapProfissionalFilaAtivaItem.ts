import type { ProfissionalQueuePatient } from '../../types/profissionalAgenda'

function mapOperationalStatus(
  status: string,
  inWaitingRoom: boolean,
): ProfissionalQueuePatient['status'] {
  if (status === 'em_andamento') return 'em_atendimento'
  if (status === 'aguardando_medico') {
    return inWaitingRoom ? 'chamado' : 'aguardando'
  }
  return 'aguardando'
}

export function mapProfissionalFilaAtivaItemToQueuePatient(
  item: {
    consultaId: string
    codigoAtendimento: string
    agendaConsultaId: string | null
    patientName: string
    patientAge: number
    patientCpf: string
    specialty: string
    ubtName: string
    triageReason: string
    status: string
    inWaitingRoom: boolean
    startedAtIso: string
  },
  shiftId: string,
): ProfissionalQueuePatient {
  return {
    id: item.consultaId,
    agendaConsultaId: item.agendaConsultaId,
    shiftId,
    patientName: item.patientName,
    patientAge: item.patientAge,
    patientCpf: item.patientCpf,
    specialty: item.specialty,
    serviceType: 'Teleconsulta',
    triageReason: item.triageReason,
    ubtName: item.ubtName,
    origin: 'espontaneo',
    arrivedAt: item.startedAtIso,
    status: mapOperationalStatus(item.status, item.inWaitingRoom),
    recallCount: 0,
    attendanceId: item.codigoAtendimento,
  }
}
